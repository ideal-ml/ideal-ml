package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGitHubRedirect(t *testing.T) {
	h := NewAuthHandler(OAuthConfig{
		ClientID:    "test-client-id",
		RedirectURL: "http://localhost:8080/api/auth/github/callback",
	}, NewSessionStore())

	req := httptest.NewRequest("GET", "/api/auth/github", nil)
	w := httptest.NewRecorder()

	h.GitHubRedirect(w, req)

	if w.Code != http.StatusTemporaryRedirect {
		t.Errorf("status = %d, want %d", w.Code, http.StatusTemporaryRedirect)
	}

	loc := w.Header().Get("Location")
	if !strings.Contains(loc, "client_id=test-client-id") {
		t.Errorf("redirect URL missing client_id, got %q", loc)
	}
	if !strings.Contains(loc, "scope=repo") {
		t.Errorf("redirect URL missing scope=repo, got %q", loc)
	}
	if !strings.Contains(loc, "github.com/login/oauth/authorize") {
		t.Errorf("redirect URL not pointing to GitHub, got %q", loc)
	}
}

func TestCallback_ExchangesCode(t *testing.T) {
	// Mock GitHub token endpoint
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/login/oauth/access_token" {
			r.ParseForm()
			code := r.FormValue("code")
			if code != "test-code" {
				t.Errorf("code = %q, want %q", code, "test-code")
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"access_token": "gho_test_token",
				"token_type":   "bearer",
			})
			return
		}
		if r.URL.Path == "/user" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"login":      "testuser",
				"name":       "Test User",
				"avatar_url": "https://example.com/avatar.png",
			})
			return
		}
	}))
	defer tokenServer.Close()

	sessions := NewSessionStore()
	h := NewAuthHandler(OAuthConfig{
		ClientID:     "test-client-id",
		ClientSecret: "test-secret",
		RedirectURL:  "http://localhost:8080/api/auth/github/callback",
		FrontendURL:  "http://localhost:5173",
	}, sessions)

	// Override the client to point at our mock server
	h.client = tokenServer.Client()
	// We need to patch the URLs used in exchangeCode and fetchGitHubUser.
	// Since they hit github.com directly, we use a transport that redirects.
	h.client.Transport = &rewriteTransport{base: tokenServer.URL}

	req := httptest.NewRequest("GET", "/api/auth/github/callback?code=test-code", nil)
	w := httptest.NewRecorder()

	h.GitHubCallback(w, req)

	if w.Code != http.StatusTemporaryRedirect {
		t.Errorf("status = %d, want %d", w.Code, http.StatusTemporaryRedirect)
	}
}

func TestCallback_SetsCookie(t *testing.T) {
	tokenServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/login/oauth/access_token" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"access_token": "gho_test"})
			return
		}
		if r.URL.Path == "/user" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"login": "testuser", "name": "Test"})
			return
		}
	}))
	defer tokenServer.Close()

	sessions := NewSessionStore()
	h := NewAuthHandler(OAuthConfig{
		ClientID:    "id",
		FrontendURL: "http://localhost:5173",
	}, sessions)
	h.client = tokenServer.Client()
	h.client.Transport = &rewriteTransport{base: tokenServer.URL}

	req := httptest.NewRequest("GET", "/api/auth/github/callback?code=abc", nil)
	w := httptest.NewRecorder()
	h.GitHubCallback(w, req)

	cookies := w.Result().Cookies()
	found := false
	for _, c := range cookies {
		if c.Name == SessionCookieName {
			found = true
			if c.Value == "" {
				t.Error("session cookie is empty")
			}
			if !c.HttpOnly {
				t.Error("session cookie should be HttpOnly")
			}
		}
	}
	if !found {
		t.Error("session cookie not set")
	}
}

func TestMe_Authenticated(t *testing.T) {
	sessions := NewSessionStore()
	sid, _ := sessions.Create(&SessionData{
		Token:     "tok",
		Login:     "octocat",
		Name:      "Octo Cat",
		AvatarURL: "https://example.com/avatar.png",
	})

	h := NewAuthHandler(OAuthConfig{}, sessions)

	req := httptest.NewRequest("GET", "/api/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: SessionCookieName, Value: sid})
	w := httptest.NewRecorder()

	h.Me(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var body map[string]string
	json.NewDecoder(w.Body).Decode(&body)
	if body["login"] != "octocat" {
		t.Errorf("login = %q, want %q", body["login"], "octocat")
	}
	if body["name"] != "Octo Cat" {
		t.Errorf("name = %q, want %q", body["name"], "Octo Cat")
	}
}

func TestMe_Unauthenticated(t *testing.T) {
	h := NewAuthHandler(OAuthConfig{}, NewSessionStore())

	req := httptest.NewRequest("GET", "/api/auth/me", nil)
	w := httptest.NewRecorder()

	h.Me(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestLogout_ClearsSession(t *testing.T) {
	sessions := NewSessionStore()
	sid, _ := sessions.Create(&SessionData{Token: "tok", Login: "user"})

	h := NewAuthHandler(OAuthConfig{}, sessions)

	req := httptest.NewRequest("POST", "/api/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: SessionCookieName, Value: sid})
	w := httptest.NewRecorder()

	h.Logout(w, req)

	// Session should be gone
	if sessions.Get(sid) != nil {
		t.Error("session should be deleted after logout")
	}

	// Cookie should be cleared
	cookies := w.Result().Cookies()
	for _, c := range cookies {
		if c.Name == SessionCookieName && c.MaxAge != -1 {
			t.Error("session cookie should have MaxAge -1 after logout")
		}
	}
}

func TestAuthMiddleware_AllowsAuthenticated(t *testing.T) {
	sessions := NewSessionStore()
	sid, _ := sessions.Create(&SessionData{Token: "my-token", Login: "user"})

	handler := Middleware(sessions)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := TokenFromContext(r.Context())
		if token != "my-token" {
			t.Errorf("token = %q, want %q", token, "my-token")
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.AddCookie(&http.Cookie{Name: SessionCookieName, Value: sid})
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestAuthMiddleware_BlocksUnauthenticated(t *testing.T) {
	sessions := NewSessionStore()

	handler := Middleware(sessions)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called")
	}))

	req := httptest.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// rewriteTransport rewrites requests to github.com to point at the test server.
type rewriteTransport struct {
	base string
}

func (t *rewriteTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Rewrite the URL to point at the test server
	req.URL.Scheme = "http"
	req.URL.Host = strings.TrimPrefix(t.base, "http://")
	return http.DefaultTransport.RoundTrip(req)
}
