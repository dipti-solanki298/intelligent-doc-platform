from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime

class FieldSchema(BaseModel):
    type: str          # string, date, number etc.
    prompt: str        # textarea content
    enabled: bool      # checkbox (checked/unchecked)


class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None
    document_type: str
    extraction_mode: str
    domain_template: str
    extraction_model: List[str] 
    extraction_schema: Optional[Dict[str, FieldSchema]] = None  # schema from JSON file

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    content_type: str
    size: int

class ExtractionRequest(BaseModel):
    project_id: str
    document_type: str
    file_id: str

class ExtractionResponse(BaseModel):
    status: str
    extracted_data: Any

 
class ConnectionBase(BaseModel):
    provider: str
    api_key: str # Encrypt in real DB
    model_name: str
 
class IntegrationBase(BaseModel):
    service_name: str
    config: dict
 

#Vector DB
from pydantic import BaseModel
from typing import Optional, List

class ConnectRequest(BaseModel):
    provider: str  # qdrant / chroma / faiss
    host: Optional[str] = None
    port: Optional[int] = None
    path: Optional[str] = None  # for chroma / faiss local path

class IndexRequest(BaseModel):
    document_id: str
    text: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class IndexStatusResponse(BaseModel):
    total_indexed: int
    last_sync: str
#vector DB ends

#Settings
from pydantic import BaseModel, Field
from typing import Optional

class LLMCreateRequest(BaseModel):
    name: str
    provider: str   # openai, gemini, claude, etc.
    model: str
    api_key: str

class LLMResponse(BaseModel):
    id: str
    name: str
    provider: str
    model: str
    is_default: bool = False

class SetDefaultRequest(BaseModel):
    id: str
