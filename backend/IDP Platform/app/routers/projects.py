from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import List
from app.schemas.models import Project
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from app.core.config import projects_collection
from datetime import datetime
import json
import os
import shutil

router = APIRouter()

# # Allowed LLM Models
# ALLOWED_MODELS = [
#     "openai_gpt4_turbo",
#     "gemini_1_5_pro",
#     "gemini_flash",
#     "deepsearch_claude(opus 4.5)",
# ]

# @router.post("/projects", response_model=Project)
# async def create_project(
#     project_name: str = Form(...),
#     description: str = Form(None),
#     document_type: str = Form(...),
#     extraction_mode: str = Form(...),
#     domain_template: str = Form(...),
#     extraction_model: List[str] = Form(...),        # <-- MULTIPLE MODELS
#     extraction_schema_file: UploadFile = File(None)
# ):
#     if not project_name.strip():
#         raise HTTPException(status_code=400, detail="Project name cannot be empty.")
#     if not extraction_model:
#         raise HTTPException(
#             status_code=400, 
#             detail="At least one extraction model must be selected."
#         )
#     # Ensure each selected model is allowed
#     for model in extraction_model:
#         if model not in ALLOWED_MODELS:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Invalid extraction model: {model}"
#             )
#     existing = await projects_collection.find_one({"project_name": project_name})
#     if existing:
#         raise HTTPException(status_code=400, detail=f"Project '{project_name}' already exists.")
#     parsed_schema = None
#     if extraction_schema_file:
#         if not extraction_schema_file.filename.lower().endswith(".json"):
#             raise HTTPException(status_code=400, detail="Extraction schema must be a JSON file.")
#         try:
#             raw_bytes = await extraction_schema_file.read()
#             parsed_schema = json.loads(raw_bytes.decode("utf-8"))
#         except Exception:
#             raise HTTPException(status_code=400, detail="Invalid extraction schema JSON.")
#         if not isinstance(parsed_schema, dict):
#             raise HTTPException(status_code=400, detail="Extraction schema must be a JSON object.")
#     project_data = {
#         "project_name": project_name,
#         "description": description,
#         "document_type": document_type,
#         "extraction_mode": extraction_mode,
#         "domain_template": domain_template,
#         "extraction_model": extraction_model,   # <-- STORE LIST
#         "extraction_schema": parsed_schema,
#         "created_at": datetime.utcnow(),
#         "updated_at": datetime.utcnow(),
#     }

#     result = await projects_collection.insert_one(project_data)
#     project_data["id"] = str(result.inserted_id)

#     return Project(**project_data)


# Allowed LLM Models
ALLOWED_MODELS = [
    "openai_gpt4_turbo",
    "gemini_1_5_pro",
    "gemini_flash",
    "deepsearch_claude(opus 4.5)",
]

# Base folder where all project directories will be created
PROJECT_BASE_PATH = "project_data"

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
    # ----------- VALIDATE PROJECT NAME ----------------
    if not project_name.strip():
        raise HTTPException(status_code=400, detail="Project name cannot be empty.")

    # ----------- VALIDATE MODELS ----------------------
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

    # CHECK IF PROJECT ALREADY EXISTS IN DB
    existing = await projects_collection.find_one({"project_name": project_name})
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Project '{project_name}' already exists."
        )

    # ----------- CHECK / CREATE PROJECT FOLDER -------------------
    project_folder = os.path.join(PROJECT_BASE_PATH, project_name)

    # Create base directory first (if not present)
    os.makedirs(PROJECT_BASE_PATH, exist_ok=True)

    if os.path.exists(project_folder):
        raise HTTPException(
            status_code=400,
            detail=f"Folder '{project_name}' already exists."
        )

    try:
        os.makedirs(project_folder)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project folder: {str(e)}"
        )

    # ----------- PARSE SCHEMA FILE (optional) --------------------
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

    # ----------- BUILD PROJECT DATA --------------------
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

    # Check duplicate project names
    existing = await projects_collection.find_one(
        {"project_name": project_name, "_id": {"$ne": ObjectId(project_id)}}
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Another project with name '{project_name}' already exists."
        )

    # Old and new folder paths
    old_project_name = project["project_name"]
    old_folder = os.path.join(PROJECT_BASE_PATH, old_project_name)
    new_folder = os.path.join(PROJECT_BASE_PATH, project_name)

    # ---- RENAME FOLDER IF NAME CHANGED ----
    if old_project_name != project_name:
        # If old folder exists → rename it
        if os.path.exists(old_folder):
            try:
                os.rename(old_folder, new_folder)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to rename project folder: {str(e)}"
                )
        else:
            # If folder not found → create new folder
            try:
                os.makedirs(new_folder, exist_ok=True)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create new project folder: {str(e)}"
                )

    # ---- PARSE JSON ----
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

    # ---- UPDATE DATABASE ----
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
    # Validate ObjectId
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format.")

    # Check if project exists
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    project_name = project["project_name"]

    # Delete project from DB
    delete_result = await projects_collection.delete_one({"_id": ObjectId(project_id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete project from database.")

    # Delete project folder
    project_folder = os.path.join(PROJECT_BASE_PATH, project_name)

    if os.path.exists(project_folder):
        try:
            shutil.rmtree(project_folder)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Project deleted from DB but folder deletion failed: {str(e)}"
            )

    return {"message": f"Project '{project_name}' deleted successfully."}

