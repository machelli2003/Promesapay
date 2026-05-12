import secrets
from flask import request, session
from .errors import AuthorizationError

CSRF_HEADER = "X-CSRF-Token"
CSRF_SESSION_KEY = "csrf_token"
EXEMPT_PATHS = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google/login",
    "/api/auth/google/callback",
    "/api/auth/csrf-token",
]


def get_csrf_token():
    token = session.get(CSRF_SESSION_KEY)
    if not token:
        token = secrets.token_urlsafe(32)
        session[CSRF_SESSION_KEY] = token
    return token


def validate_csrf_token():
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        if any(request.path.startswith(path) for path in EXEMPT_PATHS):
            return

        header_token = request.headers.get(CSRF_HEADER)
        if not header_token or header_token != session.get(CSRF_SESSION_KEY):
            raise AuthorizationError("Invalid or missing CSRF token")
