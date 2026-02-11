package config

import "sync"

type GitHubConfig struct {
	RepoOwner  string `json:"repoOwner"`
	RepoName   string `json:"repoName"`
	Branch     string `json:"branch"`
	ConfigPath string `json:"configPath"`
}

type Store struct {
	mu     sync.RWMutex
	config *GitHubConfig
}

func NewStore() *Store {
	return &Store{}
}

func (s *Store) Set(cfg *GitHubConfig) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c := *cfg
	s.config = &c
}

func (s *Store) Get() *GitHubConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.config == nil {
		return nil
	}
	c := *s.config
	return &c
}

func (s *Store) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config = nil
}

func (s *Store) IsConfigured() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config != nil
}
