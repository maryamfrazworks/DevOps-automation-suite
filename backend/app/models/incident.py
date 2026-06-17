"""
SQLAlchemy model for incident management.
"""

from sqlalchemy import Column, String, Integer, DateTime, Enum, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


class IncidentSeverity(str, enum.Enum):
    P1 = "P1"  # Critical – service down
    P2 = "P2"  # Major – significant degradation
    P3 = "P3"  # Minor – partial degradation
    P4 = "P4"  # Low – cosmetic issue


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    POSTMORTEM = "postmortem"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(300), nullable=False)
    description = Column(Text)
    severity = Column(Enum(IncidentSeverity), nullable=False, index=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN, index=True)
    affected_services = Column(JSON, default=[])
    assigned_to = Column(String(100))
    resolution_summary = Column(Text)
    mttr_minutes = Column(Integer)  # Mean Time To Resolve
    tags = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Incident {self.id[:8]} [{self.severity}] {self.status}>"
