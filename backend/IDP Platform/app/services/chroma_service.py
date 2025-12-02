import chromadb
from chromadb.config import Settings
from datetime import datetime
import os

class ChromaVector:

    def __init__(self, persist_path="./chroma_db", **kwargs):
        os.makedirs(persist_path, exist_ok=True)
        self.client = chromadb.Client(
            Settings(
                is_persistent=True,
                persist_directory=persist_path,
            )
        )

        self.collection = self.client.get_or_create_collection("documents")

        self.count = 0
        self.last_sync = None

    def index(self, doc_id: str, vector: list):
        self.collection.add(
            ids=[doc_id],
            embeddings=[vector]
        )
        self.count += 1
        self.last_sync = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def search(self, vector, top_k):
        return self.collection.query(
            query_embeddings=[vector],
            n_results=top_k
        )

    def status(self):
        return self.count, self.last_sync
