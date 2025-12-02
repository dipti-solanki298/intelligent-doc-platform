from fastapi import APIRouter, UploadFile, File, Form, Depends, Response, HTTPException
from bson import ObjectId

from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
import json
import tempfile
import os

from app.schemas.models import FileUploadResponse, ExtractionRequest, ExtractionResponse
from app.services.playground_service import PlaygroundService
from app.core.dependencies import get_gridfs, get_projects_collection, get_extractions_collection

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SAVE_DIR = os.getenv("SAVE_DIR")

router = APIRouter()

def get_service(
    fs=Depends(get_gridfs),
    projects=Depends(get_projects_collection),
    extractions=Depends(get_extractions_collection)
):
    return PlaygroundService(fs, projects, extractions)

@router.post("/upload", response_model=FileUploadResponse)
async def upload_document(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    service: PlaygroundService = Depends(get_service)
):
    return await service.upload_file(project_id, file)

@router.post("/extract", response_model=ExtractionResponse)
async def run_extraction(
    req: ExtractionRequest,
    service: PlaygroundService = Depends(get_service)
):
    return await service.run_extraction(
        project_id=req.project_id,
        document_type=req.document_type,
        file_id=req.file_id
    )


@router.get("/download/{file_id}")
async def download_file(file_id: str, service: PlaygroundService = Depends(get_service)):
    grid_out, data = await service.download_file(file_id)

    return Response(
        content=data,
        media_type=grid_out.metadata.get("content_type", "application/octet-stream"),
        headers={"Content-Disposition": f"attachment; filename={grid_out.filename}"}
    )

@router.get("/history/project/{project_id}")
async def history_project(project_id: str, service: PlaygroundService = Depends(get_service)):
    return await service.get_history_by_project(project_id)

@router.get("/history/file/{file_id}")
async def history_file(file_id: str, service: PlaygroundService = Depends(get_service)):
    return await service.get_history_by_file(file_id)


@router.get("/download/extracted/{file_id}")
async def download_extracted_json(file_id: str, service: PlaygroundService = Depends(get_service)):

    print("\n==================== DOWNLOAD DEBUG ====================")
    print("file_id received:", file_id)

    record = await service.extractions.find_one({"file_id": str(file_id)})

    print("MongoDB record fetched:", record)

    if not record:
        print("⚠️ NO RECORD FOUND FOR file_id:", file_id)
        raise HTTPException(status_code=404, detail="No extracted data found for this file_id")

    extracted_json = record.get("result")
    print("extracted_json:", extracted_json)

    # If result unexpectedly None or {}, flag it
    if extracted_json is None:
        print("❌ ERROR: record['result'] is None")
    if extracted_json == {}:
        print("❌ ERROR: record['result'] is EMPTY {}")

    json_filename = f"extracted_{file_id}.json"
    json_path = os.path.join(SAVE_DIR, json_filename)

    # 3. Save file permanently
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(extracted_json, f, indent=4)


    return FileResponse(
        json_path,
        media_type="application/json",
        filename=json_filename
    )
