# DevOps Automation Suite

> Internal tooling platform for automated deployments, infrastructure provisioning, and incident management.  
> **Decreased deployment time from 45 minutes to under 3 minutes.**

![Python](https://img.shields.io/badge/Python-3.12-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-1.6-7b42bc?logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-ready-326ce5?logo=kubernetes&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-compose-2496ed?logo=docker&logoColor=white)

---

## Features

| Feature | Details |
|---------|---------|
| 🚀 **Deployment Tracking** | Full lifecycle (pending → running → success/failed/rolled_back) with real-time log streaming, one-click rollback |
| 🚨 **Incident Management** | P1–P4 severity triage, status workflow, MTTR auto-calculation, Slack alerts |
| 🔁 **CI/CD Pipeline Visibility** | Stage-level pass/fail tracking, duration metrics per stage |
| 📊 **DORA Metrics** | Deployment frequency, change failure rate, MTTR, avg deploy duration — 30-day rolling window |
| 🔔 **Slack Integration** | Real-time alerts on deployment start/finish and new incidents |
| 📈 **Grafana Annotations** | Automatic deployment markers on your dashboards |
| ☸️ **Kubernetes + Terraform** | Production-grade IaC — ECS Fargate on AWS with RDS + ElastiCache |
| 🧪 **Full test suite** | Integration tests with SQLite (no Postgres needed to test) |

---

## Project Structure

```
suite/
├── backend/                        # FastAPI backend (Python 3.12)
│   ├── app/
│   │   ├── api/                    # Route handlers
│   │   │   ├── deployments.py      # CRUD + trigger + rollback
│   │   │   ├── incidents.py        # CRUD + status workflow
│   │   │   ├── pipelines.py        # CI/CD pipeline tracking
│   │   │   ├── metrics.py          # DORA KPIs
│   │   │   └── health.py           # Health check
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings (env vars)
│   │   │   └── database.py         # Async SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── deployment.py       # Deployment + DeploymentLog ORM models
│   │   │   └── incident.py         # Incident ORM model
│   │   ├── services/
│   │   │   ├── deployment_service.py  # Orchestration + background tasks
│   │   │   └── incident_service.py    # Escalation + resolution logic
│   │   ├── utils/
│   │   │   ├── slack.py            # Slack webhook notifications
│   │   │   └── grafana.py          # Grafana annotation helper
│   │   └── main.py                 # FastAPI app + middleware + lifespan
│   ├── tests/
│   │   └── test_api.py             # Integration tests (pytest-asyncio)
│   ├── alembic/                    # DB migrations
│   ├── seed.py                     # Demo data seeder
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
│
├── frontend/                       # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # KPI cards + recent activity
│   │   │   ├── Deployments.tsx     # List + detail + create modal
│   │   │   ├── Incidents.tsx       # Incident management
│   │   │   ├── Pipelines.tsx       # Pipeline runs
│   │   │   └── Metrics.tsx         # Charts + DORA trends
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         # Navigation
│   │   │   ├── StatusBadge.tsx     # Coloured status chips
│   │   │   ├── KPICard.tsx         # Metric summary card
│   │   │   └── EmptyState.tsx      # Zero-data placeholder
│   │   ├── hooks/
│   │   │   └── useData.ts          # TanStack Query hooks (auto-polling)
│   │   └── utils/
│   │       ├── api.ts              # Axios client + TypeScript types
│   │       └── format.ts           # timeAgo, formatDuration, colour maps
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts              # Dev proxy → localhost:8000
│   └── tailwind.config.js
│
├── infrastructure/
│   ├── terraform/                  # AWS VPC, ECS Fargate, RDS, ElastiCache
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars.example
│   └── k8s/
│       └── deployment.yaml         # Deployment + Service + Ingress + HPA
│
├── docs/
│   ├── api.md                      # Full API reference
│   └── architecture.md             # System design
│
├── .github/workflows/
│   └── ci.yml                      # lint → test → build → staging → prod
│
├── Dockerfile                      # Multi-stage (frontend build + Python)
├── docker-compose.yml              # Full local stack (API + UI + DB + Redis)
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Docker Desktop** | latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | any | [git-scm.com](https://git-scm.com) |
| Python | 3.12+ | [python.org](https://python.org) *(manual setup only)* |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) *(manual setup only)* |

---

## Quickstart — Docker Compose ⚡

The fastest way to run everything locally. One command starts the API, UI, Postgres, and Redis.

```bash
# 1. Clone the repo
git clone https://github.com/your-username/devops-suite.git
cd devops-suite/suite

# 2. Start the full stack
docker compose up --build

# 3. (Optional) Seed demo data so the UI isn't empty
docker compose exec api python seed.py

# Open the dashboard
open http://localhost:5173

# Open the API docs (Swagger)
open http://localhost:8000/api/docs
```

> **First build takes ~3 minutes** (downloads images, builds frontend). Subsequent starts are ~15 seconds.

---

## Manual Setup (without Docker)

### Backend

```bash
cd suite/backend

# 1. Create a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows PowerShell

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres

# 4. Start a local Postgres database (if not using Docker)
#    macOS:  brew install postgresql@16 && brew services start postgresql@16
#    Ubuntu: sudo apt install postgresql && sudo systemctl start postgresql
#    Then:   createdb devops_suite

# 5. Start the API server
uvicorn app.main:app --reload --port 8000

# 6. (Optional) Load demo data
python seed.py
```

API: http://localhost:8000  
Swagger: http://localhost:8000/api/docs

### Frontend

```bash
cd suite/frontend

# Install Node dependencies
npm install

# Start the dev server (proxies /api → localhost:8000 automatically)
npm run dev
```

UI: http://localhost:5173

---

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

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | postgres://... | Async PostgreSQL URL |
| `REDIS_URL` | ✅ | redis://localhost | Redis connection URL |
| `SECRET_KEY` | ✅ | change-me | App secret (change in prod!) |
| `ENVIRONMENT` | — | `development` | `development` / `staging` / `production` |
| `DEBUG` | — | `false` | Enables SQLAlchemy query logging |
| `SLACK_WEBHOOK_URL` | ❌ | — | Slack incoming webhook URL |
| `GRAFANA_URL` | ❌ | http://localhost:3001 | Grafana base URL |
| `GRAFANA_API_KEY` | ❌ | — | Grafana API key for annotations |

---

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

---

## Deploying to Production

### Kubernetes

```bash
# Apply manifests
kubectl apply -f infrastructure/k8s/deployment.yaml

# Create secrets
kubectl create secret generic devops-suite-secrets \
  --from-literal=database-url="postgresql+asyncpg://user:pass@host/devops_suite" \
  --from-literal=redis-url="redis://host:6379/0" \
  --from-literal=secret-key="$(openssl rand -hex 32)" \
  -n devops-suite

# Watch the rollout
kubectl rollout status deployment/devops-suite-api -n devops-suite
```

### Terraform (AWS)

```bash
cd infrastructure/terraform

cp terraform.tfvars.example terraform.tfvars
# Fill in db_password, secret_key, ecr_image_uri

terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

---

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

---

## Contributing

1. Fork and create a feature branch
2. `pytest tests/ -v` — all tests must pass
3. `npm run build` in `frontend/` — must compile without errors
4. Open a pull request

---

## License

MIT
