package handlers

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
)

func newTestFilesHandler(ghHandler http.HandlerFunc) (*FilesHandler, *httptest.Server) {
	ts := httptest.NewServer(ghHandler)
	store := config.NewStore()
	client := github.NewClientWithBaseURL(store, ts.URL)
	return NewFilesHandler(store, client), ts
}

func TestGetFile_Success(t *testing.T) {
	expectedContent := "print('hello world')"
	h, ts := newTestFilesHandler(func(w http.ResponseWriter, r *http.Request) {
		encoded := base64.StdEncoding.EncodeToString([]byte(expectedContent))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner: "test", RepoName: "repo", Branch: "main", ConfigPath: "models.json",
	})

	req := httptest.NewRequest("GET", "/api/files/src/train.py", nil)
	req = withToken(req, "tok")
	w := httptest.NewRecorder()

	h.Get(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}

	body := w.Body.String()
	if body != expectedContent {
		t.Errorf("body = %q, want %q", body, expectedContent)
	}

	ct := w.Header().Get("Content-Type")
	if !strings.Contains(ct, "text/plain") {
		t.Errorf("Content-Type = %q, want text/plain", ct)
	}
}

func TestGetFile_NotFound(t *testing.T) {
	h, ts := newTestFilesHandler(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner: "test", RepoName: "repo", Branch: "main", ConfigPath: "models.json",
	})

	req := httptest.NewRequest("GET", "/api/files/missing.py", nil)
	req = withToken(req, "tok")
	w := httptest.NewRecorder()

	h.Get(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestGetFile_Disconnected(t *testing.T) {
	h, ts := newTestFilesHandler(func(w http.ResponseWriter, r *http.Request) {})
	defer ts.Close()

	// Don't set any config — disconnected state

	req := httptest.NewRequest("GET", "/api/files/src/train.py", nil)
	w := httptest.NewRecorder()

	h.Get(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}
