"""
Metrics API — exposes key DevOps KPIs.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.models.deployment import Deployment, DeploymentStatus
from app.models.incident import Incident, IncidentStatus

router = APIRouter()


@router.get("/kpis")
async def get_kpis(db: AsyncSession = Depends(get_db)):
    """
    Returns DORA-style DevOps KPIs:
    - Deployment Frequency
    - Change Failure Rate
    - Mean Time to Recovery (MTTR)
    - Average Deployment Duration
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    # Deployments in last 30 days
    dep_result = await db.execute(
        select(Deployment).where(Deployment.created_at >= thirty_days_ago)
    )
    deployments = dep_result.scalars().all()

    total_deps = len(deployments)
    successful = [d for d in deployments if d.status == DeploymentStatus.SUCCESS]
    failed = [d for d in deployments if d.status == DeploymentStatus.FAILED]
    durations = [d.duration_seconds for d in successful if d.duration_seconds]

    # Incidents in last 30 days
    inc_result = await db.execute(
        select(Incident).where(Incident.created_at >= thirty_days_ago)
    )
    incidents = inc_result.scalars().all()
    resolved = [i for i in incidents if i.status == IncidentStatus.RESOLVED and i.mttr_minutes]
    avg_mttr = sum(i.mttr_minutes for i in resolved) / len(resolved) if resolved else 0

    return {
        "period_days": 30,
        "deployment_frequency": {
            "total": total_deps,
            "per_day": round(total_deps / 30, 2),
            "label": "deploys/day"
        },
        "change_failure_rate": {
            "value": round(len(failed) / total_deps * 100, 2) if total_deps else 0,
            "label": "%"
        },
        "mean_time_to_recovery": {
            "value": round(avg_mttr, 1),
            "label": "minutes"
        },
        "avg_deployment_duration": {
            "value": round(sum(durations) / len(durations), 1) if durations else 0,
            "label": "seconds"
        },
        "open_incidents": sum(1 for i in incidents if i.status not in [IncidentStatus.RESOLVED, IncidentStatus.POSTMORTEM]),
    }
