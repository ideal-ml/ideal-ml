package handlers

import (
	"net/http"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
)

type FilesHandler struct {
	store  *config.Store
	client *github.Client
}

func NewFilesHandler(store *config.Store, client *github.Client) *FilesHandler {
	return &FilesHandler{store: store, client: client}
}

func (h *FilesHandler) Get(w http.ResponseWriter, r *http.Request) {
	if !h.store.IsConfigured() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "GitHub not configured"})
		return
	}

	// Extract the file path from the URL (everything after /api/files/)
	path := r.URL.Path[len("/api/files/"):]
	if path == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "file path required"})
		return
	}

	token := auth.TokenFromContext(r.Context())
	content, err := h.client.FetchFileContent(token, path)
	if err != nil {
		status := http.StatusInternalServerError
		if contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write(content)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
