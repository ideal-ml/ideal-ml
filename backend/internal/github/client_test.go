package github

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"ideal-ml/backend/internal/config"
)

const testToken = "test-token"

func newTestServer(handler http.HandlerFunc) (*httptest.Server, *config.Store, *Client) {
	ts := httptest.NewServer(handler)
	store := config.NewStore()
	store.Set(&config.GitHubConfig{
		RepoOwner:  "test-owner",
		RepoName:   "test-repo",
		Branch:     "main",
		ConfigPath: "models.json",
	})
	client := NewClientWithBaseURL(store, ts.URL)
	return ts, store, client
}

func TestClient_FetchFileContent_Success(t *testing.T) {
	expected := `[{"name": "Test Model"}]`
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		encoded := base64.StdEncoding.EncodeToString([]byte(expected))
		json.NewEncoder(w).Encode(map[string]string{
			"content":  encoded,
			"encoding": "base64",
		})
	})
	defer ts.Close()

	content, err := client.FetchFileContent(testToken, "models.json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if string(content) != expected {
		t.Errorf("content = %q, want %q", string(content), expected)
	}
}

func TestClient_FetchFileContent_404(t *testing.T) {
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	})
	defer ts.Close()

	_, err := client.FetchFileContent(testToken, "missing.json")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "not found") && !strings.Contains(err.Error(), "Not found") {
		t.Errorf("error = %q, want it to contain 'not found'", err.Error())
	}
}

func TestClient_FetchFileContent_401(t *testing.T) {
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
	})
	defer ts.Close()

	_, err := client.FetchFileContent(testToken, "models.json")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "invalid GitHub token") {
		t.Errorf("error = %q, want it to contain 'invalid GitHub token'", err.Error())
	}
}

func TestClient_FetchFileContent_403(t *testing.T) {
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(403)
	})
	defer ts.Close()

	_, err := client.FetchFileContent(testToken, "models.json")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "access denied") {
		t.Errorf("error = %q, want it to contain 'access denied'", err.Error())
	}
}

func TestClient_FetchFileContent_SendsAuthHeader(t *testing.T) {
	var gotAuth string
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		encoded := base64.StdEncoding.EncodeToString([]byte("[]"))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	client.FetchFileContent(testToken, "models.json")

	if gotAuth != "Bearer test-token" {
		t.Errorf("Authorization = %q, want %q", gotAuth, "Bearer test-token")
	}
}

func TestClient_FetchFileContent_CorrectURL(t *testing.T) {
	var gotPath string
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path + "?" + r.URL.RawQuery
		encoded := base64.StdEncoding.EncodeToString([]byte("[]"))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	client.FetchFileContent(testToken, "path/to/file.yaml")

	expected := "/repos/test-owner/test-repo/contents/path/to/file.yaml?ref=main"
	if gotPath != expected {
		t.Errorf("URL = %q, want %q", gotPath, expected)
	}
}

func TestClient_TestConnection_Success(t *testing.T) {
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		content := `[{"name": "A"}, {"name": "B"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	count, err := client.TestConnection(testToken)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if count != 2 {
		t.Errorf("count = %d, want 2", count)
	}
}

func TestClient_TestConnection_Error(t *testing.T) {
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
	})
	defer ts.Close()

	_, err := client.TestConnection(testToken)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestClient_FetchModels_CachesResult(t *testing.T) {
	callCount := 0
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		content := `[{"name": "Cached"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	// First call
	models1, err := client.FetchModels(testToken, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Second call should be cached
	models2, err := client.FetchModels(testToken, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if callCount != 1 {
		t.Errorf("server called %d times, want 1 (cached)", callCount)
	}
	if len(models1) != 1 || len(models2) != 1 {
		t.Error("expected 1 model from both calls")
	}
}

func TestClient_FetchModels_RefreshBypassesCache(t *testing.T) {
	callCount := 0
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		content := `[{"name": "Fresh"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	client.FetchModels(testToken, false)
	client.FetchModels(testToken, true) // refresh

	if callCount != 2 {
		t.Errorf("server called %d times, want 2 (refresh bypasses cache)", callCount)
	}
}

func TestClient_InvalidateCache(t *testing.T) {
	callCount := 0
	ts, _, client := newTestServer(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		content := `[{"name": "Test"}]`
		encoded := base64.StdEncoding.EncodeToString([]byte(content))
		json.NewEncoder(w).Encode(map[string]string{"content": encoded})
	})
	defer ts.Close()

	client.FetchModels(testToken, false)
	client.InvalidateCache()
	client.FetchModels(testToken, false)

	if callCount != 2 {
		t.Errorf("server called %d times, want 2 (cache invalidated)", callCount)
	}
}

func TestClient_FetchFileContent_NotConfigured(t *testing.T) {
	store := config.NewStore()
	client := NewClient(store)

	_, err := client.FetchFileContent(testToken, "models.json")
	if err == nil {
		t.Fatal("expected error when not configured")
	}
	if !strings.Contains(err.Error(), "not configured") {
		t.Errorf("error = %q, want it to contain 'not configured'", err.Error())
	}
}
