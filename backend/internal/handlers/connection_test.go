package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
)

func newTestConnectionHandler(ghHandler http.HandlerFunc) (*ConnectionHandler, *httptest.Server) {
	ts := httptest.NewServer(ghHandler)
	store := config.NewStore()
	client := github.NewClientWithBaseURL(store, ts.URL)
	return NewConnectionHandler(store, client), ts
}

func withToken(req *http.Request, token string) *http.Request {
	ctx := auth.NewContextWithToken(req.Context(), token)
	return req.WithContext(ctx)
}

func TestConnect_Success(t *testing.T) {
	h, ts := newTestConnectionHandler(func(w http.ResponseWriter, r *http.Request) {
		content := `[{"name": "A"}, {"name": "B"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	body := `{"repoOwner":"test","repoName":"repo","branch":"main","configPath":"models.json"}`
	req := httptest.NewRequest("POST", "/api/connection", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req = withToken(req, "ghp_xxx")
	w := httptest.NewRecorder()

	h.Connect(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp connectionResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "connected" {
		t.Errorf("status = %q, want %q", resp.Status, "connected")
	}
	if resp.ModelCount == nil || *resp.ModelCount != 2 {
		t.Errorf("modelCount unexpected, got %v", resp.ModelCount)
	}
}

func TestConnect_MissingFields(t *testing.T) {
	h, ts := newTestConnectionHandler(func(w http.ResponseWriter, r *http.Request) {})
	defer ts.Close()

	body := `{"repoOwner":"","repoName":""}`
	req := httptest.NewRequest("POST", "/api/connection", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req = withToken(req, "tok")
	w := httptest.NewRecorder()

	h.Connect(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestConnect_GitHubError(t *testing.T) {
	h, ts := newTestConnectionHandler(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
	})
	defer ts.Close()

	body := `{"repoOwner":"test","repoName":"repo"}`
	req := httptest.NewRequest("POST", "/api/connection", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req = withToken(req, "bad")
	w := httptest.NewRecorder()

	h.Connect(w, req)

	var resp connectionResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "error" {
		t.Errorf("status = %q, want %q", resp.Status, "error")
	}
	if resp.Error == "" {
		t.Error("expected error message")
	}
}

func TestDisconnect(t *testing.T) {
	h, ts := newTestConnectionHandler(func(w http.ResponseWriter, r *http.Request) {})
	defer ts.Close()

	req := httptest.NewRequest("DELETE", "/api/connection", nil)
	w := httptest.NewRecorder()

	h.Disconnect(w, req)

	var resp connectionResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "disconnected" {
		t.Errorf("status = %q, want %q", resp.Status, "disconnected")
	}
}

func TestGetStatus_Connected(t *testing.T) {
	h, ts := newTestConnectionHandler(func(w http.ResponseWriter, r *http.Request) {})
	defer ts.Close()

	h.store.Set(&config.GitHubConfig{
		RepoOwner:  "my-org",
		RepoName:   "my-repo",
		Branch:     "main",
		ConfigPath: "models.yaml",
	})

	req := httptest.NewRequest("GET", "/api/connection/status", nil)
	w := httptest.NewRecorder()

	h.Status(w, req)

	var resp connectionResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "connected" {
		t.Errorf("status = %q, want %q", resp.Status, "connected")
	}
	if resp.RepoOwner != "my-org" {
		t.Errorf("repoOwner = %q, want %q", resp.RepoOwner, "my-org")
	}
}

func TestGetStatus_Disconnected(t *testing.T) {
	h, ts := newTestConnectionHandler(func(w http.ResponseWriter, r *http.Request) {})
	defer ts.Close()

	req := httptest.NewRequest("GET", "/api/connection/status", nil)
	w := httptest.NewRecorder()

	h.Status(w, req)

	var resp connectionResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "disconnected" {
		t.Errorf("status = %q, want %q", resp.Status, "disconnected")
	}
}
