package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/config"
	"ideal-ml/backend/internal/github"
	"ideal-ml/backend/internal/handlers"
)

type Config struct {
	OAuthConfig  auth.OAuthConfig
	AllowOrigins []string
}

func New(cfg Config) http.Handler {
	store := config.NewStore()
	client := github.NewClient(store)
	sessions := auth.NewSessionStore()

	return NewWithDeps(cfg, store, client, sessions)
}

func NewWithDeps(cfg Config, store *config.Store, client *github.Client, sessions *auth.SessionStore) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	origins := cfg.AllowOrigins
	if len(origins) == 0 {
		origins = []string{"http://localhost:5173", "http://localhost:3000"}
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	}))

	authHandler := auth.NewAuthHandler(cfg.OAuthConfig, sessions)

	connHandler := handlers.NewConnectionHandler(store, client)
	modelsHandler := handlers.NewModelsHandler(store, client)
	filesHandler := handlers.NewFilesHandler(store, client)

	// Public routes
	r.Get("/api/health", handlers.HealthHandler())
	r.Get("/api/auth/github", authHandler.GitHubRedirect)
	r.Get("/api/auth/github/callback", authHandler.GitHubCallback)
	r.Get("/api/auth/me", authHandler.Me)
	r.Post("/api/auth/logout", authHandler.Logout)

	// Protected routes — require authenticated session
	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware(sessions))

		r.Post("/api/connection", connHandler.Connect)
		r.Delete("/api/connection", connHandler.Disconnect)
		r.Get("/api/connection/status", connHandler.Status)
		r.Get("/api/models", modelsHandler.List)
		r.Get("/api/models/{id}", modelsHandler.Get)
		r.Get("/api/files/*", filesHandler.Get)
	})

	return r
}
