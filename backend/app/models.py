from __future__ import annotations

from typing import Annotated, Optional

import yaml
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field


def _coerce_str(v: object) -> str:
    """YAML safe_load converts timestamps and some values to datetime/date/float.
    Go's yaml.Unmarshal keeps them as strings. This validator matches Go's behavior."""
    if isinstance(v, str):
        return v
    if v is None:
        return ""
    return str(v)


CoercedStr = Annotated[str, BeforeValidator(_coerce_str)]


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

    id: CoercedStr = ""
    name: CoercedStr = ""
    file_path: CoercedStr = Field(default="", alias="filePath")
    description: Optional[CoercedStr] = None
    row_count: Optional[int] = Field(default=None, alias="rowCount")
    columns: Optional[list[str]] = None
    added_at: CoercedStr = Field(default="", alias="addedAt")


class ModelVersion(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    version: CoercedStr = ""
    datasets: list[Dataset] = []
    created_at: CoercedStr = Field(default="", alias="createdAt")
    notes: Optional[CoercedStr] = None


class Model(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: CoercedStr = ""
    name: CoercedStr = ""
    version: CoercedStr = ""
    description: CoercedStr = ""
    framework: CoercedStr = ""
    status: CoercedStr = ""
    owner: CoercedStr = ""
    created_at: CoercedStr = Field(default="", alias="createdAt")
    updated_at: CoercedStr = Field(default="", alias="updatedAt")
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

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError("config file must contain an array of models")

    items: list | None = None
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict) and "models" in data and isinstance(data["models"], list):
        items = data["models"]

    if items is None:
        raise ValueError("config file must contain an array of models")

    models = [Model(**item) for item in items]
    return _normalize_models(models)


def _parse_yaml(content: bytes) -> list[Model]:
    try:
        data = yaml.safe_load(content)
    except yaml.YAMLError:
        raise ValueError("config file must contain an array of models")

    items: list | None = None
    if isinstance(data, list) and len(data) > 0:
        items = data
    elif isinstance(data, dict) and "models" in data and isinstance(data["models"], list):
        items = data["models"]

    if items is None:
        raise ValueError("config file must contain an array of models")

    models = [Model(**item) for item in items]
    return _normalize_models(models)
