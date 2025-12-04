from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import List
from app.schemas.models import Project
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from app.core.config import projects_collection
from datetime import datetime
import json
# IMPORTS
from app.core.config import extractions_collection, fs_bucket


router = APIRouter()

# Allowed LLM Models
ALLOWED_MODELS = [
    "openai_gpt4_turbo",
    "gemini_1_5_pro",
    "gemini_flash",
    "deepsearch_claude(opus 4.5)",
]

@router.post("/projects", response_model=Project)
async def create_project(
    project_name: str = Form(...),
    description: str = Form(None),
    document_type: str = Form(...),
    extraction_mode: str = Form(...),
    domain_template: str = Form(...),
    extraction_model: List[str] = Form(...),
    extraction_schema_file: UploadFile = File(None),
):
    # -------- VALIDATE PROJECT NAME --------
    if not project_name.strip():
        raise HTTPException(status_code=400, detail="Project name cannot be empty.")

    # -------- VALIDATE MODELS --------
    if not extraction_model:
        raise HTTPException(
            status_code=400,
            detail="At least one extraction model must be selected."
        )

    for model in extraction_model:
        if model not in ALLOWED_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid extraction model: {model}"
            )

    # CHECK DUPLICATE PROJECT
    existing = await projects_collection.find_one({"project_name": project_name})
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Project '{project_name}' already exists."
        )

    # -------- PARSE SCHEMA --------
    parsed_schema = None
    if extraction_schema_file:
        if not extraction_schema_file.filename.lower().endswith(".json"):
            raise HTTPException(status_code=400, detail="Extraction schema must be a JSON file.")

        try:
            raw_bytes = await extraction_schema_file.read()
            parsed_schema = json.loads(raw_bytes.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid extraction schema JSON.")

        if not isinstance(parsed_schema, dict):
            raise HTTPException(status_code=400, detail="Extraction schema must be a JSON object.")

    # -------- SAVE TO DB ONLY (NO FOLDER CREATION) --------
    project_data = {
        "project_name": project_name,
        "description": description,
        "document_type": document_type,
        "extraction_mode": extraction_mode,
        "domain_template": domain_template,
        "extraction_model": extraction_model,
        "extraction_schema": parsed_schema,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await projects_collection.insert_one(project_data)
    project_data["id"] = str(result.inserted_id)

    return Project(**project_data)

@router.get("/projects", response_model=list[Project])
async def get_projects():
    items = []
    async for doc in projects_collection.find():
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        items.append(Project(**doc))
    return items


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    doc = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not doc:
        raise HTTPException(404, "Project not found")

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return Project(**doc)

@router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_name: str = Form(...),
    description: str = Form(None),
    extraction_schema: str = Form(None),
):
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if not project_name.strip():
        raise HTTPException(status_code=400, detail="Project name cannot be empty.")

    # CHECK DUPLICATE NAME
    existing = await projects_collection.find_one(
        {"project_name": project_name, "_id": {"$ne": ObjectId(project_id)}}
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Another project with name '{project_name}' already exists."
        )

    # -------- REMOVE LOCAL FOLDER RENAME LOGIC --------
    # No folder rename, no folder checks

    # -------- PARSE schema --------
    def safe_parse_json(value):
        if not value:
            return None
        try:
            return json.loads(value)
        except:
            raise HTTPException(status_code=400, detail="Invalid extraction_schema JSON.")

    new_schema = safe_parse_json(extraction_schema)
    old_schema = project.get("extraction_schema") or {}

    if new_schema:
        merged_schema = {**old_schema, **new_schema}
    else:
        merged_schema = old_schema

    # -------- UPDATE DB --------
    update_data = {
        "project_name": project_name,
        "description": description,
        "extraction_schema": merged_schema,
        "updated_at": datetime.utcnow(),
    }

    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )

    updated = await projects_collection.find_one({"_id": ObjectId(project_id)})
    updated["id"] = str(updated["_id"])
    del updated["_id"]

    return Project(**updated)

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):

    # 1. Validate ID
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format.")

    # 2. Get project
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    project_name = project["project_name"]

    
    # --------------------------------------------------------------------
    # 3. DELETE ALL EXTRACTION ENTRIES (even if none exist → no error)
    # --------------------------------------------------------------------
    try:
        await extractions_collection.delete_many({"project_id": project_id})
    except Exception:
        pass   # ignore; should not block delete

    # --------------------------------------------------------------------
    # 4. DELETE ALL GRIDFS FILES FOR THIS PROJECT (if none exist → skip)
    # --------------------------------------------------------------------
    try:
        files_cursor = fs_bucket.find({"metadata.project_id": project_id})

        async for file_doc in files_cursor:
            file_id = file_doc["_id"]
            try:
                await fs_bucket.delete(file_id)
            except Exception:
                # ignore errors for individual file deletions
                pass
    except Exception:
        # GridFS query failure shouldn't stop project delete
        pass

    # --------------------------------------------------------------------
    # 5. DELETE PROJECT FROM DATABASE
    # --------------------------------------------------------------------
    delete_result = await projects_collection.delete_one({"_id": ObjectId(project_id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete project from database.")

    return {
        "message": (
            f"Project '{project_name}' deleted successfully"
        )
    }

