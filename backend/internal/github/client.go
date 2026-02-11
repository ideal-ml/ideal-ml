package github

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"ideal-ml/backend/internal/config"
)

const cacheTTL = 5 * time.Minute

type cachedModels struct {
	models    []Model
	fetchedAt time.Time
	cacheKey  string
}

type Client struct {
	httpClient *http.Client
	store      *config.Store
	baseURL    string

	mu    sync.RWMutex
	cache *cachedModels
}

func NewClient(store *config.Store) *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 15 * time.Second},
		store:      store,
		baseURL:    "https://api.github.com",
	}
}

// NewClientWithBaseURL creates a client with a custom base URL (for testing / GitHub Enterprise).
func NewClientWithBaseURL(store *config.Store, baseURL string) *Client {
	c := NewClient(store)
	c.baseURL = baseURL
	return c
}

func (c *Client) cacheKey(cfg *config.GitHubConfig) string {
	return fmt.Sprintf("%s/%s/%s/%s", cfg.RepoOwner, cfg.RepoName, cfg.Branch, cfg.ConfigPath)
}

func (c *Client) getCache(key string) []Model {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.cache != nil && c.cache.cacheKey == key && time.Since(c.cache.fetchedAt) < cacheTTL {
		models := make([]Model, len(c.cache.models))
		copy(models, c.cache.models)
		return models
	}
	return nil
}

func (c *Client) setCache(key string, models []Model) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache = &cachedModels{
		models:    models,
		fetchedAt: time.Now(),
		cacheKey:  key,
	}
}

func (c *Client) InvalidateCache() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache = nil
}

// FetchFileContent retrieves a file from the configured GitHub repo and returns the decoded content.
// The token parameter is the GitHub OAuth token for authentication.
func (c *Client) FetchFileContent(token, path string) ([]byte, error) {
	cfg := c.store.Get()
	if cfg == nil {
		return nil, fmt.Errorf("GitHub not configured")
	}

	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s?ref=%s",
		c.baseURL, cfg.RepoOwner, cfg.RepoName, path, cfg.Branch)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
		log.Printf("[github] GET %s (token: %s...)", url, token[:min(8, len(token))])
	} else {
		log.Printf("[github] GET %s (NO TOKEN)", url)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reach GitHub API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, mapGitHubError(resp, token != "", path)
	}

	var data struct {
		Content  string `json:"content"`
		Encoding string `json:"encoding"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to parse GitHub response: %w", err)
	}

	decoded, err := base64.StdEncoding.DecodeString(data.Content)
	if err != nil {
		// GitHub sometimes uses base64 with newlines
		decoded, err = base64.RawStdEncoding.DecodeString(
			strings.ReplaceAll(data.Content, "\n", ""))
		if err != nil {
			return nil, fmt.Errorf("failed to decode file content: %w", err)
		}
	}

	return decoded, nil
}

// FetchModels retrieves and parses models from the configured config file.
// The token parameter is the GitHub OAuth token for authentication.
func (c *Client) FetchModels(token string, refresh bool) ([]Model, error) {
	cfg := c.store.Get()
	if cfg == nil {
		return nil, fmt.Errorf("GitHub not configured")
	}

	key := c.cacheKey(cfg)

	if !refresh {
		if cached := c.getCache(key); cached != nil {
			return cached, nil
		}
	}

	content, err := c.FetchFileContent(token, cfg.ConfigPath)
	if err != nil {
		return nil, err
	}

	models, err := ParseModels(content, cfg.ConfigPath)
	if err != nil {
		return nil, err
	}

	c.setCache(key, models)
	return models, nil
}

// TestConnection tests the connection and returns the model count.
// The token parameter is the GitHub OAuth token for authentication.
func (c *Client) TestConnection(token string) (int, error) {
	c.InvalidateCache()
	models, err := c.FetchModels(token, true)
	if err != nil {
		return 0, err
	}
	return len(models), nil
}

func mapGitHubError(resp *http.Response, hasToken bool, path string) error {
	// Read GitHub's error message for context
	var ghErr struct {
		Message string `json:"message"`
	}
	json.NewDecoder(resp.Body).Decode(&ghErr)

	switch resp.StatusCode {
	case 404:
		if !hasToken {
			return fmt.Errorf("file not found: %s (no auth token — if this is a private repo, sign in first)", path)
		}
		return fmt.Errorf("not found: %s (GitHub says: %s — check repo name, branch, and that your token has 'repo' scope)", path, ghErr.Message)
	case 401:
		return fmt.Errorf("invalid GitHub token: %s", ghErr.Message)
	case 403:
		return fmt.Errorf("access denied: %s", ghErr.Message)
	default:
		return fmt.Errorf("GitHub API error %d: %s", resp.StatusCode, ghErr.Message)
	}
}
