"""
SQLAlchemy models for deployment tracking.
"""

from sqlalchemy import Column, String, Integer, DateTime, Enum, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


class DeploymentStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    CANCELLED = "cancelled"


class Environment(str, enum.Enum):
    DEV = "dev"
    STAGING = "staging"
    PRODUCTION = "production"


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    service_name = Column(String(100), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    environment = Column(Enum(Environment), nullable=False, index=True)
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.PENDING, index=True)
    triggered_by = Column(String(100), nullable=False)
    commit_sha = Column(String(40))
    branch = Column(String(200))
    image_tag = Column(String(200))
    duration_seconds = Column(Integer)
    error_message = Column(Text)
    extra_data = Column(JSON, default={})   # renamed from 'metadata' (reserved by SQLAlchemy)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    logs = relationship("DeploymentLog", back_populates="deployment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Deployment {self.service_name}@{self.version} [{self.status}]>"


class DeploymentLog(Base):
    __tablename__ = "deployment_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    level = Column(String(10), default="INFO")
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    deployment = relationship("Deployment", back_populates="logs")
