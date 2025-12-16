from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "z-ai/glm-4.5-air:free")

MONGO_URI = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGO_URI)
print("mongoDB connected ", client)
db = client["idp_db"]         # database name
projects_collection = db["projects"]   # collection name
extractions_collection = db["extractions"]
node_collection = db["node_extractions"]

# GridFS bucket for file storage
fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="documents")

