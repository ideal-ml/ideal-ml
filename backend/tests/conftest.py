import pytest
import httpx
from httpx import ASGITransport

from app.auth import OAuthConfig, SessionStore
from app.config import ConfigStore, GitHubConfig
from app.github_client import GitHubClient
from app.main import create_app
from app.routes import connection, files
from app.routes import models as models_routes


@pytest.fixture
def config_store():
    return ConfigStore()


@pytest.fixture
def session_store():
    return SessionStore()


@pytest.fixture
def configured_store():
    store = ConfigStore()
    store.set(GitHubConfig(
        repoOwner="testowner",
        repoName="testrepo",
        branch="main",
        configPath="models.yaml",
    ))
    return store


@pytest.fixture
def oauth_config():
    return OAuthConfig(
        client_id="test-client-id",
        client_secret="test-client-secret",
        redirect_url="http://localhost:8080/api/auth/github/callback",
        frontend_url="http://localhost:5173",
    )


def _create_test_app(config_store, github_client, session_store, oauth_config):
    app = create_app(
        config_store=config_store,
        github_client=github_client,
        session_store=session_store,
        oauth_config=oauth_config,
        allow_origins=["*"],
    )

    # Override auth to inject test token
    def _test_auth():
        return "test-token"

    app.dependency_overrides[connection._require_auth] = _test_auth
    app.dependency_overrides[models_routes._require_auth] = _test_auth
    app.dependency_overrides[files._require_auth] = _test_auth

    return app


@pytest.fixture
def test_app(config_store, session_store, oauth_config):
    client = GitHubClient(config_store, base_url="https://api.github.com")
    return _create_test_app(config_store, client, session_store, oauth_config)


@pytest.fixture
def test_app_configured(configured_store, session_store, oauth_config):
    client = GitHubClient(configured_store, base_url="https://api.github.com")
    return _create_test_app(configured_store, client, session_store, oauth_config)


@pytest.fixture
async def client(test_app):
    transport = ASGITransport(app=test_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def client_configured(test_app_configured):
    transport = ASGITransport(app=test_app_configured)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
