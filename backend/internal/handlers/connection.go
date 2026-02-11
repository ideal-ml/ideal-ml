package handlers

import (
	"encoding/json"
	"net/http"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
)

type ConnectionHandler struct {
	store  *config.Store
	client *github.Client
}

func NewConnectionHandler(store *config.Store, client *github.Client) *ConnectionHandler {
	return &ConnectionHandler{store: store, client: client}
}

type connectRequest struct {
	RepoOwner  string `json:"repoOwner"`
	RepoName   string `json:"repoName"`
	Branch     string `json:"branch"`
	ConfigPath string `json:"configPath"`
}

type connectionResponse struct {
	Status     string `json:"status"`
	ModelCount *int   `json:"modelCount,omitempty"`
	Error      string `json:"error,omitempty"`
	RepoOwner  string `json:"repoOwner,omitempty"`
	RepoName   string `json:"repoName,omitempty"`
	Branch     string `json:"branch,omitempty"`
	ConfigPath string `json:"configPath,omitempty"`
}

func (h *ConnectionHandler) Connect(w http.ResponseWriter, r *http.Request) {
	var req connectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, connectionResponse{
			Status: "error",
			Error:  "invalid request body",
		})
		return
	}

	if req.RepoOwner == "" || req.RepoName == "" {
		writeJSON(w, http.StatusBadRequest, connectionResponse{
			Status: "error",
			Error:  "repoOwner and repoName are required",
		})
		return
	}

	cfg := &config.GitHubConfig{
		RepoOwner:  req.RepoOwner,
		RepoName:   req.RepoName,
		Branch:     req.Branch,
		ConfigPath: req.ConfigPath,
	}
	if cfg.Branch == "" {
		cfg.Branch = "main"
	}
	if cfg.ConfigPath == "" {
		cfg.ConfigPath = "models.yaml"
	}

	h.store.Set(cfg)

	token := auth.TokenFromContext(r.Context())
	count, err := h.client.TestConnection(token)
	if err != nil {
		h.store.Clear()
		writeJSON(w, http.StatusOK, connectionResponse{
			Status: "error",
			Error:  err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, connectionResponse{
		Status:     "connected",
		ModelCount: &count,
	})
}

func (h *ConnectionHandler) Disconnect(w http.ResponseWriter, r *http.Request) {
	h.store.Clear()
	h.client.InvalidateCache()
	writeJSON(w, http.StatusOK, connectionResponse{Status: "disconnected"})
}

func (h *ConnectionHandler) Status(w http.ResponseWriter, r *http.Request) {
	cfg := h.store.Get()
	if cfg == nil {
		writeJSON(w, http.StatusOK, connectionResponse{Status: "disconnected"})
		return
	}

	writeJSON(w, http.StatusOK, connectionResponse{
		Status:     "connected",
		RepoOwner:  cfg.RepoOwner,
		RepoName:   cfg.RepoName,
		Branch:     cfg.Branch,
		ConfigPath: cfg.ConfigPath,
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
