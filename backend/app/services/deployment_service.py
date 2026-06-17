"""
DeploymentService — orchestrates the deployment lifecycle.

In a real environment this would:
  - Pull the container image from ECR/GCR
  - Apply Kubernetes manifests via kubectl or helm
  - Run health checks against the new pods
  - Notify Slack on success/failure
  - Update Grafana annotations

For the portfolio, the logic is simulated with realistic timing/logging
so the system is fully functional end-to-end.
"""

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.deployment import Deployment, DeploymentStatus, DeploymentLog
from app.core.config import settings

logger = logging.getLogger(__name__)


class DeploymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _log(self, deployment_id: str, message: str, level: str = "INFO"):
        log_entry = DeploymentLog(deployment_id=deployment_id, message=message, level=level)
        self.db.add(log_entry)
        await self.db.flush()
        logger.info(f"[{deployment_id[:8]}] {message}")

    async def run_deployment(self, deployment_id: str):
        start = datetime.now(timezone.utc)
        result = await self.db.execute(select(Deployment).where(Deployment.id == deployment_id))
        deployment = result.scalar_one_or_none()
        if not deployment:
            logger.error(f"Deployment {deployment_id} not found")
            return

        deployment.status = DeploymentStatus.RUNNING
        await self.db.flush()

        try:
            await self._log(deployment_id, f"Starting deployment of {deployment.service_name}@{deployment.version}")
            await asyncio.sleep(0.5)

            await self._log(deployment_id, f"Pulling image: {deployment.image_tag or 'latest'}")
            await asyncio.sleep(1)

            await self._log(deployment_id, "Applying Kubernetes manifests...")
            await asyncio.sleep(1.5)

            await self._log(deployment_id, "Waiting for pods to become ready...")
            await asyncio.sleep(2)

            await self._log(deployment_id, "Running smoke tests...")
            await asyncio.sleep(0.5)

            await self._log(deployment_id, "✅ All health checks passed")

            deployment.status = DeploymentStatus.SUCCESS
            deployment.completed_at = datetime.now(timezone.utc)
            deployment.duration_seconds = int((deployment.completed_at - start).total_seconds())

            await self._log(deployment_id, f"Deployment complete in {deployment.duration_seconds}s")
            await self.db.commit()

        except Exception as exc:
            logger.error(f"Deployment {deployment_id} failed: {exc}", exc_info=True)
            deployment.status = DeploymentStatus.FAILED
            deployment.error_message = str(exc)
            deployment.completed_at = datetime.now(timezone.utc)
            deployment.duration_seconds = int((deployment.completed_at - start).total_seconds())
            await self._log(deployment_id, f"❌ Deployment failed: {exc}", level="ERROR")
            await self.db.commit()

    async def rollback_deployment(self, deployment_id: str):
        result = await self.db.execute(select(Deployment).where(Deployment.id == deployment_id))
        deployment = result.scalar_one_or_none()
        if not deployment:
            return

        deployment.status = DeploymentStatus.RUNNING
        await self.db.flush()

        await self._log(deployment_id, "🔄 Initiating rollback...")
        await asyncio.sleep(1)
        await self._log(deployment_id, "Reverting to previous stable manifest...")
        await asyncio.sleep(2)
        await self._log(deployment_id, "✅ Rollback complete")

        deployment.status = DeploymentStatus.ROLLED_BACK
        deployment.completed_at = datetime.now(timezone.utc)
        await self.db.commit()
