import secrets
from flask import request, session, current_app
from .errors import AuthorizationError

CSRF_HEADER = "X-CSRF-Token"
CSRF_SESSION_KEY = "csrf_token"
EXEMPT_PATHS = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google/login",
    "/api/auth/google/callback",
    "/api/auth/csrf-token",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/recovery/request",
    "/api/auth/recovery/verify",
    "/api/auth/2fa/verify-login",
    # Public Paystack checkout (donors may not have a CSRF session)
    "/api/donations/initiate",
    "/api/donations/verify",
    "/api/coffee/initiate",
    "/api/coffee/verify",
    # Server-to-server webhooks
    "/api/webhook",
    "/api/monitoring/health",
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
        session_token = session.get(CSRF_SESSION_KEY)
        session_cookie_name = current_app.config.get("SESSION_COOKIE_NAME", "session")
        session_cookie = request.cookies.get(session_cookie_name)
        if not header_token or header_token != session_token:
            from loguru import logger
            logger.warning(
                "CSRF validation failed",
                path=request.path,
                method=request.method,
                origin=request.headers.get("Origin"),
                header_token=header_token,
                session_token=session_token,
                session_cookie=bool(session_cookie),
                session_cookie_name=session_cookie_name,
                request_cookie_keys=list(request.cookies.keys()),
                session_keys=list(session.keys()),
            )
            raise AuthorizationError("Invalid or missing CSRF token")
