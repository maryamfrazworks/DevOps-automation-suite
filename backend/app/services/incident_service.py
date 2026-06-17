"""
IncidentService — business logic for incident lifecycle management.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.incident import Incident, IncidentStatus
from app.utils.slack import notify_incident_created

logger = logging.getLogger(__name__)


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def escalate(self, incident_id: str) -> Incident | None:
        result = await self.db.execute(select(Incident).where(Incident.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            return None

        severity_escalation = {"P4": "P3", "P3": "P2", "P2": "P1"}
        new_severity = severity_escalation.get(incident.severity)
        if new_severity:
            incident.severity = new_severity
            logger.info(f"Incident {incident_id[:8]} escalated to {new_severity}")
            await self.db.commit()
            await self.db.refresh(incident)

        return incident

    async def resolve(self, incident_id: str, resolution_summary: str) -> Incident | None:
        result = await self.db.execute(select(Incident).where(Incident.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            return None

        incident.status = IncidentStatus.RESOLVED
        incident.resolution_summary = resolution_summary
        incident.resolved_at = datetime.now(timezone.utc)

        if incident.created_at:
            created = incident.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            delta = incident.resolved_at - created
            incident.mttr_minutes = int(delta.total_seconds() / 60)

        await self.db.commit()
        await self.db.refresh(incident)
        logger.info(f"Incident {incident_id[:8]} resolved in {incident.mttr_minutes}min")
        return incident
