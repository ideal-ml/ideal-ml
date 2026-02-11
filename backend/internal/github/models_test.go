package github

import (
	"testing"
)

func TestParseModels_JSON_Array(t *testing.T) {
	content := `[
		{"id": "m1", "name": "Model One", "version": "1.0", "status": "production"},
		{"id": "m2", "name": "Model Two", "version": "2.0", "status": "staging"}
	]`

	models, err := ParseModels([]byte(content), "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(models) != 2 {
		t.Fatalf("expected 2 models, got %d", len(models))
	}
	if models[0].ID != "m1" {
		t.Errorf("models[0].ID = %q, want %q", models[0].ID, "m1")
	}
	if models[1].Name != "Model Two" {
		t.Errorf("models[1].Name = %q, want %q", models[1].Name, "Model Two")
	}
}

func TestParseModels_JSON_WrappedInModelsKey(t *testing.T) {
	content := `{"models": [{"id": "m1", "name": "Wrapped"}]}`

	models, err := ParseModels([]byte(content), "config.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(models) != 1 {
		t.Fatalf("expected 1 model, got %d", len(models))
	}
	if models[0].Name != "Wrapped" {
		t.Errorf("Name = %q, want %q", models[0].Name, "Wrapped")
	}
}

func TestParseModels_YAML(t *testing.T) {
	content := `
- id: m1
  name: YAML Model
  version: "1.0"
  status: production
`
	models, err := ParseModels([]byte(content), "models.yaml")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(models) != 1 {
		t.Fatalf("expected 1 model, got %d", len(models))
	}
	if models[0].Name != "YAML Model" {
		t.Errorf("Name = %q, want %q", models[0].Name, "YAML Model")
	}
}

func TestParseModels_MinimalFields(t *testing.T) {
	content := `[{"name": "Minimal"}]`

	models, err := ParseModels([]byte(content), "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	m := models[0]
	if m.ID != "model-0" {
		t.Errorf("ID = %q, want %q", m.ID, "model-0")
	}
	if m.Version != "Unknown" {
		t.Errorf("Version = %q, want %q", m.Version, "Unknown")
	}
	if m.Status != "development" {
		t.Errorf("Status = %q, want %q", m.Status, "development")
	}
	if m.Framework != "Unknown" {
		t.Errorf("Framework = %q, want %q", m.Framework, "Unknown")
	}
	if m.Owner != "Unknown" {
		t.Errorf("Owner = %q, want %q", m.Owner, "Unknown")
	}
}

func TestParseModels_AllFields(t *testing.T) {
	content := `[{
		"id": "full",
		"name": "Full Model",
		"version": "3.0.0",
		"description": "A complete model",
		"framework": "PyTorch",
		"status": "production",
		"owner": "Alice",
		"createdAt": "2024-01-01",
		"updatedAt": "2024-06-01",
		"metrics": {"accuracy": 0.95, "latency": 42.0},
		"files": {
			"modelCard": "docs/card.md",
			"trainingScript": "src/train.py",
			"featureScript": "src/features.py",
			"inferenceScript": "src/infer.py",
			"modelFile": "models/model.pt"
		},
		"versions": [{
			"version": "2.0.0",
			"createdAt": "2024-01-01",
			"notes": "Initial release",
			"datasets": [{
				"id": "ds1",
				"name": "Training Data",
				"filePath": "data/train.csv",
				"description": "Training dataset",
				"rowCount": 1000,
				"columns": ["col1", "col2"],
				"addedAt": "2024-01-01"
			}]
		}]
	}]`

	models, err := ParseModels([]byte(content), "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	m := models[0]
	if m.ID != "full" {
		t.Errorf("ID = %q, want %q", m.ID, "full")
	}
	if m.Metrics == nil || *m.Metrics.Accuracy != 0.95 {
		t.Errorf("Metrics.Accuracy unexpected")
	}
	if m.Metrics == nil || *m.Metrics.Latency != 42.0 {
		t.Errorf("Metrics.Latency unexpected")
	}
	if m.Files == nil || m.Files.TrainingScript != "src/train.py" {
		t.Errorf("Files.TrainingScript unexpected")
	}
	if len(m.Versions) != 1 {
		t.Fatalf("expected 1 version, got %d", len(m.Versions))
	}
	if len(m.Versions[0].Datasets) != 1 {
		t.Fatalf("expected 1 dataset, got %d", len(m.Versions[0].Datasets))
	}
	ds := m.Versions[0].Datasets[0]
	if ds.Name != "Training Data" {
		t.Errorf("Dataset Name = %q, want %q", ds.Name, "Training Data")
	}
	if ds.RowCount == nil || *ds.RowCount != 1000 {
		t.Errorf("Dataset RowCount unexpected")
	}
}

func TestParseModels_InvalidStatus(t *testing.T) {
	content := `[{"name": "Bad Status", "status": "banana"}]`

	models, err := ParseModels([]byte(content), "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if models[0].Status != "development" {
		t.Errorf("Status = %q, want %q", models[0].Status, "development")
	}
}

func TestParseModels_WithVersionsAndDatasets(t *testing.T) {
	content := `
- name: Versioned Model
  versions:
    - version: "1.0"
      createdAt: "2024-01-01"
      datasets:
        - id: ds1
          name: Dataset A
          filePath: data/a.csv
          addedAt: "2024-01-01"
        - id: ds2
          name: Dataset B
          filePath: data/b.csv
          addedAt: "2024-02-01"
`
	models, err := ParseModels([]byte(content), "models.yml")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(models[0].Versions) != 1 {
		t.Fatalf("expected 1 version, got %d", len(models[0].Versions))
	}
	if len(models[0].Versions[0].Datasets) != 2 {
		t.Fatalf("expected 2 datasets, got %d", len(models[0].Versions[0].Datasets))
	}
}

func TestParseModels_WithMetrics(t *testing.T) {
	content := `[{"name": "Metrics Model", "metrics": {"accuracy": 0.92, "latency": 15.5}}]`

	models, err := ParseModels([]byte(content), "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if models[0].Metrics == nil {
		t.Fatal("expected metrics")
	}
	if *models[0].Metrics.Accuracy != 0.92 {
		t.Errorf("Accuracy = %v, want 0.92", *models[0].Metrics.Accuracy)
	}
}

func TestParseModels_WithFiles(t *testing.T) {
	content := `[{"name": "Files Model", "files": {"trainingScript": "train.py", "modelCard": "card.md"}}]`

	models, err := ParseModels([]byte(content), "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if models[0].Files == nil {
		t.Fatal("expected files")
	}
	if models[0].Files.TrainingScript != "train.py" {
		t.Errorf("TrainingScript = %q, want %q", models[0].Files.TrainingScript, "train.py")
	}
}

func TestParseModels_EmptyContent(t *testing.T) {
	_, err := ParseModels([]byte{}, "models.json")
	if err == nil {
		t.Error("expected error for empty content")
	}
}

func TestParseModels_InvalidJSON(t *testing.T) {
	_, err := ParseModels([]byte("{not valid json}"), "models.json")
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestParseModels_InvalidYAML(t *testing.T) {
	_, err := ParseModels([]byte(":\n  :\n    - [invalid"), "models.yaml")
	if err == nil {
		t.Error("expected error for invalid YAML")
	}
}

func TestParseModels_NotAnArray(t *testing.T) {
	_, err := ParseModels([]byte(`{"name": "not an array"}`), "models.json")
	if err == nil {
		t.Error("expected error when config is not an array")
	}
}

func TestIsYAMLPath(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"models.yaml", true},
		{"models.yml", true},
		{"models.YAML", true},
		{"models.YML", true},
		{"models.json", false},
		{"config.toml", false},
		{"path/to/models.yaml", true},
	}

	for _, tt := range tests {
		if got := IsYAMLPath(tt.path); got != tt.want {
			t.Errorf("IsYAMLPath(%q) = %v, want %v", tt.path, got, tt.want)
		}
	}
}
