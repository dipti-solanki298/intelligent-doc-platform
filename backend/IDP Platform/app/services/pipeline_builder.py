import os
import re
import json
import time
import requests
import fitz  # PyMuPDF
from uuid import uuid4
from dotenv import load_dotenv
from pypdf import PdfReader
from qdrant_client import QdrantClient, models
from app.services.ocr_handle import doctr_ocr_image

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("API_KEY")

URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """
You are an invoice extraction engine.
Extract structured invoice data and return STRICT JSON only.
If data is missing, return null.
Expected JSON format:
{
  "invoice_number": string or null,
  "invoice_date": string or null,
  "due_date": string or null,
  "currency": string or null,

  "supplier": {
    "name": string or null,
    "address": string or null,
    "tax_id": string or null
  },

  "customer": {
    "name": string or null,
    "address": string or null,
    "tax_id": string or null
  },

  "line_items": [
    {
      "description": string or null,
      "quantity": number or null,
      "unit_price": number or null,
      "line_total": number or null
    }
  ],

  "subtotal": number or null,
  "tax_amount": number or null,
  "total_amount": number or null,
  "payment_terms": string or null,
  "purchase_order_number": string or null,
  "other_references": string or null
}

Note: Don't output markdown fences.
"""

# -----------------------------
# QDRANT (FastEmbed) SETTINGS
# -----------------------------
QDRANT_DB_PATH = "invoice_qdrant_fastembed"
COLLECTION_NAME = "invoice_large_pdf"


# ======================================================================
# QDRANT INITIALIZATION (FASTEMBED MODEL)
# ======================================================================
def init_qdrant():
    client = QdrantClient(path=QDRANT_DB_PATH)

    # Enable built-in FastEmbed model
    client.set_model(client.DEFAULT_EMBEDDING_MODEL)

    # Create collection if not exists
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        vector_params = client.get_fastembed_vector_params()
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=vector_params
        )
    return client

def extract_pdf_pages_for_rag(pdf_path):
    reader = PdfReader(pdf_path)
    docs = []
    metadata = []
    file_id = str(uuid4())

    file_name = os.path.basename(pdf_path)
    abs_path = os.path.abspath(pdf_path)

    # Use PyMuPDF for page → image rendering
    doc_mupdf = fitz.open(pdf_path)

    for page_num, page in enumerate(reader.pages, start=1):

        # 1️⃣ Try normal text extraction first
        text = page.extract_text()
        if text:
            text = text.strip()
        else:
            text = ""

        # 2️⃣ If page is empty → use OCR
        if not text or len(text) < 10:
            print(f"⚠️ Page {page_num}: No text → Running DocTR OCR...")

            # Render page as high-quality image
            pix = doc_mupdf.load_page(page_num - 1).get_pixmap(dpi=200)
            image_bytes = pix.tobytes("png")

            ocr_text = doctr_ocr_image(image_bytes)

            text = ocr_text.strip()
            print("OCR Text",text)

        if not text:
            continue

        docs.append(text)
        metadata.append({
            "file_id": file_id,
            "file_name": file_name,
            "page_num": page_num,
            "path": abs_path
        })

    doc_mupdf.close()
    return docs, metadata, file_id

# ======================================================================
# INDEX LARGE PDF INTO QDRANT
# ======================================================================
def index_pdf_into_qdrant(pdf_path):
    client = init_qdrant()

    docs, metadata, file_id = extract_pdf_pages_for_rag(pdf_path)

    client.add(
        collection_name=COLLECTION_NAME,
        documents=docs,
        metadata=metadata
    )
    client.close()
    return len(docs)
# ======================================================================
# RETRIEVAL USING FASTEMBED
# ======================================================================
def fastembed_retrieve(query, top_k=5):
    client = init_qdrant()
    hits = client.query(
        collection_name=COLLECTION_NAME,
        query_text=query,
        limit=top_k
    )
    client.close()
    return [hit.document for hit in hits]


# ======================================================================
# CLEAN LLM RAW JSON
# ======================================================================
def clean_llm_json(raw: str) -> str:
    raw = raw.strip()

    if raw.startswith("```"):
        raw = re.sub(r"^```[a-zA-Z0-9]*\s*", "", raw)
        raw = re.sub(r"```$", "", raw.strip())

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start:end + 1]

    return raw.strip()


# ======================================================================
# LLM CALL FOR INVOICE EXTRACTION
# ======================================================================
def extract_invoice_from_text(invoice_text: str):

    payload = {
        "model": "amazon/nova-2-lite-v1:free",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract structured invoice data and return JSON:\n\n{invoice_text}"}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.0
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    response = requests.post(URL, headers=headers, json=payload)
    result = response.json()

    if "choices" not in result:
        print("API ERROR RESPONSE:")
        print(json.dumps(result, indent=2))
        raise ValueError("API returned an error — 'choices' missing")

    json_text = clean_llm_json(result["choices"][0]["message"]["content"])

    try:
        return json.loads(json_text)
    except json.JSONDecodeError:
        print("LLM Raw Output:", json_text)
        raise


# ======================================================================
# LARGE PDF → RAG + LLM
# ======================================================================
def extract_invoice_large_pdf(pdf_path):
    print("\n⚡ Large PDF detected — using FastEmbed + Qdrant Retrieval\n")

    total_pages = index_pdf_into_qdrant(pdf_path)
    print(f"Indexed {total_pages} pages\n")

    query = (
        "Find text related to invoice number, dates, totals, taxes, supplier, "
        "customer, line items, amounts, payment terms."
    )

    retrieved = fastembed_retrieve(query, top_k=7)

    context = "\n\n".join(retrieved)

    print("Sending retrieved chunks to LLM...")
    return extract_invoice_from_text(context)


# ======================================================================
# CLEAN NULL VALUES FROM OUTPUT
# ======================================================================
def remove_nulls(data):
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if v is None:
                continue
            cleaned[k] = remove_nulls(v)
        return cleaned
    elif isinstance(data, list):
        return [remove_nulls(x) for x in data]
    return data


# ======================================================================
# TEXT EXTRACTION FOR SMALL PDFs
# ======================================================================
def extract_invoice_text(pdf_path):
    doc = fitz.open(pdf_path)
    lines = []

    for page in doc:
        page_dict = page.get_text("dict")

        for block in page_dict["blocks"]:
            if block["type"] != 0:
                continue

            for line in block["lines"]:
                spans = line["spans"]
                merged = " ".join(span["text"] for span in spans).strip()
                if merged:
                    lines.append(merged)

    doc.close()
    return "\n".join(lines)


# ======================================================================
# PROCESSING DRIVER
# ======================================================================
def get_pdf_files(path):
    if not os.path.exists(path):
        raise FileNotFoundError(path)

    if os.path.isfile(path):
        return [path]

    pdf_list = []
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.lower().endswith(".pdf"):
                pdf_list.append(os.path.join(root, f))
    return pdf_list


# # ======================================================================
# # MAIN
# # ======================================================================
# if __name__ == "__main__":
#     #input_path = "D:/Official/OneDrive - Indium Software India Private Limited/Downloads/rich_sample_invoice_10_pages.pdf"
    
#     #input_path = "D:/Official/OneDrive - Indium Software India Private Limited/Downloads/invoice"
#     input_path = "D:/Official/OneDrive - Indium Software India Private Limited/Downloads/archive/2024/us/wholefoods_20240528_002.pdf"
#     pdf_files = get_pdf_files(input_path)

#     for idx, pdf_path in enumerate(pdf_files, start=1):

#         if idx > 1:
#             print(f"\nWaiting 45 seconds before processing next file...")
#             time.sleep(65)

#         print("\n==============================")
#         print(f"Processing: {pdf_path}")
#         print("==============================")

#         doc = fitz.open(pdf_path)
#         page_count = len(doc)
#         doc.close()

#         print(f"PDF has {page_count} pages.")

#         if page_count > 5:
#             output = extract_invoice_large_pdf(pdf_path)
#         else:
#             print("Small PDF → Extracting directly…")
#             text = extract_invoice_text(pdf_path)
#             print(text)
#             output = extract_invoice_from_text(text)

#         print("Cleaning null values…")
#         clean_output = remove_nulls(output)

#         print("\nFINAL OUTPUT:")
#         print(json.dumps(clean_output, indent=2,ensure_ascii=False))
