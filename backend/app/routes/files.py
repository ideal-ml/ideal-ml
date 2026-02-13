from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, PlainTextResponse

router = APIRouter()


def _require_auth():
    raise NotImplementedError("Must be overridden at app level")


@router.get("/api/files/{file_path:path}")
async def get_file(file_path: str, request: Request, token: str = Depends(_require_auth)):
    store = request.app.state.config_store

    if not store.is_configured():
        return JSONResponse(status_code=400, content={"error": "GitHub not configured"})

    if not file_path:
        return JSONResponse(status_code=400, content={"error": "file path required"})

    client = request.app.state.github_client

    try:
        content = await client.fetch_file_content(token, file_path)
    except Exception as e:
        error_msg = str(e)
        status_code = 500
        if "not found" in error_msg.lower():
            status_code = 404
        return JSONResponse(status_code=status_code, content={"error": error_msg})

    return PlainTextResponse(content=content.decode("utf-8", errors="replace"))
