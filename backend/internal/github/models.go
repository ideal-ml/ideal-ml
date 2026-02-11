package github

import (
	"encoding/json"
	"fmt"
	"strings"

	"gopkg.in/yaml.v3"
)

type ModelMetrics struct {
	Accuracy *float64 `json:"accuracy,omitempty" yaml:"accuracy,omitempty"`
	Latency  *float64 `json:"latency,omitempty" yaml:"latency,omitempty"`
}

type ModelFiles struct {
	ModelCard       string `json:"modelCard,omitempty" yaml:"modelCard,omitempty"`
	TrainingScript  string `json:"trainingScript,omitempty" yaml:"trainingScript,omitempty"`
	FeatureScript   string `json:"featureScript,omitempty" yaml:"featureScript,omitempty"`
	InferenceScript string `json:"inferenceScript,omitempty" yaml:"inferenceScript,omitempty"`
	ModelFile       string `json:"modelFile,omitempty" yaml:"modelFile,omitempty"`
}

type Dataset struct {
	ID          string   `json:"id" yaml:"id"`
	Name        string   `json:"name" yaml:"name"`
	FilePath    string   `json:"filePath" yaml:"filePath"`
	Description string   `json:"description,omitempty" yaml:"description,omitempty"`
	RowCount    *int     `json:"rowCount,omitempty" yaml:"rowCount,omitempty"`
	Columns     []string `json:"columns,omitempty" yaml:"columns,omitempty"`
	AddedAt     string   `json:"addedAt" yaml:"addedAt"`
}

type ModelVersion struct {
	Version   string    `json:"version" yaml:"version"`
	Datasets  []Dataset `json:"datasets" yaml:"datasets"`
	CreatedAt string    `json:"createdAt" yaml:"createdAt"`
	Notes     string    `json:"notes,omitempty" yaml:"notes,omitempty"`
}

type Model struct {
	ID          string         `json:"id" yaml:"id"`
	Name        string         `json:"name" yaml:"name"`
	Version     string         `json:"version" yaml:"version"`
	Description string         `json:"description" yaml:"description"`
	Framework   string         `json:"framework" yaml:"framework"`
	Status      string         `json:"status" yaml:"status"`
	Owner       string         `json:"owner" yaml:"owner"`
	CreatedAt   string         `json:"createdAt" yaml:"createdAt"`
	UpdatedAt   string         `json:"updatedAt" yaml:"updatedAt"`
	Metrics     *ModelMetrics  `json:"metrics,omitempty" yaml:"metrics,omitempty"`
	Files       *ModelFiles    `json:"files,omitempty" yaml:"files,omitempty"`
	Versions    []ModelVersion `json:"versions,omitempty" yaml:"versions,omitempty"`
}

func IsYAMLPath(path string) bool {
	lower := strings.ToLower(path)
	return strings.HasSuffix(lower, ".yaml") || strings.HasSuffix(lower, ".yml")
}

func ParseModels(content []byte, path string) ([]Model, error) {
	if len(content) == 0 {
		return nil, fmt.Errorf("empty config file")
	}

	if IsYAMLPath(path) {
		return parseYAML(content)
	}
	return parseJSON(content)
}

func parseJSON(content []byte) ([]Model, error) {
	// Try as array first
	var models []Model
	if err := json.Unmarshal(content, &models); err == nil {
		return normalizeModels(models), nil
	}

	// Try as {"models": [...]}
	var wrapped struct {
		Models []Model `json:"models"`
	}
	if err := json.Unmarshal(content, &wrapped); err == nil && wrapped.Models != nil {
		return normalizeModels(wrapped.Models), nil
	}

	return nil, fmt.Errorf("config file must contain an array of models")
}

func parseYAML(content []byte) ([]Model, error) {
	// Try as array first
	var models []Model
	if err := yaml.Unmarshal(content, &models); err == nil && len(models) > 0 {
		return normalizeModels(models), nil
	}

	// Try as {"models": [...]}
	var wrapped struct {
		Models []Model `yaml:"models"`
	}
	if err := yaml.Unmarshal(content, &wrapped); err == nil && wrapped.Models != nil {
		return normalizeModels(wrapped.Models), nil
	}

	return nil, fmt.Errorf("config file must contain an array of models")
}

func normalizeModels(models []Model) []Model {
	for i := range models {
		normalizeModel(&models[i], i)
	}
	return models
}

func normalizeModel(m *Model, index int) {
	if m.ID == "" {
		m.ID = fmt.Sprintf("model-%d", index)
	}
	if m.Name == "" {
		m.Name = "Unnamed Model"
	}
	if m.Version == "" {
		m.Version = "Unknown"
	}
	if m.Framework == "" {
		m.Framework = "Unknown"
	}
	if !isValidStatus(m.Status) {
		m.Status = "development"
	}
	if m.Owner == "" {
		m.Owner = "Unknown"
	}
	if m.CreatedAt == "" {
		m.CreatedAt = "Unknown"
	}
	if m.UpdatedAt == "" {
		m.UpdatedAt = "Unknown"
	}
}

func isValidStatus(status string) bool {
	switch status {
	case "development", "staging", "production", "archived":
		return true
	}
	return false
}
