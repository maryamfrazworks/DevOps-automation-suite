"""
Incidents API — create, update, resolve, and track incidents.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models.incident import Incident, IncidentSeverity, IncidentStatus

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    severity: IncidentSeverity
    affected_services: List[str] = []
    assigned_to: Optional[str] = None
    tags: List[str] = []


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    affected_services: Optional[List[str]] = None
    assigned_to: Optional[str] = None
    resolution_summary: Optional[str] = None
    tags: Optional[List[str]] = None


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    severity: str
    status: str
    affected_services: List[str]
    assigned_to: Optional[str]
    resolution_summary: Optional[str]
    mttr_minutes: Optional[int]
    tags: List[str]
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Incident).order_by(desc(Incident.created_at)).limit(limit)
    if severity:
        query = query.where(Incident.severity == severity)
    if status:
        query = query.where(Incident.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=IncidentResponse, status_code=201)
async def create_incident(payload: IncidentCreate, db: AsyncSession = Depends(get_db)):
    incident = Incident(id=str(uuid.uuid4()), **payload.model_dump())
    db.add(incident)
    await db.flush()
    await db.refresh(incident)
    await db.commit()
    return incident


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    payload: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inc, field, value)

    # Auto-set resolved_at and mttr when status moves to resolved
    if payload.status == IncidentStatus.RESOLVED and not inc.resolved_at:
        inc.resolved_at = datetime.now(timezone.utc)
        if inc.created_at:
            delta = inc.resolved_at - inc.created_at
            inc.mttr_minutes = int(delta.total_seconds() / 60)

    await db.commit()
    await db.refresh(inc)
    return inc


@router.delete("/{incident_id}", status_code=204)
async def delete_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    await db.delete(inc)
    await db.commit()
