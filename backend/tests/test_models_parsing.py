import json

import pytest
import yaml

from app.models import Model, is_yaml_path, parse_models


def test_parse_json_array():
    data = json.dumps([
        {"id": "m1", "name": "Model One", "status": "production"},
    ]).encode()
    models = parse_models(data, "models.json")
    assert len(models) == 1
    assert models[0].id == "m1"
    assert models[0].name == "Model One"
    assert models[0].status == "production"


def test_parse_json_wrapped():
    data = json.dumps({
        "models": [{"id": "m1", "name": "Wrapped"}]
    }).encode()
    models = parse_models(data, "config.json")
    assert len(models) == 1
    assert models[0].name == "Wrapped"


def test_parse_yaml():
    data = yaml.dump([
        {"id": "y1", "name": "YAML Model", "status": "staging"},
    ]).encode()
    models = parse_models(data, "models.yaml")
    assert len(models) == 1
    assert models[0].id == "y1"
    assert models[0].status == "staging"


def test_parse_yaml_wrapped():
    data = yaml.dump({
        "models": [{"id": "y1", "name": "Wrapped YAML"}]
    }).encode()
    models = parse_models(data, "config.yml")
    assert len(models) == 1
    assert models[0].name == "Wrapped YAML"


def test_parse_minimal_fields():
    data = json.dumps([{}]).encode()
    models = parse_models(data, "models.json")
    assert len(models) == 1
    m = models[0]
    assert m.id == "model-0"
    assert m.name == "Unnamed Model"
    assert m.version == "Unknown"
    assert m.framework == "Unknown"
    assert m.status == "development"
    assert m.owner == "Unknown"
    assert m.created_at == "Unknown"
    assert m.updated_at == "Unknown"


def test_parse_all_fields():
    data = json.dumps([{
        "id": "full",
        "name": "Full Model",
        "version": "2.0",
        "description": "A fully specified model",
        "framework": "pytorch",
        "status": "production",
        "owner": "alice",
        "createdAt": "2024-01-01",
        "updatedAt": "2024-06-01",
        "metrics": {"accuracy": 0.95, "latency": 12.5},
        "files": {
            "modelCard": "README.md",
            "trainingScript": "train.py",
            "featureScript": "features.py",
            "inferenceScript": "infer.py",
            "modelFile": "model.pt",
        },
    }]).encode()
    models = parse_models(data, "models.json")
    assert len(models) == 1
    m = models[0]
    assert m.id == "full"
    assert m.name == "Full Model"
    assert m.version == "2.0"
    assert m.framework == "pytorch"
    assert m.status == "production"
    assert m.owner == "alice"
    assert m.metrics.accuracy == 0.95
    assert m.metrics.latency == 12.5
    assert m.files.model_card == "README.md"
    assert m.files.training_script == "train.py"
    assert m.files.inference_script == "infer.py"
    assert m.files.model_file == "model.pt"


def test_parse_invalid_status():
    data = json.dumps([{"id": "x", "status": "bogus"}]).encode()
    models = parse_models(data, "models.json")
    assert models[0].status == "development"


def test_parse_with_versions_and_datasets():
    data = json.dumps([{
        "id": "v1",
        "name": "Versioned",
        "status": "production",
        "versions": [{
            "version": "1.0",
            "createdAt": "2024-01-01",
            "notes": "initial",
            "datasets": [{
                "id": "ds1",
                "name": "Training Set",
                "filePath": "data/train.csv",
                "description": "Training data",
                "rowCount": 1000,
                "columns": ["a", "b", "c"],
                "addedAt": "2024-01-01",
            }],
        }],
    }]).encode()
    models = parse_models(data, "models.json")
    m = models[0]
    assert len(m.versions) == 1
    v = m.versions[0]
    assert v.version == "1.0"
    assert v.notes == "initial"
    assert len(v.datasets) == 1
    ds = v.datasets[0]
    assert ds.id == "ds1"
    assert ds.name == "Training Set"
    assert ds.file_path == "data/train.csv"
    assert ds.row_count == 1000
    assert ds.columns == ["a", "b", "c"]


def test_parse_with_metrics():
    data = json.dumps([{
        "id": "m1",
        "status": "production",
        "metrics": {"accuracy": 0.92},
    }]).encode()
    models = parse_models(data, "models.json")
    assert models[0].metrics.accuracy == 0.92
    assert models[0].metrics.latency is None


def test_parse_with_files():
    data = json.dumps([{
        "id": "m1",
        "status": "production",
        "files": {"modelCard": "README.md"},
    }]).encode()
    models = parse_models(data, "models.json")
    assert models[0].files.model_card == "README.md"
    assert models[0].files.training_script is None


def test_parse_empty_content():
    with pytest.raises(ValueError, match="empty config file"):
        parse_models(b"", "models.json")


def test_parse_invalid_json():
    with pytest.raises(ValueError, match="config file must contain an array of models"):
        parse_models(b"not json at all", "models.json")


def test_parse_invalid_yaml():
    with pytest.raises(ValueError, match="config file must contain an array of models"):
        parse_models(b": : : invalid", "models.yaml")


def test_parse_not_an_array():
    data = json.dumps({"key": "value"}).encode()
    with pytest.raises(ValueError, match="config file must contain an array of models"):
        parse_models(data, "models.json")


def test_is_yaml_path():
    assert is_yaml_path("models.yaml") is True
    assert is_yaml_path("models.yml") is True
    assert is_yaml_path("models.YAML") is True
    assert is_yaml_path("models.json") is False
    assert is_yaml_path("models.txt") is False
