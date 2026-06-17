"""
Grafana annotations helper — marks deployments on dashboards.
"""

import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


async def create_annotation(text: str, tags: list[str] | None = None) -> bool:
    if not settings.GRAFANA_API_KEY or not settings.GRAFANA_URL:
        logger.debug("Grafana not configured, skipping annotation")
        return False

    payload = {
        "text": text,
        "tags": tags or ["deployment"],
    }

    headers = {
        "Authorization": f"Bearer {settings.GRAFANA_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.GRAFANA_URL}/api/annotations",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            logger.info(f"Grafana annotation created: {text}")
            return True
    except Exception as exc:
        logger.warning(f"Grafana annotation failed: {exc}")
        return False


async def annotate_deployment(service: str, version: str, env: str, success: bool):
    status = "✅ success" if success else "❌ failed"
    text = f"Deploy {service}@{version} → {env} [{status}]"
    tags = ["deployment", env, service, "success" if success else "failed"]
    await create_annotation(text, tags)
