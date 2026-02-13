import base64

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
async def test_get_file_success():
    store = _configured_store()
    app = _make_app(store=store)

    content = base64.b64encode(b"file content here").decode()
    respx.get(url__regex=r".*/contents/path/to/file\.txt.*").mock(
        return_value=httpx.Response(200, json={"content": content, "encoding": "base64"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/files/path/to/file.txt")

    assert resp.status_code == 200
    assert resp.text == "file content here"
    assert "text/plain" in resp.headers["content-type"]


@pytest.mark.asyncio
@respx.mock
async def test_get_file_not_found():
    store = _configured_store()
    app = _make_app(store=store)

    respx.get(url__regex=r".*/contents/missing\.txt.*").mock(
        return_value=httpx.Response(404, json={"message": "Not Found"})
    )

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/files/missing.txt")

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_file_disconnected():
    app = _make_app()  # No config set

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/files/some/file.txt")

    assert resp.status_code == 400
    assert "not configured" in resp.json()["error"].lower()
