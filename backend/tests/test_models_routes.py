import base64
import json

import httpx
import pytest
import respx
from httpx import ASGITransport

from app.auth import OAuthConfig, SessionStore
from app.config import ConfigStore, GitHubConfig
from app.github_client import GitHubClient
from app.main import create_app
from app.routes import connection, files
from app.routes import models as models_routes


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
    def _test_auth():
        return "test-token"
    app.dependency_overrides[connection._require_auth] = _test_auth
    app.dependency_overrides[models_routes._require_auth] = _test_auth
    app.dependency_overrides[files._require_auth] = _test_auth
    return app


def _configured_store():
    store = ConfigStore()
    store.set(GitHubConfig(
        repoOwner="testowner", repoName="testrepo",
        branch="main", configPath="models.yaml",
    ))
    return store


@pytest.mark.asyncio
@respx.mock
async def test_list_models_connected():
    store = _configured_store()
    app = _make_app(store=store)

    models_data = [{"id": "m1", "name": "Test", "status": "production"}]
    encoded = base64.b64encode(json.dumps(models_data).encode()).decode()
    respx.get(url__regex=r".*/contents/models\.yaml.*").mock(
        return_value=httpx.Response(200, json={"content": encoded, "encoding": "base64"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/models")

    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "github"
    assert len(data["models"]) == 1
    assert data["models"][0]["id"] == "m1"


@pytest.mark.asyncio
async def test_list_models_disconnected():
    app = _make_app()

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/models")

    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "none"
    assert data["models"] == []


@pytest.mark.asyncio
@respx.mock
async def test_list_models_refresh():
    store = _configured_store()
    app = _make_app(store=store)

    models_data = [{"id": "m1", "name": "Test", "status": "production"}]
    encoded = base64.b64encode(json.dumps(models_data).encode()).decode()
    route = respx.get(url__regex=r".*/contents/models\.yaml.*").mock(
        return_value=httpx.Response(200, json={"content": encoded, "encoding": "base64"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        await client.get("/api/models")
        await client.get("/api/models?refresh=true")

    assert route.call_count == 2


@pytest.mark.asyncio
@respx.mock
async def test_get_model_found():
    store = _configured_store()
    app = _make_app(store=store)

    models_data = [{"id": "m1", "name": "Test Model", "status": "production"}]
    encoded = base64.b64encode(json.dumps(models_data).encode()).decode()
    respx.get(url__regex=r".*/contents/models\.yaml.*").mock(
        return_value=httpx.Response(200, json={"content": encoded, "encoding": "base64"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/models/m1")

    assert resp.status_code == 200
    assert resp.json()["id"] == "m1"
    assert resp.json()["name"] == "Test Model"


@pytest.mark.asyncio
@respx.mock
async def test_get_model_not_found():
    store = _configured_store()
    app = _make_app(store=store)

    models_data = [{"id": "m1", "name": "Test", "status": "production"}]
    encoded = base64.b64encode(json.dumps(models_data).encode()).decode()
    respx.get(url__regex=r".*/contents/models\.yaml.*").mock(
        return_value=httpx.Response(200, json={"content": encoded, "encoding": "base64"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/models/nonexistent")

    assert resp.status_code == 404
    assert resp.json()["error"] == "model not found"
