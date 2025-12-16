from fastapi import APIRouter
from datetime import datetime
from collections import Counter, defaultdict

from app.core.config import db

router = APIRouter()
pdf_files_collection = db["pdf_files"]


@router.get("/")
async def get_metrics():

    # ✅ FIX: async cursor handling
    docs = await pdf_files_collection.find().to_list(length=10000)

    if not docs:
        return {
            "kpis": {
                "total": 0,
                "success": 0,
                "failed": 0,
                "avg_pages": 0
            },
            "timeseries": [],
            "status": {},
            "folders": {},
            "zips": {}
        }

    # ---------------- KPIs ----------------
    total = len(docs)
    success = sum(1 for d in docs if d.get("status") == "Success")
    failed = sum(1 for d in docs if d.get("status") != "Success")
    avg_pages = round(
        sum(d.get("page_count", 0) for d in docs) / total, 2
    )

    # ---------------- Time Series ----------------
    date_counter = defaultdict(int)
    for d in docs:
        created = d.get("created_at")
        if created:
            date = created.date().isoformat()
            date_counter[date] += 1

    timeseries = [
        {"date": k, "count": v}
        for k, v in sorted(date_counter.items())
    ]

    # ---------------- Status Donut ----------------
    status_counts = Counter(
        d.get("status", "Unknown") for d in docs
    )

    # ---------------- Folder Distribution ----------------
    folder_counts = Counter(
        d.get("folder_path", "root") or "root"
        for d in docs
    )

    # ---------------- ZIP Metrics ----------------
    zip_counts = Counter(
        str(d.get("zip_id")) if d.get("zip_id") else "single_pdf"
        for d in docs
    )

    return {
        "kpis": {
            "total": total,
            "success": success,
            "failed": failed,
            "avg_pages": avg_pages
        },
        "timeseries": timeseries,
        "status": dict(status_counts),
        "folders": dict(folder_counts),
        "zips": dict(zip_counts)
    }
