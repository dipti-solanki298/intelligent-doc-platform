# fastapi_app.py

import os
import json
import time
import traceback
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

# Import your existing extraction functions
from app.services.pipeline_builder import (
    extract_invoice_large_pdf,
    extract_invoice_text,
    extract_invoice_from_text,
    extract_pdf_pages_for_rag,
    remove_nulls,
    get_pdf_files
)

import fitz

router = APIRouter()

@router.post("/extract-file")
async def extract_from_file(file: UploadFile = File(...)):
    try:
        # Save temp file
        temp_path = f"temp_{int(time.time())}.pdf"
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Count pages
        doc = fitz.open(temp_path)
        page_count = len(doc)
        doc.close()

        # Extraction logic
        if page_count > 5:
            output = extract_invoice_large_pdf(temp_path)
        else:
            text = extract_invoice_text(temp_path)
            if not text or len(text.strip()) < 10:
                # fallback OCR for small PDFs
                docs, _, _ = extract_pdf_pages_for_rag(temp_path)
                text = "\n\n".join(docs)
            output = extract_invoice_from_text(text)

        clean_output = remove_nulls(output)

        # Cleanup temp file
        os.remove(temp_path)

        return JSONResponse(content=clean_output)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@router.post("/extract-folder")
def extract_from_folder(folder_path: str = Form(...)):
    try:
        if not os.path.exists(folder_path):
            return JSONResponse(
                status_code=400,
                content={"error": "Folder does not exist"}
            )

        pdf_list = get_pdf_files(folder_path)
        results = {}

        for pdf_path in pdf_list:
            try:
                doc = fitz.open(pdf_path)
                page_count = len(doc)
                doc.close()

                if page_count > 5:
                    output = extract_invoice_large_pdf(pdf_path)
                else:
                    text = extract_invoice_text(pdf_path)
                    if not text or len(text.strip()) < 10:
                        docs, _, _ = extract_pdf_pages_for_rag(pdf_path)
                        text = "\n\n".join(docs)
                    output = extract_invoice_from_text(text)

                clean_output = remove_nulls(output)
                results[os.path.basename(pdf_path)] = clean_output

            except Exception as inner_e:
                results[os.path.basename(pdf_path)] = {
                    "error": str(inner_e)
                }

        return JSONResponse(content=results)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
