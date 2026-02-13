import os
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.auth import (
    SESSION_COOKIE_NAME,
    OAuthConfig,
    SessionData,
    SessionStore,
    get_token_from_session,
)
from app.config import ConfigStore
from app.github_client import GitHubClient
from app.routes import connection, files, health
from app.routes import models as models_routes


def _require_auth_factory(sessions: SessionStore):
    def require_auth(request: Request) -> str:
        return get_token_from_session(request, sessions)
    return require_auth


def create_app(
    config_store: ConfigStore | None = None,
    github_client: GitHubClient | None = None,
    session_store: SessionStore | None = None,
    oauth_config: OAuthConfig | None = None,
    allow_origins: list[str] | None = None,
) -> FastAPI:
    app = FastAPI()

    # Shared state
    store = config_store or ConfigStore()
    sessions = session_store or SessionStore()
    client = github_client or GitHubClient(store)

    app.state.config_store = store
    app.state.github_client = client
    app.state.session_store = sessions

    # OAuth config
    if oauth_config is None:
        oauth_config = OAuthConfig(
            client_id=os.getenv("GITHUB_CLIENT_ID", ""),
            client_secret=os.getenv("GITHUB_CLIENT_SECRET", ""),
            redirect_url=os.getenv(
                "GITHUB_REDIRECT_URL",
                "http://localhost:8080/api/auth/github/callback",
            ),
            frontend_url=os.getenv("FRONTEND_URL", "http://localhost:5173"),
        )

    # CORS
    origins = allow_origins or [
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    # Auth dependency override for route modules
    require_auth = _require_auth_factory(sessions)

    # Override the placeholder deps in route modules
    app.dependency_overrides[connection._require_auth] = require_auth
    app.dependency_overrides[models_routes._require_auth] = require_auth
    app.dependency_overrides[files._require_auth] = require_auth

    # Include route routers
    app.include_router(health.router)
    app.include_router(connection.router)
    app.include_router(models_routes.router)
    app.include_router(files.router)

    # --- Auth routes (inline, they're small) ---

    @app.get("/api/auth/github")
    async def github_redirect():
        params = urlencode({
            "client_id": oauth_config.client_id,
            "redirect_uri": oauth_config.redirect_url,
            "scope": "repo",
        })
        return RedirectResponse(
            url=f"https://github.com/login/oauth/authorize?{params}",
            status_code=307,
        )

    @app.get("/api/auth/github/callback")
    async def github_callback(request: Request):
        code = request.query_params.get("code")
        if not code:
            return JSONResponse(status_code=400, content={"error": "missing code parameter"})

        # Exchange code for token
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": oauth_config.client_id,
                    "client_secret": oauth_config.client_secret,
                    "code": code,
                    "redirect_uri": oauth_config.redirect_url,
                },
                headers={"Accept": "application/json"},
            )

        token_data = token_resp.json()
        if "error" in token_data:
            return JSONResponse(
                status_code=500,
                content={
                    "error": f"GitHub OAuth error: {token_data['error']} - {token_data.get('error_description', '')}"
                },
            )

        access_token = token_data.get("access_token", "")
        if not access_token:
            return JSONResponse(status_code=500, content={"error": "no access token in response"})

        # Fetch user info
        async with httpx.AsyncClient(timeout=15.0) as client:
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )

        if user_resp.status_code != 200:
            return JSONResponse(
                status_code=500,
                content={"error": f"GitHub API returned {user_resp.status_code}"},
            )

        user = user_resp.json()

        session_id = sessions.create(SessionData(
            token=access_token,
            login=user.get("login", ""),
            name=user.get("name", ""),
            avatar_url=user.get("avatar_url", ""),
        ))

        response = RedirectResponse(url=oauth_config.frontend_url, status_code=307)
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            path="/",
            httponly=True,
            samesite="lax",
            max_age=86400 * 7,
        )
        return response

    @app.get("/api/auth/me")
    async def me(request: Request):
        session_id = request.cookies.get(SESSION_COOKIE_NAME)
        if not session_id:
            return JSONResponse(status_code=401, content={"error": "unauthorized"})

        session = sessions.get(session_id)
        if session is None:
            return JSONResponse(status_code=401, content={"error": "unauthorized"})

        return {
            "login": session.login,
            "name": session.name,
            "avatar_url": session.avatar_url,
        }

    @app.post("/api/auth/logout")
    async def logout(request: Request):
        session_id = request.cookies.get(SESSION_COOKIE_NAME)
        if session_id:
            sessions.delete(session_id)

        response = JSONResponse(content={"status": "logged_out"})
        response.delete_cookie(
            key=SESSION_COOKIE_NAME,
            path="/",
            httponly=True,
        )
        return response

    return app


load_dotenv()
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
