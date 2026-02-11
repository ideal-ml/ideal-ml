package handlers

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
)

func newTestModelsHandler(ghHandler http.HandlerFunc) (*ModelsHandler, *httptest.Server) {
	ts := httptest.NewServer(ghHandler)
	store := config.NewStore()
	client := github.NewClientWithBaseURL(store, ts.URL)
	return NewModelsHandler(store, client), ts
}

func TestListModels_Connected(t *testing.T) {
	h, ts := newTestModelsHandler(func(w http.ResponseWriter, r *http.Request) {
		content := `[{"id": "m1", "name": "Model One"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner:  "test",
		RepoName:   "repo",
		Branch:     "main",
		ConfigPath: "models.json",
	})

	req := httptest.NewRequest("GET", "/api/models", nil)
	req = withToken(req, "tok")
	w := httptest.NewRecorder()

	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp modelsResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Source != "github" {
		t.Errorf("source = %q, want %q", resp.Source, "github")
	}
	if len(resp.Models) != 1 {
		t.Errorf("model count = %d, want 1", len(resp.Models))
	}
}

func TestListModels_Disconnected(t *testing.T) {
	h, ts := newTestModelsHandler(func(w http.ResponseWriter, r *http.Request) {})
	defer ts.Close()

	req := httptest.NewRequest("GET", "/api/models", nil)
	w := httptest.NewRecorder()

	h.List(w, req)

	var resp modelsResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Source != "none" {
		t.Errorf("source = %q, want %q", resp.Source, "none")
	}
	if len(resp.Models) != 0 {
		t.Errorf("model count = %d, want 0", len(resp.Models))
	}
}

func TestListModels_RefreshParam(t *testing.T) {
	callCount := 0
	h, ts := newTestModelsHandler(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		content := `[{"name": "Model"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner: "test", RepoName: "repo", Branch: "main", ConfigPath: "models.json",
	})

	// First call
	req := httptest.NewRequest("GET", "/api/models", nil)
	req = withToken(req, "tok")
	h.List(httptest.NewRecorder(), req)

	// Second call with refresh
	req = httptest.NewRequest("GET", "/api/models?refresh=true", nil)
	req = withToken(req, "tok")
	h.List(httptest.NewRecorder(), req)

	if callCount != 2 {
		t.Errorf("GitHub API called %d times, want 2 (refresh should bypass cache)", callCount)
	}
}

func TestGetModel_Found(t *testing.T) {
	h, ts := newTestModelsHandler(func(w http.ResponseWriter, r *http.Request) {
		content := `[{"id": "abc", "name": "Found Model"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner: "test", RepoName: "repo", Branch: "main", ConfigPath: "models.json",
	})

	// Need chi router context for URL params
	r := chi.NewRouter()
	r.Get("/api/models/{id}", h.Get)

	req := httptest.NewRequest("GET", "/api/models/abc", nil)
	ctx := auth.NewContextWithToken(req.Context(), "tok")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var model github.Model
	json.NewDecoder(w.Body).Decode(&model)
	if model.Name != "Found Model" {
		t.Errorf("name = %q, want %q", model.Name, "Found Model")
	}
}

func TestGetModel_NotFound(t *testing.T) {
	h, ts := newTestModelsHandler(func(w http.ResponseWriter, r *http.Request) {
		content := `[{"id": "other", "name": "Other Model"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner: "test", RepoName: "repo", Branch: "main", ConfigPath: "models.json",
	})

	r := chi.NewRouter()
	r.Get("/api/models/{id}", h.Get)

	req := httptest.NewRequest("GET", "/api/models/nonexistent", nil)
	ctx := auth.NewContextWithToken(req.Context(), "tok")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}
