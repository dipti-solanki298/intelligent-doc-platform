# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.routers import projects, pipelines, playground, documents, vector_store, settings, dashboard,metrics
 
# app = FastAPI(
#     title="Prompt Studio AI API",
#     description="Backend for Prompt Studio Enterprise Platform",
#     version="1.0.0"
# )
 
# # Configure CORS for frontend access
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5000",
#         "http://localhost:5173",  # Vite default
#         "http://localhost:5174"   # Alternative Vite port
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
 
# # Register Routers
# app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
# app.include_router(pipelines.router, prefix="/api/pipelines", tags=["Pipelines"])
# app.include_router(playground.router, prefix="/api/playground", tags=["Playground"])
# app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
# app.include_router(vector_store.router, prefix="/api/vector-store", tags=["Vector Store"])
# app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])

 
# @app.get("/health")
# def health_check():
#     return {"status": "healthy", "service": "prompt-studio-backend"}



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.wsgi import WSGIMiddleware

from app.routers import (
    projects,
    pipelines,
    playground,
    documents,
    vector_store,
    settings,
    metrics
)

# Dash app import
from app.dashboard.dash_app import create_dash_app
from app.dashboard.callbacks import register_callbacks



app = FastAPI(
    title="Prompt Studio AI API",
    description="Backend for Prompt Studio Enterprise Platform",
    version="1.0.0"
)

# -------------------------------------------------
# CORS Configuration
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# API Routers
# -------------------------------------------------
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(pipelines.router, prefix="/api/pipelines", tags=["Pipelines"])
app.include_router(playground.router, prefix="/api/playground", tags=["Playground"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(vector_store.router, prefix="/api/vector-store", tags=["Vector Store"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])

# 🔥 NEW: Metrics API
app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])

# -------------------------------------------------
# Dashboard (Dash inside FastAPI)
# -------------------------------------------------

dash_app = create_dash_app()
register_callbacks(dash_app)
app.mount(
    "/dashboard",
    WSGIMiddleware(dash_app.server)
)

# -------------------------------------------------
# Health Check
# -------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "prompt-studio-backend",
        "dashboard": "/dashboard",
        "metrics_api": "/api/metrics"
    }
