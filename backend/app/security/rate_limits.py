"""Centralized rate limit definitions and key functions."""

from flask import request
from flask_jwt_extended import get_jwt_identity

from .. import limiter

# Auth & security endpoints
LIMIT_LOGIN = "5 per 15 minutes"
LIMIT_REGISTER = "3 per hour"
LIMIT_PASSWORD_RESET = "3 per 15 minutes"
LIMIT_RECOVERY = "5 per 15 minutes"
LIMIT_2FA_VERIFY = "10 per 15 minutes"
LIMIT_2FA_SETUP = "10 per hour"
LIMIT_SECURITY_SENSITIVE = "20 per hour"


def client_ip_key():
    return request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()


def user_or_ip_key():
    try:
        uid = get_jwt_identity()
        if uid:
            return f"user:{uid}"
    except Exception:
        pass
    return f"ip:{client_ip_key()}"


def auth_identifier_key():
    """Rate limit login attempts per identifier + IP."""
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or data.get("email") or "").strip().lower()
    return f"auth:{identifier}:{client_ip_key()}"


auth_login_limit = limiter.limit(LIMIT_LOGIN, key_func=auth_identifier_key)
auth_register_limit = limiter.limit(LIMIT_REGISTER, key_func=client_ip_key)
recovery_limit = limiter.limit(LIMIT_RECOVERY, key_func=client_ip_key)
twofa_verify_limit = limiter.limit(LIMIT_2FA_VERIFY, key_func=user_or_ip_key)

# Notification endpoints
LIMIT_NOTIFICATION_SEND = "50 per hour"
notification_send_limit = limiter.limit(LIMIT_NOTIFICATION_SEND, key_func=user_or_ip_key)
