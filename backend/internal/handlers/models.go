package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
)

type ModelsHandler struct {
	store  *config.Store
	client *github.Client
}

func NewModelsHandler(store *config.Store, client *github.Client) *ModelsHandler {
	return &ModelsHandler{store: store, client: client}
}

type modelsResponse struct {
	Models []github.Model `json:"models"`
	Source string         `json:"source"`
}

func (h *ModelsHandler) List(w http.ResponseWriter, r *http.Request) {
	if !h.store.IsConfigured() {
		writeJSON(w, http.StatusOK, modelsResponse{
			Models: []github.Model{},
			Source: "none",
		})
		return
	}

	token := auth.TokenFromContext(r.Context())
	refresh := r.URL.Query().Get("refresh") == "true"
	models, err := h.client.FetchModels(token, refresh)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, modelsResponse{
		Models: models,
		Source: "github",
	})
}

func (h *ModelsHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if !h.store.IsConfigured() {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "model not found"})
		return
	}

	token := auth.TokenFromContext(r.Context())
	models, err := h.client.FetchModels(token, false)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	for _, m := range models {
		if m.ID == id {
			writeJSON(w, http.StatusOK, m)
			return
		}
	}

	writeJSON(w, http.StatusNotFound, map[string]string{"error": "model not found"})
}
