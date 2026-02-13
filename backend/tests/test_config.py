import threading

from app.config import ConfigStore, GitHubConfig


def test_store_set_and_get():
    store = ConfigStore()
    cfg = GitHubConfig(repoOwner="owner", repoName="repo", branch="main", configPath="models.yaml")
    store.set(cfg)
    got = store.get()
    assert got is not None
    assert got.repo_owner == "owner"
    assert got.repo_name == "repo"
    assert got.branch == "main"
    assert got.config_path == "models.yaml"


def test_store_get_returns_none_when_empty():
    store = ConfigStore()
    assert store.get() is None


def test_store_clear():
    store = ConfigStore()
    store.set(GitHubConfig(repoOwner="o", repoName="r", branch="b", configPath="c"))
    store.clear()
    assert store.get() is None


def test_store_is_configured():
    store = ConfigStore()
    assert not store.is_configured()
    store.set(GitHubConfig(repoOwner="o", repoName="r", branch="b", configPath="c"))
    assert store.is_configured()
    store.clear()
    assert not store.is_configured()


def test_store_overwrite():
    store = ConfigStore()
    store.set(GitHubConfig(repoOwner="a", repoName="b", branch="c", configPath="d"))
    store.set(GitHubConfig(repoOwner="x", repoName="y", branch="z", configPath="w"))
    got = store.get()
    assert got.repo_owner == "x"
    assert got.repo_name == "y"


def test_store_get_returns_copy():
    store = ConfigStore()
    cfg = GitHubConfig(repoOwner="owner", repoName="repo", branch="main", configPath="models.yaml")
    store.set(cfg)

    got1 = store.get()
    got2 = store.get()
    assert got1 is not got2
    assert got1.repo_owner == got2.repo_owner


def test_store_concurrency():
    store = ConfigStore()
    errors = []

    def writer():
        try:
            for i in range(100):
                store.set(GitHubConfig(
                    repoOwner=f"owner-{i}",
                    repoName="repo",
                    branch="main",
                    configPath="models.yaml",
                ))
        except Exception as e:
            errors.append(e)

    def reader():
        try:
            for _ in range(100):
                store.get()
                store.is_configured()
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=writer) for _ in range(5)]
    threads += [threading.Thread(target=reader) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(errors) == 0
