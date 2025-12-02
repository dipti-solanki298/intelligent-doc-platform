from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.core.config import db, OPENROUTER_API_KEY, OPENROUTER_MODEL

router = APIRouter(prefix="/api/settings", tags=["Settings"])

# --------------------------
# Helper to serialize Mongo
# --------------------------
def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc


# --------------------------
#        LLM PROVIDERS
# --------------------------

@router.get("/llm")
async def get_llm_providers():
    """
    Return CLEAN list of all LLM providers,
    sorted so default provider appears first.
    """
    providers = await db["llm_settings"].find().to_list(100)

    result = []
    for p in providers:
        result.append({
            "id": str(p["_id"]),
            "name": p.get("name"),
            "provider_type": p.get("provider_type"),
            "model": p.get("model"),
            "is_default": p.get("is_default", False)
        })

    # Sort: default provider first
    result.sort(key=lambda x: not x["is_default"])

    return {"providers": result}


@router.post("/llm/add")
async def add_llm_provider(name: str, provider_type: str, model: str, api_key: str):
    data = {
        "name": name,
        "provider_type": provider_type,
        "model": model,
        "api_key": api_key,
        "is_default": False,
    }

    result = await db["llm_settings"].insert_one(data)
    data["_id"] = result.inserted_id

    return {"status": "added", "provider": serialize_doc(data)}


@router.put("/llm/{provider_id}/default")
async def set_default_llm(provider_id: str):

    await db["llm_settings"].update_many({}, {"$set": {"is_default": False}})
    result = await db["llm_settings"].update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {"is_default": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Provider not found")

    provider = await db["llm_settings"].find_one({"_id": ObjectId(provider_id)})

    return {"status": "default_set", "provider": serialize_doc(provider)}


@router.delete("/llm/{provider_id}")
async def delete_llm_provider(provider_id: str):
    result = await db["llm_settings"].delete_one({"_id": ObjectId(provider_id)})

    if result.deleted_count == 0:
        raise HTTPException(404, "Provider not found")

    return {"status": "deleted", "provider_id": provider_id}


# --------------------------
#      APP CONFIG
# --------------------------

@router.get("/app-config")
async def get_app_config():
    return {
        "openrouter_model": OPENROUTER_MODEL,
        "openrouter_key_set": bool(OPENROUTER_API_KEY),
    }


@router.put("/app-config/model")
async def update_openrouter_model(model_name: str):

    await db["system_settings"].update_one(
        {"key": "openrouter_model"},
        {"$set": {"value": model_name}},
        upsert=True
    )

    return {"status": "updated", "model": model_name}
