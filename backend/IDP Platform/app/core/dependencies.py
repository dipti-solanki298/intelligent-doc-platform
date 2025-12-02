# app/dependencies.py
from app.core.config import fs_bucket, projects_collection, extractions_collection

async def get_gridfs():
    return fs_bucket

async def get_projects_collection():
    return projects_collection

async def get_extractions_collection():
    return extractions_collection
