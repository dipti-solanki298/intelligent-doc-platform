# import os
# from uuid import uuid4
 
# from pypdf import PdfReader
# from qdrant_client import QdrantClient, models
 
# # ---- Config ----
# QDRANT_DB_PATH = "qdrant_db"          # folder where Qdrant data is stored
# COLLECTION_NAME = "documents"         # collection name in Qdrant
# PDF_PATH = "D:\Official\OneDrive - Indium Software India Private Limited\Downloads\SBI_Withdrawal_Slip.pdf"  # TODO: change to your PDF path
 
 
# def init_qdrant():
#     # Local (embedded) Qdrant, stored on disk
#     client = QdrantClient(path=QDRANT_DB_PATH)  # persists DB to files[web:41][web:69]
 
#     # Enable FastEmbed default model (BAAI/bge-small-en-v1.5)
#     client.set_model(client.DEFAULT_EMBEDDING_MODEL)  # dense embeddings[web:27][web:40]
 
#     # Create collection if not exists, with vector params matching FastEmbed
#     existing = [c.name for c in client.get_collections().collections]
#     if COLLECTION_NAME not in existing:
#         vector_params = client.get_fastembed_vector_params()  # size + distance[web:52][web:62]
#         client.create_collection(
#             collection_name=COLLECTION_NAME,
#             vectors_config=vector_params,
#         )
#     return client
 
 
# def extract_pdf_pages(pdf_path: str):
#     if not os.path.exists(pdf_path):
#         raise FileNotFoundError(f"File not found: {pdf_path}")
 
#     reader = PdfReader(pdf_path)  # load PDF[web:37][web:39]
#     docs = []
#     metadata = []
 
#     file_id = str(uuid4())
#     file_name = os.path.basename(pdf_path)
#     abs_path = os.path.abspath(pdf_path)
 
#     for page_num, page in enumerate(reader.pages, start=1):
#         text = page.extract_text() or ""
#         text = text.strip()
#         if not text:
#             continue
 
#         docs.append(text)
#         metadata.append(
#             {
#                 "file_id": file_id,
#                 "file_name": file_name,
#                 "page_num": page_num,
#                 "path": abs_path,
#             }
#         )
 
#     if not docs:
#         raise ValueError("No text extracted from PDF; check if it needs OCR.")
 
#     return docs, metadata, file_id
 
 
# def main():
#     client = init_qdrant()
#     try:
#         docs, metadata, file_id = extract_pdf_pages(PDF_PATH)
 
#         # FastEmbed helper: embeds and upserts in one call
#         client.add(
#         collection_name=COLLECTION_NAME,
#         documents=docs,
#         metadata=metadata,
#     )
 
#         print(f"Indexed {len(docs)} pages from {PDF_PATH}")
#         print(f"file_id: {file_id}")
#     finally:
#         # Explicit close to avoid portalocker/msvcrt noise on Windows[web:50]
#         client.close()
 
 
# if __name__ == "__main__":
#     main()



# from sentence_transformers import SentenceTransformer
 
# # You can change this to other BGE models (see list below)
# MODEL_NAME = "BAAI/bge-small-en-v1.5"
 
# # Load the model
# model = SentenceTransformer(MODEL_NAME)
 
# texts = [
#     "This is a test sentence.",
#     "BAAI BGE models are useful for embeddings.",
# ]
 
# # Get embeddings (shape: [num_texts, dim])
# embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
 
# print("Embeddings shape:", embeddings.shape)
# print("First embedding (first 5 dims):", embeddings[0][:5])



import requests
import os
import json
 
API_KEY = "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"
URL = "https://openrouter.ai/api/v1/chat/completions"
 
user_prompt = """
I want bill number, bill date,
customer id, vendor name, total amount and currency
"""
 
payload = {
    "model": "z-ai/glm-4.5-air:free",
    "messages": [
        {
            "role": "system",
            "content": (
                "Understand the context clearly and identifiy the feilds in given text"
                "You generate JSON objects only.\n"
                "Do NOT use markdown, code blocks, or explanations.\n"
                "Output must start with { and end with }.\n"
               
            )
        },
        {
            "role": "user",
            "content": (
                "From the following request, identify the fields and return a JSON object.\n"
                "User request:\n"
                f"{user_prompt}"
            )
        }
    ],
    "max_tokens": 2000,
    "temperature": 0,
    "stop": ["```"]
}
 
 
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "Prompt to JSON Schema"
}
 
response = requests.post(URL, json=payload, headers=headers)
data = response.json()
 
content = data.get("choices", [{}])[0].get("message", {}).get("content")
 
print("OUTPUT JSON:")
 
import re
import json
 
def safe_json_parse(text):
    if not text:
        return {}
 
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {}
 
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return {}
 
parsed = safe_json_parse(content)
print(parsed)
 
# print(content)
# print(json.loads(content))
 
 