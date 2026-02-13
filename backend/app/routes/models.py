from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

router = APIRouter()


def _require_auth():
    raise NotImplementedError("Must be overridden at app level")


@router.get("/api/models")
async def list_models(request: Request, refresh: str = "", token: str = Depends(_require_auth)):
    store = request.app.state.config_store
    client = request.app.state.github_client

    if not store.is_configured():
        return {"models": [], "source": "none"}

    try:
        models = await client.fetch_models(token, refresh == "true")
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

    return {
        "models": [m.model_dump(by_alias=True, exclude_none=True) for m in models],
        "source": "github",
    }


@router.get("/api/models/{model_id}")
async def get_model(model_id: str, request: Request, token: str = Depends(_require_auth)):
    store = request.app.state.config_store
    client = request.app.state.github_client

    if not store.is_configured():
        return JSONResponse(status_code=404, content={"error": "model not found"})

    try:
        models = await client.fetch_models(token, False)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    for m in models:
        if m.id == model_id:
            return m.model_dump(by_alias=True, exclude_none=True)

    return JSONResponse(status_code=404, content={"error": "model not found"})
