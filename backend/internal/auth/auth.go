package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type OAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	FrontendURL  string
}

type AuthHandler struct {
	config   OAuthConfig
	sessions *SessionStore
	client   *http.Client
}

func NewAuthHandler(cfg OAuthConfig, sessions *SessionStore) *AuthHandler {
	return &AuthHandler{
		config:   cfg,
		sessions: sessions,
		client:   &http.Client{Timeout: 15 * time.Second},
	}
}

// GitHubRedirect redirects the user to GitHub's OAuth authorize page.
func (h *AuthHandler) GitHubRedirect(w http.ResponseWriter, r *http.Request) {
	u := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo",
		url.QueryEscape(h.config.ClientID),
		url.QueryEscape(h.config.RedirectURL),
	)
	http.Redirect(w, r, u, http.StatusTemporaryRedirect)
}

// GitHubCallback handles the OAuth callback, exchanges the code for a token, and creates a session.
func (h *AuthHandler) GitHubCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code parameter", http.StatusBadRequest)
		return
	}

	// Exchange code for access token
	token, err := h.exchangeCode(code)
	if err != nil {
		http.Error(w, "failed to exchange code: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch user info from GitHub
	user, err := h.fetchGitHubUser(token)
	if err != nil {
		http.Error(w, "failed to fetch user info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Create session
	sessionID, err := h.sessions.Create(&SessionData{
		Token:     token,
		Login:     user.Login,
		Name:      user.Name,
		AvatarURL: user.AvatarURL,
	})
	if err != nil {
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400 * 7, // 7 days
	})

	http.Redirect(w, r, h.config.FrontendURL, http.StatusTemporaryRedirect)
}

type gitHubUser struct {
	Login     string `json:"login"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

// Me returns the current authenticated user's info.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil || cookie.Value == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	session := h.sessions.Get(cookie.Value)
	if session == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"login":      session.Login,
		"name":       session.Name,
		"avatar_url": session.AvatarURL,
	})
}

// Logout clears the session.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(SessionCookieName)
	if err == nil && cookie.Value != "" {
		h.sessions.Delete(cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"logged_out"}`))
}

func (h *AuthHandler) exchangeCode(code string) (string, error) {
	data := url.Values{
		"client_id":     {h.config.ClientID},
		"client_secret": {h.config.ClientSecret},
		"code":          {code},
		"redirect_uri":  {h.config.RedirectURL},
	}

	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := h.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request to GitHub failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Scope       string `json:"scope"`
		Error       string `json:"error"`
		ErrorDesc   string `json:"error_description"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse token response: %w", err)
	}

	if tokenResp.Error != "" {
		return "", fmt.Errorf("GitHub OAuth error: %s - %s", tokenResp.Error, tokenResp.ErrorDesc)
	}

	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("no access token in response")
	}

	return tokenResp.AccessToken, nil
}

func (h *AuthHandler) fetchGitHubUser(token string) (*gitHubUser, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := h.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request to GitHub failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	var user gitHubUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to parse user response: %w", err)
	}

	return &user, nil
}
