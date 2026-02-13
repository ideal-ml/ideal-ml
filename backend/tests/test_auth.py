import json

import httpx
import pytest
import respx
from httpx import ASGITransport

from app.auth import OAuthConfig, SessionData, SessionStore
from app.main import create_app


@pytest.fixture
def oauth_config():
    return OAuthConfig(
        client_id="test-client-id",
        client_secret="test-client-secret",
        redirect_url="http://localhost:8080/api/auth/github/callback",
        frontend_url="http://localhost:5173",
    )


@pytest.fixture
def sessions():
    return SessionStore()


@pytest.fixture
def app(oauth_config, sessions):
    return create_app(
        oauth_config=oauth_config,
        session_store=sessions,
        allow_origins=["*"],
    )


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_github_redirect(client):
    resp = await client.get("/api/auth/github", follow_redirects=False)
    assert resp.status_code == 307
    location = resp.headers["location"]
    assert "github.com/login/oauth/authorize" in location
    assert "client_id=test-client-id" in location
    assert "scope=repo" in location


@pytest.mark.asyncio
@respx.mock
async def test_callback_exchanges_code(client, sessions):
    respx.post("https://github.com/login/oauth/access_token").mock(
        return_value=httpx.Response(200, json={
            "access_token": "gho_test123",
            "token_type": "bearer",
            "scope": "repo",
        })
    )
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(200, json={
            "login": "testuser",
            "name": "Test User",
            "avatar_url": "https://example.com/avatar.png",
        })
    )

    resp = await client.get(
        "/api/auth/github/callback?code=test-code",
        follow_redirects=False,
    )
    assert resp.status_code == 307
    assert resp.headers["location"] == "http://localhost:5173"


@pytest.mark.asyncio
@respx.mock
async def test_callback_sets_cookie(client, sessions):
    respx.post("https://github.com/login/oauth/access_token").mock(
        return_value=httpx.Response(200, json={
            "access_token": "gho_test123",
            "token_type": "bearer",
            "scope": "repo",
        })
    )
    respx.get("https://api.github.com/user").mock(
        return_value=httpx.Response(200, json={
            "login": "testuser",
            "name": "Test User",
            "avatar_url": "https://example.com/avatar.png",
        })
    )

    resp = await client.get(
        "/api/auth/github/callback?code=test-code",
        follow_redirects=False,
    )
    cookies = resp.cookies
    assert "session_id" in cookies


@pytest.mark.asyncio
async def test_me_authenticated(client, sessions):
    session_id = sessions.create(SessionData(
        token="tok",
        login="alice",
        name="Alice",
        avatar_url="https://example.com/alice.png",
    ))

    resp = await client.get("/api/auth/me", cookies={"session_id": session_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["login"] == "alice"
    assert data["name"] == "Alice"
    assert data["avatar_url"] == "https://example.com/alice.png"


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
    assert resp.json()["error"] == "unauthorized"


@pytest.mark.asyncio
async def test_logout_clears_session(client, sessions):
    session_id = sessions.create(SessionData(
        token="tok", login="alice", name="Alice", avatar_url="",
    ))

    resp = await client.post("/api/auth/logout", cookies={"session_id": session_id})
    assert resp.status_code == 200
    assert resp.json()["status"] == "logged_out"

    # Session should be deleted
    assert sessions.get(session_id) is None


@pytest.mark.asyncio
async def test_middleware_allows_authenticated(client, sessions):
    """Protected routes should work with valid session."""
    session_id = sessions.create(SessionData(
        token="tok", login="user", name="User", avatar_url="",
    ))

    # connection/status is a protected route
    resp = await client.get("/api/connection/status", cookies={"session_id": session_id})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_middleware_blocks_unauthenticated(app):
    """Protected routes should return 401 without session.

    We need a fresh app without the test auth override.
    """
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        resp = await c.get("/api/connection/status")
        assert resp.status_code == 401
