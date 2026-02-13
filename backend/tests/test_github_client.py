import base64
import json

import httpx
import pytest
import respx

from app.config import ConfigStore, GitHubConfig
from app.github_client import GitHubClient


@pytest.fixture
def store():
    s = ConfigStore()
    s.set(GitHubConfig(
        repoOwner="testowner",
        repoName="testrepo",
        branch="main",
        configPath="models.yaml",
    ))
    return s


@pytest.fixture
def gh_client(store):
    return GitHubClient(store, base_url="https://api.github.com")


@pytest.mark.asyncio
@respx.mock
async def test_fetch_file_content_success(gh_client):
    content = base64.b64encode(b"hello world").decode()
    respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/test.txt?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": content,
        "encoding": "base64",
    }))

    result = await gh_client.fetch_file_content("test-token", "test.txt")
    assert result == b"hello world"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_file_content_404(gh_client):
    respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/missing.txt?ref=main"
    ).mock(return_value=httpx.Response(404, json={"message": "Not Found"}))

    with pytest.raises(RuntimeError, match="not found"):
        await gh_client.fetch_file_content("test-token", "missing.txt")


@pytest.mark.asyncio
@respx.mock
async def test_fetch_file_content_401(gh_client):
    respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/test.txt?ref=main"
    ).mock(return_value=httpx.Response(401, json={"message": "Bad credentials"}))

    with pytest.raises(RuntimeError, match="invalid GitHub token"):
        await gh_client.fetch_file_content("bad-token", "test.txt")


@pytest.mark.asyncio
@respx.mock
async def test_fetch_file_content_403(gh_client):
    respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/test.txt?ref=main"
    ).mock(return_value=httpx.Response(403, json={"message": "Forbidden"}))

    with pytest.raises(RuntimeError, match="access denied"):
        await gh_client.fetch_file_content("test-token", "test.txt")


@pytest.mark.asyncio
@respx.mock
async def test_fetch_file_content_sends_auth_header(gh_client):
    content = base64.b64encode(b"data").decode()
    route = respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/test.txt?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": content,
        "encoding": "base64",
    }))

    await gh_client.fetch_file_content("my-token-123", "test.txt")

    assert route.called
    req = route.calls[0].request
    assert req.headers["authorization"] == "Bearer my-token-123"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_file_content_correct_url(gh_client):
    content = base64.b64encode(b"data").decode()
    route = respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/path/to/file.py?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": content,
        "encoding": "base64",
    }))

    await gh_client.fetch_file_content("tok", "path/to/file.py")
    assert route.called


@pytest.mark.asyncio
@respx.mock
async def test_test_connection_success(gh_client):
    models_yaml = base64.b64encode(b'[{"id": "m1", "name": "Test", "status": "production"}]').decode()
    respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/models.yaml?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": models_yaml,
        "encoding": "base64",
    }))

    count = await gh_client.test_connection("tok")
    assert count == 1


@pytest.mark.asyncio
@respx.mock
async def test_test_connection_error(gh_client):
    respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/models.yaml?ref=main"
    ).mock(return_value=httpx.Response(404, json={"message": "Not Found"}))

    with pytest.raises(RuntimeError):
        await gh_client.test_connection("tok")


@pytest.mark.asyncio
@respx.mock
async def test_fetch_models_caches_result(gh_client):
    models_yaml = base64.b64encode(b'[{"id": "m1", "name": "Test", "status": "production"}]').decode()
    route = respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/models.yaml?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": models_yaml,
        "encoding": "base64",
    }))

    result1 = await gh_client.fetch_models("tok")
    result2 = await gh_client.fetch_models("tok")

    assert len(result1) == 1
    assert len(result2) == 1
    assert route.call_count == 1  # Only one HTTP call due to caching


@pytest.mark.asyncio
@respx.mock
async def test_fetch_models_refresh_bypasses_cache(gh_client):
    models_yaml = base64.b64encode(b'[{"id": "m1", "name": "Test", "status": "production"}]').decode()
    route = respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/models.yaml?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": models_yaml,
        "encoding": "base64",
    }))

    await gh_client.fetch_models("tok")
    await gh_client.fetch_models("tok", refresh=True)

    assert route.call_count == 2


@pytest.mark.asyncio
@respx.mock
async def test_invalidate_cache(gh_client):
    models_yaml = base64.b64encode(b'[{"id": "m1", "name": "Test", "status": "production"}]').decode()
    route = respx.get(
        "https://api.github.com/repos/testowner/testrepo/contents/models.yaml?ref=main"
    ).mock(return_value=httpx.Response(200, json={
        "content": models_yaml,
        "encoding": "base64",
    }))

    await gh_client.fetch_models("tok")
    gh_client.invalidate_cache()
    await gh_client.fetch_models("tok")

    assert route.call_count == 2


@pytest.mark.asyncio
async def test_fetch_file_content_not_configured():
    store = ConfigStore()  # Not configured
    client = GitHubClient(store)

    with pytest.raises(RuntimeError, match="GitHub not configured"):
        await client.fetch_file_content("tok", "file.txt")
