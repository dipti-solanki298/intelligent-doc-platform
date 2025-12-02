from fastapi import APIRouter
from typing import List, Dict, Any
from pydantic import BaseModel
 
router = APIRouter()
 
class PipelineNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]
 
class PipelineDesign(BaseModel):
    nodes: List[PipelineNode]
    edges: List[Dict[str, Any]]
 
@router.get("/nodes")
def get_available_nodes():
    return [
        {"type": "llm", "label": "LLM Node", "inputs": ["prompt"], "outputs": ["text"]},
        {"type": "retriever", "label": "Vector Search", "inputs": ["query"], "outputs": ["docs"]},

    ]
 
@router.post("/run")
def run_pipeline(design: PipelineDesign):

    # Logic to traverse graph and execute nodes

    return {"execution_id": "run_456", "status": "queued"}
 
@router.post("/save")
def save_pipeline(design: PipelineDesign):

    return {"id": "pipe_789", "status": "saved"}
 