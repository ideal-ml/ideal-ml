from fastapi import APIRouter, Depends, Request

from app.config import GitHubConfig

router = APIRouter()


def _require_auth():
    raise NotImplementedError("Must be overridden at app level")


@router.post("/api/connection")
async def connect(request: Request, token: str = Depends(_require_auth)):
    body = await request.json()

    repo_owner = body.get("repoOwner", "")
    repo_name = body.get("repoName", "")
    branch = body.get("branch", "") or "main"
    config_path = body.get("configPath", "") or "models.yaml"

    if not repo_owner or not repo_name:
        return {"status": "error", "error": "repoOwner and repoName are required"}

    cfg = GitHubConfig(
        repoOwner=repo_owner,
        repoName=repo_name,
        branch=branch,
        configPath=config_path,
    )

    store = request.app.state.config_store
    client = request.app.state.github_client

    store.set(cfg)

    try:
        count = await client.test_connection(token)
    except Exception as e:
        store.clear()
        return {"status": "error", "error": str(e)}

    return {"status": "connected", "modelCount": count}


@router.delete("/api/connection")
async def disconnect(request: Request, token: str = Depends(_require_auth)):
    request.app.state.config_store.clear()
    request.app.state.github_client.invalidate_cache()
    return {"status": "disconnected"}


@router.get("/api/connection/status")
async def status(request: Request, token: str = Depends(_require_auth)):
    cfg = request.app.state.config_store.get()
    if cfg is None:
        return {"status": "disconnected"}

    return {
        "status": "connected",
        "repoOwner": cfg.repo_owner,
        "repoName": cfg.repo_name,
        "branch": cfg.branch,
        "configPath": cfg.config_path,
    }
