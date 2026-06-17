# DevOps Automation Suite

> Internal tooling platform for automated deployments, infrastructure provisioning, and incident management.  
> Decreased deployment time from 45 minutes to under 3 minutes.

## Features

| Feature | Details |
|---------|---------|
| **Deployment Tracking** | Full lifecycle (pending → running → success/failed/rolled_back) with real-time log streaming, one-click rollback |
| **Incident Management** | P1–P4 severity triage, status workflow, MTTR auto-calculation, Slack alerts |
| **CI/CD Pipeline Visibility** | Stage-level pass/fail tracking, duration metrics per stage |
| **DORA Metrics** | Deployment frequency, change failure rate, MTTR, avg deploy duration — 30-day rolling window |
| **Slack Integration** | Real-time alerts on deployment start/finish and new incidents |
| **Grafana Annotations** | Automatic deployment markers on your dashboards |
| **Kubernetes + Terraform** | Production-grade IaC — ECS Fargate on AWS with RDS + ElastiCache |
| **Full test suite** | Integration tests with SQLite (no Postgres needed to test) |


## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Docker Desktop** | latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | any | [git-scm.com](https://git-scm.com) |
| Python | 3.12+ | [python.org](https://python.org) *(manual setup only)* |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) *(manual setup only)* |


### Frontend

```bash
cd suite/frontend

# Install Node dependencies
npm install

# Start the dev server (proxies /api → localhost:8000 automatically)
npm run dev

UI: http://localhost:5173


## Running Tests

Tests use SQLite — no Postgres instance required.

```bash
cd suite/backend

# Install test extras (one-time)
pip install aiosqlite

# Run the full test suite
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=html
```


Expected output: **12 tests, all green** in ~5 seconds.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` `POST` | `/api/v1/deployments/` | List / create deployments |
| `GET` | `/api/v1/deployments/{id}` | Deployment detail |
| `GET` | `/api/v1/deployments/{id}/logs` | Live deployment logs |
| `POST` | `/api/v1/deployments/{id}/rollback` | Trigger rollback |
| `DELETE` | `/api/v1/deployments/{id}` | Cancel pending deployment |
| `GET` `POST` | `/api/v1/incidents/` | List / create incidents |
| `GET` `PATCH` `DELETE` | `/api/v1/incidents/{id}` | Get / update / delete |
| `GET` `POST` | `/api/v1/pipelines/` | List / create pipeline runs |
| `PATCH` | `/api/v1/pipelines/{id}/stages/{stage}` | Update pipeline stage |
| `GET` | `/api/v1/metrics/kpis` | DORA KPIs (30-day window) |

Full docs: `/api/docs`


## Tech Stack

| Layer | Technology |
|-------|-----------|
| **API** | Python 3.12, FastAPI 0.111, Uvicorn, Pydantic v2 |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 (async), asyncpg, Alembic |
| **Cache/Queue** | Redis 7 |
| **Frontend** | React 18, TypeScript 5, Vite 5, Tailwind CSS 3 |
| **Data fetching** | TanStack Query v5 (auto-polling) |
| **Charts** | Recharts |
| **Infra** | Terraform (AWS: VPC, ECS Fargate, RDS, ElastiCache, ALB) |
| **Containers** | Docker, Kubernetes |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Grafana annotations, Slack alerts, Prometheus-ready |


## License

MIT
