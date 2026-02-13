import base64
import json

import httpx
import pytest
import respx
from httpx import ASGITransport

from app.auth import OAuthConfig, SessionStore
from app.config import ConfigStore, GitHubConfig
from app.github_client import GitHubClient
from app.routes import connection, files
from app.routes import models as models_routes
from app.main import create_app


def _make_app(store=None, gh_client=None):
    store = store or ConfigStore()
    gh_client = gh_client or GitHubClient(store)
    sessions = SessionStore()
    oauth = OAuthConfig(
        client_id="id", client_secret="secret",
        redirect_url="http://localhost:8080/cb",
        frontend_url="http://localhost:5173",
    )
    app = create_app(
        config_store=store,
        github_client=gh_client,
        session_store=sessions,
        oauth_config=oauth,
        allow_origins=["*"],
    )
    # Override auth
    def _test_auth():
        return "test-token"
    app.dependency_overrides[connection._require_auth] = _test_auth
    app.dependency_overrides[models_routes._require_auth] = _test_auth
    app.dependency_overrides[files._require_auth] = _test_auth
    return app


@pytest.mark.asyncio
@respx.mock
async def test_connect_success():
    app = _make_app()
    models_yaml = base64.b64encode(
        json.dumps([{"id": "m1", "name": "Test", "status": "production"}]).encode()
    ).decode()
    respx.get(url__regex=r".*/contents/models\.yaml.*").mock(
        return_value=httpx.Response(200, json={"content": models_yaml, "encoding": "base64"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/connection", json={
            "repoOwner": "owner",
            "repoName": "repo",
            "branch": "main",
            "configPath": "models.yaml",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "connected"
    assert data["modelCount"] == 1


@pytest.mark.asyncio
async def test_connect_missing_fields():
    app = _make_app()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/connection", json={
            "repoOwner": "",
            "repoName": "",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert "required" in data["error"]


@pytest.mark.asyncio
@respx.mock
async def test_connect_github_error():
    app = _make_app()
    respx.get(url__regex=r".*/contents/.*").mock(
        return_value=httpx.Response(404, json={"message": "Not Found"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/connection", json={
            "repoOwner": "owner",
            "repoName": "repo",
        })

    data = resp.json()
    assert data["status"] == "error"
    assert "not found" in data["error"].lower()


@pytest.mark.asyncio
async def test_disconnect():
    store = ConfigStore()
    store.set(GitHubConfig(repoOwner="o", repoName="r", branch="b", configPath="c"))
    app = _make_app(store=store)

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.delete("/api/connection")

    assert resp.status_code == 200
    assert resp.json()["status"] == "disconnected"
    assert not store.is_configured()


@pytest.mark.asyncio
async def test_status_connected():
    store = ConfigStore()
    store.set(GitHubConfig(repoOwner="owner", repoName="repo", branch="main", configPath="models.yaml"))
    app = _make_app(store=store)

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/connection/status")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "connected"
    assert data["repoOwner"] == "owner"
    assert data["repoName"] == "repo"


@pytest.mark.asyncio
async def test_status_disconnected():
    app = _make_app()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/connection/status")

    assert resp.status_code == 200
    assert resp.json()["status"] == "disconnected"
