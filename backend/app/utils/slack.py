"""
Slack notification helper — posts deployment and incident alerts.
"""

import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_slack_message(text: str, blocks: list | None = None) -> bool:
    if not settings.SLACK_WEBHOOK_URL:
        logger.debug("Slack webhook not configured, skipping notification")
        return False

    payload: dict = {"text": text, "channel": settings.SLACK_CHANNEL}
    if blocks:
        payload["blocks"] = blocks

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(settings.SLACK_WEBHOOK_URL, json=payload)
            resp.raise_for_status()
            return True
    except Exception as exc:
        logger.warning(f"Slack notification failed: {exc}")
        return False


async def notify_deployment_started(service: str, version: str, env: str, triggered_by: str):
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f":rocket: *Deployment Started*\n"
                    f"*Service:* `{service}@{version}`\n"
                    f"*Environment:* `{env}`\n"
                    f"*Triggered by:* {triggered_by}"
                ),
            },
        }
    ]
    await send_slack_message(f"Deployment started: {service}@{version} → {env}", blocks)


async def notify_deployment_finished(service: str, version: str, env: str, success: bool, duration: int):
    icon = ":white_check_mark:" if success else ":x:"
    status = "Succeeded" if success else "Failed"
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"{icon} *Deployment {status}*\n"
                    f"*Service:* `{service}@{version}`\n"
                    f"*Environment:* `{env}`\n"
                    f"*Duration:* {duration}s"
                ),
            },
        }
    ]
    await send_slack_message(f"Deployment {status.lower()}: {service}@{version}", blocks)


async def notify_incident_created(title: str, severity: str, incident_id: str):
    color_map = {"P1": ":red_circle:", "P2": ":large_orange_circle:", "P3": ":large_yellow_circle:", "P4": ":white_circle:"}
    icon = color_map.get(severity, ":white_circle:")
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"{icon} *New Incident [{severity}]*\n"
                    f"*Title:* {title}\n"
                    f"*ID:* `{incident_id[:8]}`"
                ),
            },
        }
    ]
    await send_slack_message(f"[{severity}] New incident: {title}", blocks)
