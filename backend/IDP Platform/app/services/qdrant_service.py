from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from datetime import datetime
import os


class QdrantVector:

    def __init__(self, persist_path="qdrant_db", **kwargs):

        # Ensure the folder exists
        os.makedirs(persist_path, exist_ok=True)

        # Embedded Qdrant (local disk)
        self.client = QdrantClient(path=persist_path)

        self.collection = "documents"

        # List all collections
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]

        # If collection does not exist → create it
        if self.collection not in existing:
            # Since you embed using Instructor/BGE, we define vector_size manually.
            vector_size = 1024   # (InstructorXL = 768, BGE-Large = 1024 → change if needed)

            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )

        self.count = 0
        self.last_sync = None

    def index(self, doc_id: str, vector: list):
        self.client.upsert(
            collection_name=self.collection,
            points=[{
                "id": doc_id,
                "vector": vector,
                "payload": {"doc_id": doc_id}
            }]
        )
        self.count += 1
        self.last_sync = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def search(self, vector, top_k):
        return self.client.search(
            collection_name=self.collection,
            query_vector=vector,
            limit=top_k
        )

    def status(self):
        return self.count, self.last_sync
