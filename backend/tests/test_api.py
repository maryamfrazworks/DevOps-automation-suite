"""
Integration tests for the DevOps Automation Suite API.
Run with: pytest tests/ -v
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.main import app
from app.core.database import get_db, Base


# Use SQLite for tests (no Postgres needed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Health ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Deployments ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_deployment(client):
    payload = {
        "service_name": "api-gateway",
        "version": "1.2.3",
        "environment": "staging",
        "triggered_by": "ci-bot",
        "commit_sha": "abc1234",
        "branch": "main",
    }
    r = await client.post("/api/v1/deployments/", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["service_name"] == "api-gateway"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_list_deployments(client):
    r = await client.get("/api/v1/deployments/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_get_deployment_not_found(client):
    r = await client.get("/api/v1/deployments/nonexistent-id")
    assert r.status_code == 404


# ── Incidents ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_incident(client):
    payload = {
        "title": "Database connection pool exhausted",
        "severity": "P2",
        "affected_services": ["api-gateway", "user-service"],
        "description": "Connection pool hitting limits under load",
    }
    r = await client.post("/api/v1/incidents/", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["severity"] == "P2"
    assert data["status"] == "open"


@pytest.mark.asyncio
async def test_update_incident_status(client):
    create_r = await client.post("/api/v1/incidents/", json={
        "title": "Test incident", "severity": "P3"
    })
    inc_id = create_r.json()["id"]

    r = await client.patch(f"/api/v1/incidents/{inc_id}", json={"status": "investigating"})
    assert r.status_code == 200
    assert r.json()["status"] == "investigating"


@pytest.mark.asyncio
async def test_resolve_incident(client):
    create_r = await client.post("/api/v1/incidents/", json={
        "title": "Memory leak in worker", "severity": "P2"
    })
    inc_id = create_r.json()["id"]

    r = await client.patch(f"/api/v1/incidents/{inc_id}", json={
        "status": "resolved",
        "resolution_summary": "Restarted worker pods; memory pressure resolved."
    })
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "resolved"
    assert data["resolved_at"] is not None


# ── Pipelines ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_pipeline(client):
    payload = {
        "name": "Deploy pipeline",
        "repository": "org/api-gateway",
        "branch": "main",
        "commit_sha": "abc123",
        "triggered_by": "push",
        "stages": [
            {"name": "lint", "status": "passed"},
            {"name": "test", "status": "passed"},
            {"name": "build", "status": "running"},
        ]
    }
    r = await client.post("/api/v1/pipelines/", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Deploy pipeline"
    assert len(data["stages"]) == 3


# ── Metrics ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_kpis_empty(client):
    r = await client.get("/api/v1/metrics/kpis")
    assert r.status_code == 200
    data = r.json()
    assert "deployment_frequency" in data
    assert "change_failure_rate" in data
    assert "mean_time_to_recovery" in data
