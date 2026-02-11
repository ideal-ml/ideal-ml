package config

import (
	"sync"
	"testing"
)

func TestStore_SetAndGet(t *testing.T) {
	s := NewStore()
	cfg := &GitHubConfig{
		RepoOwner:  "my-org",
		RepoName:   "my-repo",
		Branch:     "main",
		ConfigPath: "models.yaml",
	}

	s.Set(cfg)
	got := s.Get()

	if got == nil {
		t.Fatal("expected config, got nil")
	}
	if got.RepoOwner != "my-org" {
		t.Errorf("RepoOwner = %q, want %q", got.RepoOwner, "my-org")
	}
	if got.RepoName != "my-repo" {
		t.Errorf("RepoName = %q, want %q", got.RepoName, "my-repo")
	}
	if got.Branch != "main" {
		t.Errorf("Branch = %q, want %q", got.Branch, "main")
	}
	if got.ConfigPath != "models.yaml" {
		t.Errorf("ConfigPath = %q, want %q", got.ConfigPath, "models.yaml")
	}
}

func TestStore_Get_ReturnsNilWhenEmpty(t *testing.T) {
	s := NewStore()
	if got := s.Get(); got != nil {
		t.Errorf("expected nil, got %+v", got)
	}
}

func TestStore_Clear(t *testing.T) {
	s := NewStore()
	s.Set(&GitHubConfig{RepoOwner: "test", RepoName: "test"})
	s.Clear()
	if got := s.Get(); got != nil {
		t.Errorf("expected nil after Clear, got %+v", got)
	}
}

func TestStore_IsConfigured(t *testing.T) {
	s := NewStore()

	if s.IsConfigured() {
		t.Error("expected false when empty")
	}

	s.Set(&GitHubConfig{RepoOwner: "test", RepoName: "test"})
	if !s.IsConfigured() {
		t.Error("expected true after Set")
	}

	s.Clear()
	if s.IsConfigured() {
		t.Error("expected false after Clear")
	}
}

func TestStore_Concurrency(t *testing.T) {
	s := NewStore()
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(2)
		go func() {
			defer wg.Done()
			s.Set(&GitHubConfig{RepoOwner: "test", RepoName: "test"})
		}()
		go func() {
			defer wg.Done()
			_ = s.Get()
		}()
	}

	wg.Wait()
}

func TestStore_Set_OverwritesPrevious(t *testing.T) {
	s := NewStore()
	s.Set(&GitHubConfig{RepoOwner: "first", RepoName: "first"})
	s.Set(&GitHubConfig{RepoOwner: "second", RepoName: "second"})

	got := s.Get()
	if got.RepoOwner != "second" {
		t.Errorf("RepoOwner = %q, want %q", got.RepoOwner, "second")
	}
}

func TestStore_Get_ReturnsCopy(t *testing.T) {
	s := NewStore()
	s.Set(&GitHubConfig{RepoOwner: "original", RepoName: "test"})

	got := s.Get()
	got.RepoOwner = "modified"

	got2 := s.Get()
	if got2.RepoOwner != "original" {
		t.Errorf("Get should return a copy; store was mutated")
	}
}
