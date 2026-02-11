package auth

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

type contextKey string

const tokenContextKey contextKey = "github_token"

type SessionData struct {
	Token     string
	Login     string
	Name      string
	AvatarURL string
	CreatedAt time.Time
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*SessionData
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]*SessionData),
	}
}

func generateSessionID() (string, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return "", err
	}
	return id.String(), nil
}

func (s *SessionStore) Create(data *SessionData) (string, error) {
	id, err := generateSessionID()
	if err != nil {
		return "", err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	data.CreatedAt = time.Now()
	s.sessions[id] = data
	return id, nil
}

func (s *SessionStore) Get(id string) *SessionData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.sessions[id]
}

func (s *SessionStore) Delete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, id)
}

const SessionCookieName = "session_id"

// Middleware checks for a valid session and injects the GitHub token into the request context.
func Middleware(store *SessionStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(SessionCookieName)
			if err != nil || cookie.Value == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			session := store.Get(cookie.Value)
			if session == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), tokenContextKey, session.Token)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// TokenFromContext extracts the GitHub token from the request context.
func TokenFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(tokenContextKey).(string); ok {
		return v
	}
	return ""
}

// NewContextWithToken creates a context with the given token. Useful for testing.
func NewContextWithToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, tokenContextKey, token)
}

// TestTokenContextKey returns the context key used for tokens. Exported for testing only.
func TestTokenContextKey() contextKey {
	return tokenContextKey
}
