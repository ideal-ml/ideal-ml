package main

import (
	"bufio"
	"log"
	"net/http"
	"os"
	"strings"

	"ideal-ml/backend/internal/auth"
	"ideal-ml/backend/internal/server"
)

func main() {
	loadEnvFile(".env")

	frontendURL := envOrDefault("FRONTEND_URL", "http://localhost:5173")

	cfg := server.Config{
		OAuthConfig: auth.OAuthConfig{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			RedirectURL:  envOrDefault("GITHUB_REDIRECT_URL", "http://localhost:8080/api/auth/github/callback"),
			FrontendURL:  frontendURL,
		},
		AllowOrigins: []string{frontendURL, "http://localhost:3000"},
	}

	handler := server.New(cfg)

	log.Println("Backend listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// loadEnvFile reads a .env file and sets any variables not already in the environment.
func loadEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return // missing .env is fine
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, val, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		val = strings.TrimSpace(val)
		// Don't override existing env vars
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}
