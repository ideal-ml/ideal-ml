import threading

from pydantic import BaseModel, ConfigDict, Field


class GitHubConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    repo_owner: str = Field(alias="repoOwner")
    repo_name: str = Field(alias="repoName")
    branch: str = Field(alias="branch")
    config_path: str = Field(alias="configPath")


class ConfigStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._config: GitHubConfig | None = None

    def set(self, cfg: GitHubConfig) -> None:
        with self._lock:
            self._config = cfg.model_copy()

    def get(self) -> GitHubConfig | None:
        with self._lock:
            if self._config is None:
                return None
            return self._config.model_copy()

    def clear(self) -> None:
        with self._lock:
            self._config = None

    def is_configured(self) -> bool:
        with self._lock:
            return self._config is not None
