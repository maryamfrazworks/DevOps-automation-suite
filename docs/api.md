# API Reference

The DevOps Automation Suite exposes a RESTful JSON API versioned under `/api/v1`.

Interactive Swagger UI: `http://localhost:8000/api/docs`  
ReDoc: `http://localhost:8000/api/redoc`

---

## Authentication

Currently the API is internal-only and does not require authentication tokens. In production deployments it is protected at the network level (VPC / ingress). Adding JWT auth via FastAPI's `OAuth2PasswordBearer` is straightforward using the existing `SECRET_KEY` config.

---

## Health

### `GET /health`

Returns the API health status.

**Response 200**
```json
{ "status": "ok", "timestamp": "2024-07-01T10:00:00Z" }
```

---

## Deployments

### `GET /api/v1/deployments/`

List deployments with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `environment` | string | Filter by env (`dev`, `staging`, `production`) |
| `service_name` | string | Filter by service name |
| `status` | string | Filter by status |
| `limit` | int | Max results (default 20, max 100) |

**Response 200** — `Deployment[]`

---

### `POST /api/v1/deployments/`

Trigger a new deployment. The deployment runs asynchronously in the background.

**Body**
```json
{
  "service_name": "api-gateway",
  "version": "1.3.0",
  "environment": "staging",
  "triggered_by": "ci-bot",
  "commit_sha": "abc1234",
  "branch": "main",
  "image_tag": "registry.example.com/api-gateway:1.3.0"
}
```

**Response 201** — `Deployment`

---

### `GET /api/v1/deployments/{id}`

Get a single deployment by ID.

---

### `GET /api/v1/deployments/{id}/logs`

Returns chronological log entries written during the deployment.

**Response 200** — `DeploymentLog[]`

---

### `POST /api/v1/deployments/{id}/rollback`

Trigger a rollback for a `success` or `failed` deployment.

---

### `DELETE /api/v1/deployments/{id}`

Cancel a `pending` deployment.

---

## Incidents

### `GET /api/v1/incidents/`

List incidents. Supports `severity` and `status` query filters.

### `POST /api/v1/incidents/`

**Body**
```json
{
  "title": "Database connection pool exhausted",
  "severity": "P2",
  "description": "Connections hitting limits under load",
  "affected_services": ["api-gateway", "user-service"],
  "tags": ["database", "performance"]
}
```

### `GET /api/v1/incidents/{id}`

### `PATCH /api/v1/incidents/{id}`

Update any field. Setting `status` to `resolved` automatically records `resolved_at` and calculates MTTR.

### `DELETE /api/v1/incidents/{id}`

---

## Pipelines

### `GET /api/v1/pipelines/`

### `POST /api/v1/pipelines/`

Create a pipeline run with stage definitions.

**Body**
```json
{
  "name": "Deploy api-gateway",
  "repository": "org/api-gateway",
  "branch": "main",
  "commit_sha": "abc1234",
  "triggered_by": "push",
  "stages": [
    { "name": "lint", "status": "passed", "duration_seconds": 12 },
    { "name": "test", "status": "passed", "duration_seconds": 48 },
    { "name": "build", "status": "running" },
    { "name": "deploy", "status": "pending" }
  ]
}
```

### `PATCH /api/v1/pipelines/{id}/stages/{stage_name}`

Update a stage status as the CI/CD system progresses.

---

## Metrics

### `GET /api/v1/metrics/kpis`

Returns DORA-style KPIs computed over the last 30 days.

**Response 200**
```json
{
  "period_days": 30,
  "deployment_frequency": { "total": 142, "per_day": 4.73, "label": "deploys/day" },
  "change_failure_rate": { "value": 2.11, "label": "%" },
  "mean_time_to_recovery": { "value": 18.5, "label": "minutes" },
  "avg_deployment_duration": { "value": 163, "label": "seconds" },
  "open_incidents": 2
}
```

---

## Data Models

### Deployment

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | Auto-generated |
| `service_name` | string | |
| `version` | string | Semver recommended |
| `environment` | enum | `dev` \| `staging` \| `production` |
| `status` | enum | `pending` → `running` → `success` / `failed` / `rolled_back` / `cancelled` |
| `triggered_by` | string | Username or system name |
| `commit_sha` | string? | |
| `branch` | string? | |
| `image_tag` | string? | Full container image reference |
| `duration_seconds` | int? | Set on completion |
| `error_message` | string? | Set on failure |
| `created_at` | ISO datetime | |
| `completed_at` | ISO datetime? | |

### Incident

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | |
| `title` | string | |
| `severity` | enum | `P1` (critical) … `P4` (low) |
| `status` | enum | `open` → `investigating` → `identified` → `monitoring` → `resolved` → `postmortem` |
| `affected_services` | string[] | |
| `mttr_minutes` | int? | Calculated on resolution |
| `resolved_at` | ISO datetime? | |
