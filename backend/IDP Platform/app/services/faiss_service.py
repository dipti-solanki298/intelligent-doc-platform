import faiss
import numpy as np
import os
from datetime import datetime


class FaissVector:

    def __init__(self, persist_path="faiss.index", vector_size=768, **kwargs):
        self.persist_path = persist_path
        self.vector_size = vector_size

        # If index exists → load
        if os.path.exists(self.persist_path):
            self.index = faiss.read_index(self.persist_path)
            print("FAISS index loaded:", self.persist_path)

            # load ids
            if os.path.exists(self.persist_path + ".ids"):
                with open(self.persist_path + ".ids", "r") as f:
                    self.doc_ids = [line.strip() for line in f.readlines()]
            else:
                self.doc_ids = []

        else:
            # Build new index (L2 = works if vectors normalized)
            self.index = faiss.IndexFlatL2(self.vector_size)
            self.doc_ids = []

        self.count = len(self.doc_ids)
        self.last_sync = None

    def _normalize(self, v):
        v = np.array(v).astype("float32")
        norm = np.linalg.norm(v)
        return v / norm if norm > 0 else v

    def index(self, doc_id: str, vector: list):

        # Normalize vector for cosine similarity
        vector = self._normalize(vector)

        self.index.add(np.array([vector]).astype("float32"))
        self.doc_ids.append(doc_id)

        # Save FAISS index
        faiss.write_index(self.index, self.persist_path)

        # Save doc_ids map
        with open(self.persist_path + ".ids", "w") as f:
            for id in self.doc_ids:
                f.write(id + "\n")

        self.count += 1
        self.last_sync = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def search(self, vector, top_k):
        vector = self._normalize(vector)

        D, I = self.index.search(np.array([vector]).astype("float32"), top_k)

        return {
            "distances": D[0].tolist(),
            "results": [self.doc_ids[i] for i in I[0]]
        }

    def status(self):
        return self.count, self.last_sync
