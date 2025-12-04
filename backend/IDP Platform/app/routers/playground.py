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

@router.post("/extract")
async def upload_and_extract(
    project_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    service: PlaygroundService = Depends(get_service)
):
    # Step 1: Upload the file
    upload_result = await service.upload_file(project_id, file)
    file_id = upload_result["file_id"]

    # Step 2: Run extraction
    extraction_full = await service.run_extraction(
        project_id=project_id,
        document_type=document_type,
        file_id=file_id
    )

    # Build trimmed extraction result
    extraction_result = {
        "status": extraction_full.get("status"),
        "extracted_data": extraction_full.get("extracted_data")
    }

    # Step 3: Return only what you want
    return {
        "file_id": file_id,
        "extraction_result": extraction_result
    }

@router.get("/download/{file_id}")
async def download_file(file_id: str, service: PlaygroundService = Depends(get_service)):
    grid_out, data = await service.download_file(file_id)

    return Response(
        content=data,
        media_type=grid_out.metadata.get("content_type", "application/octet-stream"),
        headers={"Content-Disposition": f"attachment; filename={grid_out.filename}"}
    )

@router.get("/extract/{file_id}")
async def get_extraction_details(
    file_id: str,
    service: PlaygroundService = Depends(get_service)
):
    return await service.get_extraction_details(file_id)

# @router.get("/history/project/{project_id}")
# async def history_project(project_id: str, service: PlaygroundService = Depends(get_service)):
#     return await service.get_history_by_project(project_id)

# @router.get("/history/file/{file_id}")
# async def history_file(file_id: str, service: PlaygroundService = Depends(get_service)):
#     return await service.get_history_by_file(file_id)


# @router.get("/download/extracted/{file_id}")
# async def download_extracted_json(file_id: str, service: PlaygroundService = Depends(get_service)):

#     print("\n==================== DOWNLOAD DEBUG ====================")
#     print("file_id received:", file_id)

#     record = await service.extractions.find_one({"file_id": str(file_id)})

#     print("MongoDB record fetched:", record)

#     if not record:
#         print("⚠️ NO RECORD FOUND FOR file_id:", file_id)
#         raise HTTPException(status_code=404, detail="No extracted data found for this file_id")

#     extracted_json = record.get("result")
#     print("extracted_json:", extracted_json)

#     # If result unexpectedly None or {}, flag it
#     if extracted_json is None:
#         print("❌ ERROR: record['result'] is None")
#     if extracted_json == {}:
#         print("❌ ERROR: record['result'] is EMPTY {}")

#     json_filename = f"extracted_{file_id}.json"
#     json_path = os.path.join(SAVE_DIR, json_filename)

#     # 3. Save file permanently
#     with open(json_path, "w", encoding="utf-8") as f:
#         json.dump(extracted_json, f, indent=4)


#     return FileResponse(
#         json_path,
#         media_type="application/json",
#         filename=json_filename
#     )
