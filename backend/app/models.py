from __future__ import annotations

from typing import Optional

import yaml
from pydantic import BaseModel, ConfigDict, Field


class ModelMetrics(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    accuracy: Optional[float] = None
    latency: Optional[float] = None


class ModelFiles(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model_card: Optional[str] = Field(default=None, alias="modelCard")
    training_script: Optional[str] = Field(default=None, alias="trainingScript")
    feature_script: Optional[str] = Field(default=None, alias="featureScript")
    inference_script: Optional[str] = Field(default=None, alias="inferenceScript")
    model_file: Optional[str] = Field(default=None, alias="modelFile")


class Dataset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = ""
    name: str = ""
    file_path: str = Field(default="", alias="filePath")
    description: Optional[str] = None
    row_count: Optional[int] = Field(default=None, alias="rowCount")
    columns: Optional[list[str]] = None
    added_at: str = Field(default="", alias="addedAt")


class ModelVersion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    version: str = ""
    datasets: list[Dataset] = []
    created_at: str = Field(default="", alias="createdAt")
    notes: Optional[str] = None


class Model(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = ""
    name: str = ""
    version: str = ""
    description: str = ""
    framework: str = ""
    status: str = ""
    owner: str = ""
    created_at: str = Field(default="", alias="createdAt")
    updated_at: str = Field(default="", alias="updatedAt")
    metrics: Optional[ModelMetrics] = None
    files: Optional[ModelFiles] = None
    versions: Optional[list[ModelVersion]] = None


_VALID_STATUSES = {"development", "staging", "production", "archived"}


def normalize_model(m: Model, index: int) -> Model:
    if not m.id:
        m.id = f"model-{index}"
    if not m.name:
        m.name = "Unnamed Model"
    if not m.version:
        m.version = "Unknown"
    if not m.framework:
        m.framework = "Unknown"
    if m.status not in _VALID_STATUSES:
        m.status = "development"
    if not m.owner:
        m.owner = "Unknown"
    if not m.created_at:
        m.created_at = "Unknown"
    if not m.updated_at:
        m.updated_at = "Unknown"
    return m


def _normalize_models(models: list[Model]) -> list[Model]:
    for i, m in enumerate(models):
        normalize_model(m, i)
    return models


def is_yaml_path(path: str) -> bool:
    lower = path.lower()
    return lower.endswith(".yaml") or lower.endswith(".yml")


def parse_models(content: bytes, path: str) -> list[Model]:
    if not content:
        raise ValueError("empty config file")

    if is_yaml_path(path):
        return _parse_yaml(content)
    return _parse_json(content)


def _parse_json(content: bytes) -> list[Model]:
    import json

    # Try as array first
    try:
        data = json.loads(content)
        if isinstance(data, list):
            models = [Model(**item) for item in data]
            return _normalize_models(models)
    except (json.JSONDecodeError, Exception):
        pass

    # Try as {"models": [...]}
    try:
        data = json.loads(content)
        if isinstance(data, dict) and "models" in data and isinstance(data["models"], list):
            models = [Model(**item) for item in data["models"]]
            return _normalize_models(models)
    except (json.JSONDecodeError, Exception):
        pass

    raise ValueError("config file must contain an array of models")


def _parse_yaml(content: bytes) -> list[Model]:
    # Try as array first
    try:
        data = yaml.safe_load(content)
        if isinstance(data, list) and len(data) > 0:
            models = [Model(**item) for item in data]
            return _normalize_models(models)
    except Exception:
        pass

    # Try as {"models": [...]}
    try:
        data = yaml.safe_load(content)
        if isinstance(data, dict) and "models" in data and isinstance(data["models"], list):
            models = [Model(**item) for item in data["models"]]
            return _normalize_models(models)
    except Exception:
        pass

    raise ValueError("config file must contain an array of models")
