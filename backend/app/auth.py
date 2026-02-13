import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from fastapi import HTTPException, Request

SESSION_COOKIE_NAME = "session_id"


@dataclass
class SessionData:
    token: str
    login: str
    name: str
    avatar_url: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class SessionStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._sessions: dict[str, SessionData] = {}

    def create(self, data: SessionData) -> str:
        session_id = str(uuid.uuid4())
        with self._lock:
            data.created_at = datetime.now(timezone.utc)
            self._sessions[session_id] = data
        return session_id

    def get(self, session_id: str) -> SessionData | None:
        with self._lock:
            return self._sessions.get(session_id)

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)


@dataclass
class OAuthConfig:
    client_id: str
    client_secret: str
    redirect_url: str
    frontend_url: str


def get_token_from_session(request: Request, sessions: SessionStore) -> str:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="unauthorized")

    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=401, detail="unauthorized")

    return session.token
