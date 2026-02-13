import base64
import logging
import threading
import time
from dataclasses import dataclass, field

import httpx

from app.config import ConfigStore
from app.models import Model, parse_models

logger = logging.getLogger(__name__)

CACHE_TTL = 300  # 5 minutes


@dataclass
class _CachedModels:
    models: list[Model] = field(default_factory=list)
    fetched_at: float = 0.0
    cache_key: str = ""


class GitHubClient:
    def __init__(self, store: ConfigStore, base_url: str = "https://api.github.com") -> None:
        self._store = store
        self._base_url = base_url
        self._lock = threading.Lock()
        self._cache: _CachedModels | None = None

    def _cache_key(self, cfg) -> str:
        return f"{cfg.repo_owner}/{cfg.repo_name}/{cfg.branch}/{cfg.config_path}"

    def _get_cache(self, key: str) -> list[Model] | None:
        with self._lock:
            if (
                self._cache is not None
                and self._cache.cache_key == key
                and (time.time() - self._cache.fetched_at) < CACHE_TTL
            ):
                return list(self._cache.models)
        return None

    def _set_cache(self, key: str, models: list[Model]) -> None:
        with self._lock:
            self._cache = _CachedModels(
                models=list(models),
                fetched_at=time.time(),
                cache_key=key,
            )

    def invalidate_cache(self) -> None:
        with self._lock:
            self._cache = None

    async def fetch_file_content(self, token: str, path: str) -> bytes:
        cfg = self._store.get()
        if cfg is None:
            raise RuntimeError("GitHub not configured")

        url = (
            f"{self._base_url}/repos/{cfg.repo_owner}/{cfg.repo_name}"
            f"/contents/{path}?ref={cfg.branch}"
        )

        headers = {"Accept": "application/vnd.github.v3+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            prefix = token[: min(8, len(token))]
            logger.debug("[github] GET %s (token: %s...)", url, prefix)
        else:
            logger.debug("[github] GET %s (NO TOKEN)", url)

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)

        if resp.status_code != 200:
            raise _map_github_error(resp, bool(token), path)

        data = resp.json()
        content_str: str = data.get("content", "")

        try:
            decoded = base64.b64decode(content_str)
        except Exception:
            cleaned = content_str.replace("\n", "")
            decoded = base64.b64decode(cleaned)

        return decoded

    async def fetch_models(self, token: str, refresh: bool = False) -> list[Model]:
        cfg = self._store.get()
        if cfg is None:
            raise RuntimeError("GitHub not configured")

        key = self._cache_key(cfg)

        if not refresh:
            cached = self._get_cache(key)
            if cached is not None:
                return cached

        content = await self.fetch_file_content(token, cfg.config_path)
        models = parse_models(content, cfg.config_path)
        self._set_cache(key, models)
        return models

    async def test_connection(self, token: str) -> int:
        self.invalidate_cache()
        models = await self.fetch_models(token, refresh=True)
        return len(models)


def _map_github_error(resp: httpx.Response, has_token: bool, path: str) -> RuntimeError:
    try:
        gh_msg = resp.json().get("message", "")
    except Exception:
        gh_msg = ""

    status = resp.status_code
    if status == 404:
        if not has_token:
            return RuntimeError(
                f"file not found: {path} (no auth token — if this is a private repo, sign in first)"
            )
        return RuntimeError(
            f"not found: {path} (GitHub says: {gh_msg} — check repo name, branch, and that your token has 'repo' scope)"
        )
    elif status == 401:
        return RuntimeError(f"invalid GitHub token: {gh_msg}")
    elif status == 403:
        return RuntimeError(f"access denied: {gh_msg}")
    else:
        return RuntimeError(f"GitHub API error {status}: {gh_msg}")
