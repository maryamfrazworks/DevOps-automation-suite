from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@router.get("/")
async def root():
    return {"message": "DevOps Automation Suite API", "docs": "/api/docs"}
