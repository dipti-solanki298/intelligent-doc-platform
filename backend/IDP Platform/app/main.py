from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects, pipelines, playground, documents, vector_store, settings
 
app = FastAPI(
    title="Prompt Studio AI API",
    description="Backend for Prompt Studio Enterprise Platform",
    version="1.0.0"
)
 
# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",  # Vite default
        "http://localhost:5174"   # Alternative Vite port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Register Routers
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(pipelines.router, prefix="/api/pipelines", tags=["Pipelines"])
app.include_router(playground.router, prefix="/api/playground", tags=["Playground"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(vector_store.router, prefix="/api/vector-store", tags=["Vector Store"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
 
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "prompt-studio-backend"}