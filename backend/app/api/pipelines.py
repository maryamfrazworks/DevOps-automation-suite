"""
CI/CD Pipeline tracking API.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

from app.core.database import get_db

router = APIRouter()

# In-memory store (replace with DB model in production)
_pipelines: dict = {}


class PipelineStage(BaseModel):
    name: str
    status: str = "pending"  # pending | running | passed | failed | skipped
    duration_seconds: Optional[int] = None
    logs_url: Optional[str] = None


class PipelineCreate(BaseModel):
    name: str = Field(..., min_length=1)
    repository: str
    branch: str
    commit_sha: str
    triggered_by: str
    stages: List[PipelineStage] = []


class PipelineResponse(BaseModel):
    id: str
    name: str
    repository: str
    branch: str
    commit_sha: str
    triggered_by: str
    overall_status: str
    stages: List[PipelineStage]
    created_at: datetime


@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(limit: int = Query(default=20, le=100)):
    return list(_pipelines.values())[-limit:]


@router.post("/", response_model=PipelineResponse, status_code=201)
async def create_pipeline(payload: PipelineCreate):
    pipeline_id = str(uuid.uuid4())
    pipeline = {
        "id": pipeline_id,
        **payload.model_dump(),
        "overall_status": "running",
        "created_at": datetime.utcnow(),
    }
    _pipelines[pipeline_id] = pipeline
    return pipeline


@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(pipeline_id: str):
    if pipeline_id not in _pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return _pipelines[pipeline_id]


@router.patch("/{pipeline_id}/stages/{stage_name}")
async def update_stage(pipeline_id: str, stage_name: str, status: str, duration_seconds: Optional[int] = None):
    if pipeline_id not in _pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    pipeline = _pipelines[pipeline_id]
    for stage in pipeline["stages"]:
        if stage["name"] == stage_name:
            stage["status"] = status
            if duration_seconds:
                stage["duration_seconds"] = duration_seconds
            break

    # Derive overall status
    statuses = [s["status"] for s in pipeline["stages"]]
    if "failed" in statuses:
        pipeline["overall_status"] = "failed"
    elif all(s == "passed" for s in statuses):
        pipeline["overall_status"] = "passed"

    return pipeline
