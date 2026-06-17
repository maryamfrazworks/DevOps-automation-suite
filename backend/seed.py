#!/usr/bin/env python3
"""
Seed the database with realistic demo data so the UI looks impressive on first load.
Run: python seed.py
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.models.deployment import Deployment, DeploymentStatus, Environment
from app.models.incident import Incident, IncidentSeverity, IncidentStatus

SERVICES = ["api-gateway", "user-service", "payment-service", "notification-svc", "auth-service", "data-pipeline"]
USERS = ["alice", "bob", "carol", "ci-bot", "github-actions"]
BRANCHES = ["main", "release/1.4", "hotfix/payment-fix", "feature/new-auth"]


def random_past(days: int = 30) -> datetime:
    delta = random.randint(0, days * 24 * 60)  # minutes
    return datetime.now(timezone.utc) - timedelta(minutes=delta)


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        # ── Deployments ───────────────────────────────────────────────────────
        print("Seeding deployments...")
        statuses = [DeploymentStatus.SUCCESS] * 14 + [DeploymentStatus.FAILED] * 2 + [DeploymentStatus.ROLLED_BACK]
        envs = [Environment.DEV, Environment.DEV, Environment.STAGING, Environment.STAGING, Environment.PRODUCTION]

        for _ in range(40):
            status = random.choice(statuses)
            created = random_past(30)
            duration = random.randint(120, 320) if status != DeploymentStatus.PENDING else None
            completed = created + timedelta(seconds=duration) if duration else None

            dep = Deployment(
                id=str(uuid4()),
                service_name=random.choice(SERVICES),
                version=f"{random.randint(1,3)}.{random.randint(0,9)}.{random.randint(0,20)}",
                environment=random.choice(envs),
                status=status,
                triggered_by=random.choice(USERS),
                commit_sha=''.join(random.choices('0123456789abcdef', k=7)),
                branch=random.choice(BRANCHES),
                image_tag=f"ghcr.io/org/{random.choice(SERVICES)}:sha-{''.join(random.choices('0123456789abcdef', k=7))}",
                duration_seconds=duration,
                error_message="Health check failed after 3 retries" if status == DeploymentStatus.FAILED else None,
                created_at=created,
                completed_at=completed,
            )
            db.add(dep)

        # ── Incidents ─────────────────────────────────────────────────────────
        print("Seeding incidents...")
        incident_templates = [
            ("Database connection pool exhausted under load", IncidentSeverity.P2),
            ("Payment gateway timeout — 503 errors spiking", IncidentSeverity.P1),
            ("Elevated error rate on auth-service", IncidentSeverity.P2),
            ("Memory leak in notification-svc worker", IncidentSeverity.P3),
            ("CDN cache invalidation delay — stale assets", IncidentSeverity.P4),
            ("Redis failover — brief write unavailability", IncidentSeverity.P2),
            ("CPU spike on data-pipeline pods", IncidentSeverity.P3),
        ]

        for i, (title, severity) in enumerate(incident_templates):
            created = random_past(25)
            if i < 5:
                resolved = created + timedelta(minutes=random.randint(10, 90))
                mttr = int((resolved - created).total_seconds() / 60)
                status = IncidentStatus.RESOLVED
                resolved_at = resolved
                resolution = "Root cause identified and patched. Monitoring for 24h."
            else:
                status = random.choice([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING])
                resolved_at = None
                mttr = None
                resolution = None

            inc = Incident(
                id=str(uuid4()),
                title=title,
                description=f"Automated monitoring detected anomalies in {title.lower()}. On-call engineer paged.",
                severity=severity,
                status=status,
                affected_services=random.sample(SERVICES, k=random.randint(1, 3)),
                assigned_to=random.choice(USERS),
                resolution_summary=resolution,
                mttr_minutes=mttr,
                tags=[severity.value, "automated"],
                created_at=created,
                resolved_at=resolved_at,
            )
            db.add(inc)

        await db.commit()
        print("✅ Seed complete! 40 deployments + 7 incidents created.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
