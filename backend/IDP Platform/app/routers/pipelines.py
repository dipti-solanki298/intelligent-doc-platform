# # fastapi_app.py

# import os
# import json
# import time
# import traceback
# from fastapi import APIRouter, UploadFile, File, Form
# from fastapi.responses import JSONResponse

# # Import your existing extraction functions
# from app.services.pipeline_builder import (
#     extract_invoice_large_pdf,
#     extract_invoice_text,
#     extract_invoice_from_text,
#     extract_pdf_pages_for_rag,
#     remove_nulls,
#     get_pdf_files
# )

# import fitz

# router = APIRouter()

# @router.post("/extract-file")
# async def extract_from_file(file: UploadFile = File(...)):
#     try:
#         # Save temp file
#         temp_path = f"temp_{int(time.time())}.pdf"
#         with open(temp_path, "wb") as f:
#             f.write(await file.read())

#         # Count pages
#         doc = fitz.open(temp_path)
#         page_count = len(doc)
#         doc.close()

#         # Extraction logic
#         if page_count > 5:
#             output = extract_invoice_large_pdf(temp_path)
#         else:
#             text = extract_invoice_text(temp_path)
#             if not text or len(text.strip()) < 10:
#                 # fallback OCR for small PDFs
#                 docs, _, _ = extract_pdf_pages_for_rag(temp_path)
#                 text = "\n\n".join(docs)
#             output = extract_invoice_from_text(text)

#         clean_output = remove_nulls(output)

#         # Cleanup temp file
#         os.remove(temp_path)

#         return JSONResponse(content=clean_output)

#     except Exception as e:
#         traceback.print_exc()
#         return JSONResponse(
#             status_code=500,
#             content={"error": str(e)}
#         )

# @router.post("/extract-folder")
# def extract_from_folder(folder_path: str = Form(...)):
#     try:
#         if not os.path.exists(folder_path):
#             return JSONResponse(
#                 status_code=400,
#                 content={"error": "Folder does not exist"}
#             )

#         pdf_list = get_pdf_files(folder_path)
#         results = {}

#         for pdf_path in pdf_list:
#             try:
#                 doc = fitz.open(pdf_path)
#                 page_count = len(doc)
#                 doc.close()

#                 if page_count > 5:
#                     output = extract_invoice_large_pdf(pdf_path)
#                 else:
#                     text = extract_invoice_text(pdf_path)
#                     if not text or len(text.strip()) < 10:
#                         docs, _, _ = extract_pdf_pages_for_rag(pdf_path)
#                         text = "\n\n".join(docs)
#                     output = extract_invoice_from_text(text)

#                 clean_output = remove_nulls(output)
#                 results[os.path.basename(pdf_path)] = clean_output

#             except Exception as inner_e:
#                 results[os.path.basename(pdf_path)] = {
#                     "error": str(inner_e)
#                 }

#         return JSONResponse(content=results)

#     except Exception as e:
#         traceback.print_exc()
#         return JSONResponse(
#             status_code=500,
#             content={"error": str(e)}
#         )


# import os
# import zipfile
# import fitz
# from uuid import uuid4
# from fastapi import FastAPI, UploadFile, File, APIRouter
# from fastapi.responses import JSONResponse

# # Import your extraction functions
# from app.services.pipeline_builder import (
#     extract_invoice_text,
#     extract_pdf_pages_for_rag,
#     extract_invoice_from_text,
#     extract_invoice_large_pdf,
#     remove_nulls
# )

# router = APIRouter()

# # ----------------------------------------------
# # BASE PATH FOR LOCAL STORAGE
# # ----------------------------------------------
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# LOCAL_UPLOAD_DIR = os.path.join(BASE_DIR, "uploaded_files")
# os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)


# # ----------------------------------------------
# # 1️⃣ Save uploaded file to local project folder
# # ----------------------------------------------
# def save_uploaded_file_locally(uploaded_file: UploadFile) -> str:
#     upload_id = str(uuid4())[:8]

#     upload_folder = os.path.join(LOCAL_UPLOAD_DIR, upload_id)
#     os.makedirs(upload_folder, exist_ok=True)

#     saved_path = os.path.join(upload_folder, uploaded_file.filename)

#     with open(saved_path, "wb") as f:
#         f.write(uploaded_file.file.read())

#     print(f"[DEBUG] Uploaded file saved to: {saved_path}")
#     return saved_path


# # ----------------------------------------------
# # 2️⃣ Extract ZIP locally and return PDF file paths
# # ----------------------------------------------
# def extract_zip_and_get_pdfs(zip_path: str):
#     extract_id = str(uuid4())[:8]
#     extract_folder = os.path.join(LOCAL_UPLOAD_DIR, f"zip_{extract_id}")
#     os.makedirs(extract_folder, exist_ok=True)

#     with zipfile.ZipFile(zip_path, 'r') as z:
#         z.extractall(extract_folder)

#     print(f"[DEBUG] ZIP extracted to: {extract_folder}")

#     pdf_list = []
#     for root, dirs, files in os.walk(extract_folder):
#         for f in files:
#             if f.lower().endswith(".pdf"):
#                 pdf_list.append(os.path.join(root, f))

#     return pdf_list


# # ----------------------------------------------
# # 3️⃣ Small PDF → Text + OCR fallback
# # ----------------------------------------------
# def extract_small_pdf(pdf_path):
#     text = extract_invoice_text(pdf_path)

#     if not text or len(text.strip()) < 10:
#         docs, _, _ = extract_pdf_pages_for_rag(pdf_path)
#         if docs:
#             text = "\n\n".join(docs)

#     return extract_invoice_from_text(text)


# # ====================================================================
# # 4️⃣ API — Upload PDF or ZIP
# # ====================================================================
# @router.post("/extract-zip")
# async def extract_file(file: UploadFile = File(...)):
#     uploaded_path = save_uploaded_file_locally(file)
#     filename = file.filename.lower()

#     results = {}

#     # ZIP file uploaded
#     if filename.endswith(".zip"):
#         pdf_files = extract_zip_and_get_pdfs(uploaded_path)

#         if not pdf_files:
#             return JSONResponse({"error": "No PDF files found inside ZIP."})

#     # Single PDF uploaded
#     elif filename.endswith(".pdf"):
#         pdf_files = [uploaded_path]

#     else:
#         return JSONResponse({"error": "Only PDF or ZIP files allowed."})

#     # Process each PDF
#     for pdf_path in pdf_files:
#         try:
#             doc = fitz.open(pdf_path)
#             page_count = len(doc)
#             doc.close()

#             if page_count > 5:
#                 output = extract_invoice_large_pdf(pdf_path)
#             else:
#                 output = extract_small_pdf(pdf_path)

#             clean_output = remove_nulls(output)
#             results[os.path.basename(pdf_path)] = clean_output

#         except Exception as e:
#             results[os.path.basename(pdf_path)] = {"error": str(e)}

#     return JSONResponse(results)

import os
import zipfile
from io import BytesIO
import tempfile
from uuid import uuid4
import fitz
from datetime import datetime
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from app.core.config import db, fs_bucket, node_collection

# Import unmodified pipeline_builder methods
from app.services.pipeline_builder import (
    extract_invoice_text,
    extract_pdf_pages_for_rag,
    extract_invoice_from_text,
    extract_invoice_large_pdf,
    remove_nulls
)

router = APIRouter()
pdf_files_collection = db["pdf_files"]


# ---------------------------------------------------------------------
# Create temporary file from bytes (deleted later)
# ---------------------------------------------------------------------
def create_temp_pdf(bytes_data: bytes) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.write(bytes_data)
    tmp.close()
    return tmp.name


# ---------------------------------------------------------------------
# Delete temporary file
# ---------------------------------------------------------------------
def remove_temp(path: str):
    try:
        os.remove(path)
    except:
        pass


# ---------------------------------------------------------------------
# Save file bytes (PDF or ZIP) to GridFS
# ---------------------------------------------------------------------
async def save_to_gridfs(file_bytes: bytes, filename: str, folder_path: str):
    return await fs_bucket.upload_from_stream(
        filename,
        BytesIO(file_bytes),
        metadata={"folder_path": folder_path}
    )


# ---------------------------------------------------------------------
# Save extracted JSON result to MongoDB
# ---------------------------------------------------------------------
async def save_extraction_json(pdf_file_id, json_data):
    doc = {
        "pdf_file_id": pdf_file_id,
        "extracted_json": json_data,
    }
    result = await node_collection.insert_one(doc)
    return result.inserted_id

# ---------------------------------------------------------------------
# Extract PDFs from ZIP (entirely in memory)
# ---------------------------------------------------------------------
def extract_zip_to_memory(zip_bytes: bytes):
    pdf_files = []

    with zipfile.ZipFile(BytesIO(zip_bytes)) as z:
        for zipinfo in z.infolist():
            if zipinfo.filename.lower().endswith(".pdf"):
                pdf_files.append({
                    "filename": os.path.basename(zipinfo.filename),
                    "folder_path": os.path.dirname(zipinfo.filename),
                    "data": z.read(zipinfo.filename)
                })

    return pdf_files


# ---------------------------------------------------------------------
# For PDFs with <=5 pages — extract text + OCR fallback
# ---------------------------------------------------------------------
def process_small_pdf(pdf_bytes: bytes):

    pdf_path = create_temp_pdf(pdf_bytes)

    text = extract_invoice_text(pdf_path)

    if not text or len(text.strip()) < 10:
        docs, _, _ = extract_pdf_pages_for_rag(pdf_path)
        text = "\n\n".join(docs) if docs else ""

    result = remove_nulls(extract_invoice_from_text(text))

    remove_temp(pdf_path)
    return result


# ---------------------------------------------------------------------
# For PDFs with >5 pages — use RAG pipeline
# ---------------------------------------------------------------------
def process_large_pdf(pdf_bytes: bytes):

    pdf_path = create_temp_pdf(pdf_bytes)

    result = extract_invoice_large_pdf(pdf_path)

    remove_temp(pdf_path)
    return result


# ---------------------------------------------------------------------
# MAIN API — Upload ZIP or PDF and run extraction
# ---------------------------------------------------------------------
@router.post("/extract-zip")
async def extract_file(file: UploadFile = File(...)):

    uploaded_bytes = await file.read()
    filename = file.filename.lower()

    result_list = []

    # -------------------------------------------------------
    # Case 1: ZIP file uploaded
    # -------------------------------------------------------
    if filename.endswith(".zip"):
        pdf_files = extract_zip_to_memory(uploaded_bytes)

        if not pdf_files:
            return JSONResponse({"error": "ZIP contains no PDF files"})

        zip_id = await save_to_gridfs(uploaded_bytes, file.filename, folder_path="")

    # -------------------------------------------------------
    # Case 2: Single PDF uploaded
    # -------------------------------------------------------
    elif filename.endswith(".pdf"):
        pdf_files = [{
            "filename": file.filename,
            "folder_path": "",
            "data": uploaded_bytes
        }]
        zip_id = None

    else:
        return JSONResponse({"error": "Only PDF or ZIP allowed"})


    # -------------------------------------------------------
    # Process every PDF from ZIP or single PDF input
    # -------------------------------------------------------
    for pdf in pdf_files:

        pdf_bytes = pdf["data"]
        pdf_name = pdf["filename"]
        folder_path = pdf["folder_path"]

        # Store original PDF in GridFS
        pdf_file_id = await save_to_gridfs(pdf_bytes, pdf_name, folder_path)

        # Determine page count using temp file
        temp_pdf_path = create_temp_pdf(pdf_bytes)

        doc = fitz.open(temp_pdf_path)
        page_count = len(doc)
        doc.close()

        remove_temp(temp_pdf_path)

        # -------------------------------------------------------
        # Run pipeline (small or large)
        # -------------------------------------------------------
        if page_count > 5:
            extracted_json = process_large_pdf(pdf_bytes)
        else:
            extracted_json = process_small_pdf(pdf_bytes)

        # Save extracted JSON in MongoDB
        json_id = await save_extraction_json(pdf_file_id, extracted_json)

        # Save metadata in collection
        await pdf_files_collection.insert_one({
            "status" : "Success",
            "filename": pdf_name,
            "folder_path": folder_path,
            "pdf_gridfs_id": pdf_file_id,
            "json_id": json_id,
            "zip_id": zip_id,
            "page_count": page_count,
            "extracted_json":extracted_json,
            "created_at": datetime.utcnow()
        })

        result_list.append({
            "filename": pdf_name,
            "folder": folder_path,
            "pdf_file_id": str(pdf_file_id),
            "json_id": str(json_id),
            "page_count": page_count

        })


    # -------------------------------------------------------
    # Return final response
    # -------------------------------------------------------
    return JSONResponse({
        "zip_id": str(zip_id) if zip_id else None,
        "files_processed": result_list
    })


from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId

@router.get("/download/pdf/{file_id}")
async def download_pdf(file_id: str):

    try:
        oid = ObjectId(file_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid PDF file ID")

    stream = await fs_bucket.open_download_stream(oid)

    if not stream:
        raise HTTPException(status_code=404, detail="PDF not found")

    return StreamingResponse(
        stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={stream.filename}"
        }
    ) 