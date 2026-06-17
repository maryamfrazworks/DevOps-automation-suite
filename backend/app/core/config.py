"""
Application configuration using Pydantic Settings.
All values can be overridden via environment variables or a .env file.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DevOps Automation Suite"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/devops_suite"

    # Redis (for job queues & caching)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Deployment Defaults
    DEFAULT_DEPLOYMENT_TIMEOUT: int = 300  # seconds
    MAX_CONCURRENT_DEPLOYMENTS: int = 5

    # Slack Notifications
    SLACK_WEBHOOK_URL: str = ""
    SLACK_CHANNEL: str = "#deployments"

    # Terraform
    TERRAFORM_BINARY_PATH: str = "/usr/local/bin/terraform"
    TERRAFORM_STATE_BUCKET: str = ""

    # Kubernetes
    KUBECONFIG_PATH: str = os.path.expanduser("~/.kube/config")
    K8S_NAMESPACE: str = "default"

    # Grafana
    GRAFANA_URL: str = "http://localhost:3001"
    GRAFANA_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
