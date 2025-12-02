from fastapi import APIRouter, HTTPException
from app.schemas.models import ConnectRequest, IndexRequest, SearchRequest, IndexStatusResponse
from app.services.vector_manager import VectorManager
from app.services.embedding_service import EmbeddingService

router = APIRouter()

manager = VectorManager()

@router.post("/connect")
def connect_vector(request: ConnectRequest):

    try:
        manager.connect(
            provider=request.provider,
            host=request.host,
            port=request.port,
            path=request.path
        )
        return {"status": "connected", "provider": request.provider}

    except Exception as e:
        raise HTTPException(400, str(e))

embedding_model = EmbeddingService("BAAI/bge-small-en-v1.5")  
# OR: embedding_model = EmbeddingService("BAAI/bge-large-en-v1.5")

@router.post("/index")
def index_doc(req: IndexRequest):

    # Generate real embedding
    vector = embedding_model.embed(req.text)

    # Send to selected Vector DB
    manager.index(
        doc_id=req.document_id,
        embedding=vector
    )
    return {"status": "indexed", "doc_id": req.document_id}

@router.get("/status", response_model=IndexStatusResponse)
def status():
    total, last = manager.status()
    return IndexStatusResponse(total_indexed=total, last_sync=last)

@router.post("/search")
def search(req: SearchRequest):

    # InstructorXL requires instruction + query
    instruction = "Represent the query for retrieval:"
    query_embedding = embedding_model.model.encode(
        [[instruction, req.query]]
    )[0].tolist()

    # Perform search in selected vector DB
    results = manager.search(query_embedding, req.top_k)

    return {"results": results}
