"""
Deployments API — full CRUD + trigger + rollback.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.deployment import Deployment, DeploymentStatus, DeploymentLog, Environment
from app.services.deployment_service import DeploymentService

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class DeploymentCreate(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=100)
    version: str = Field(..., min_length=1, max_length=50)
    environment: Environment
    triggered_by: str = Field(..., min_length=1, max_length=100)
    commit_sha: Optional[str] = None
    branch: Optional[str] = None
    image_tag: Optional[str] = None
    metadata: Optional[dict] = {}


class DeploymentResponse(BaseModel):
    id: str
    service_name: str
    version: str
    environment: str
    status: str
    triggered_by: str
    commit_sha: Optional[str]
    branch: Optional[str]
    image_tag: Optional[str]
    duration_seconds: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class LogResponse(BaseModel):
    id: int
    level: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DeploymentResponse])
async def list_deployments(
    environment: Optional[str] = None,
    service_name: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Deployment).order_by(desc(Deployment.created_at)).limit(limit)
    if environment:
        query = query.where(Deployment.environment == environment)
    if service_name:
        query = query.where(Deployment.service_name == service_name)
    if status:
        query = query.where(Deployment.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=DeploymentResponse, status_code=201)
async def create_deployment(
    payload: DeploymentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    deployment = Deployment(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
        status=DeploymentStatus.PENDING,
    )
    db.add(deployment)
    await db.flush()
    await db.refresh(deployment)

    service = DeploymentService(db)
    background_tasks.add_task(service.run_deployment, deployment.id)

    return deployment


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(deployment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    dep = result.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return dep


@router.get("/{deployment_id}/logs", response_model=List[LogResponse])
async def get_deployment_logs(deployment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DeploymentLog)
        .where(DeploymentLog.deployment_id == deployment_id)
        .order_by(DeploymentLog.timestamp)
    )
    return result.scalars().all()


@router.post("/{deployment_id}/rollback", response_model=DeploymentResponse)
async def rollback_deployment(
    deployment_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    dep = result.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    if dep.status not in [DeploymentStatus.FAILED, DeploymentStatus.SUCCESS]:
        raise HTTPException(status_code=400, detail=f"Cannot rollback a deployment in '{dep.status}' state")

    service = DeploymentService(db)
    background_tasks.add_task(service.rollback_deployment, deployment_id)
    return dep


@router.delete("/{deployment_id}", status_code=204)
async def cancel_deployment(deployment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    dep = result.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    if dep.status not in [DeploymentStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Only PENDING deployments can be cancelled")
    dep.status = DeploymentStatus.CANCELLED
    await db.commit()
