# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser / UI                           │
│              React 18 · Vite · TanStack Query                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (proxied in dev, via ALB in prod)
┌────────────────────────▼────────────────────────────────────────┐
│                      FastAPI (Python 3.12)                      │
│   Uvicorn · SQLAlchemy 2.0 async · Pydantic v2 · asyncpg       │
│                                                                 │
│  /api/v1/deployments   /api/v1/incidents   /api/v1/metrics      │
│  /api/v1/pipelines     /health                                  │
└──────┬─────────────────┬──────────────────┬─────────────────────┘
       │                 │                  │
  ┌────▼─────┐   ┌───────▼──────┐   ┌──────▼──────┐
  │ Postgres │   │    Redis     │   │   Grafana   │
  │  (RDS)   │   │(ElastiCache) │   │  (optional) │
  └──────────┘   └──────────────┘   └─────────────┘
```

## Key Design Decisions

### Async-first backend

All database operations use SQLAlchemy's async engine (`create_async_engine` + `asyncpg`). This allows FastAPI to handle thousands of concurrent connections without blocking the event loop — critical for the real-time log streaming and polling patterns used by the UI.

### Background task deployment

When a deployment is triggered, FastAPI returns the `Deployment` record immediately (HTTP 201) and runs the actual orchestration in a `BackgroundTask`. The UI polls `/deployments/{id}` and `/deployments/{id}/logs` every 2-3 seconds to show live progress without holding open a WebSocket.

### In-memory pipeline store

The Pipeline model uses an in-memory dict for simplicity. In a real system this would be backed by the same Postgres database. The architecture makes it trivial to swap — just replace `_pipelines` with a SQLAlchemy model following the same pattern as `Deployment`.

### DORA metrics on demand

KPIs are computed on-the-fly from the database on each `/api/v1/metrics/kpis` request. The 30-day window is always fresh. For scale, this query would be cached in Redis with a 5-minute TTL.

## Infrastructure (Production)

```
Internet → Route 53 → CloudFront (CDN for static assets)
                    → ALB → ECS Fargate (2–10 tasks, HPA on CPU)
                                 → RDS PostgreSQL 16 (Multi-AZ)
                                 → ElastiCache Redis 7
                                 → SSM Parameter Store (secrets)
                                 → CloudWatch Logs
```

## CI/CD Pipeline

```
git push → GitHub Actions
              ├── backend-test  (pytest, SQLite, no infra needed)
              ├── frontend-build (npm ci + vite build)
              └── docker-build   (multi-stage Dockerfile → GHCR)
                       └── deploy-staging (kubectl set image → rollout)
                                └── deploy-production (manual approval gate)
```

## Security

- Secrets stored in AWS SSM Parameter Store (SecureString / KMS-encrypted)
- App runs as non-root user in Docker
- RDS in private subnets — not publicly accessible
- ALB terminates TLS; cert managed by ACM
- CORS restricted to known frontend origins via `ALLOWED_ORIGINS` config
- SQL injection impossible — all queries use SQLAlchemy ORM parameterisation
