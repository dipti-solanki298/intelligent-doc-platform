from app.services.qdrant_service import QdrantVector
from app.services.chroma_service import ChromaVector
from app.services.faiss_service import FaissVector

class VectorManager:

    def __init__(self):
        self.provider = None
        self.engine = None

    def connect(self, provider: str, **kwargs):

        provider = provider.lower()

        if provider == "qdrant":
            self.engine = QdrantVector(**kwargs)

        elif provider == "chroma":
            self.engine = ChromaVector(**kwargs)

        elif provider == "faiss":
            self.engine = FaissVector(**kwargs)

        else:
            raise Exception("Unsupported vector provider")

        self.provider = provider
        return True

    def index(self, doc_id: str, embedding: list):
        self.engine.index(doc_id, embedding)

    def search(self, embedding: list, top_k: int):
        return self.engine.search(embedding, top_k)

    def status(self):
        return self.engine.status()
