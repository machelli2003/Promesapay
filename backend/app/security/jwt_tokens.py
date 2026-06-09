"""JWT helpers with scoped claims for 2FA and account recovery."""

from datetime import timedelta

from flask_jwt_extended import create_access_token, get_jwt

from ..config import settings

SCOPE_FULL = "full"
SCOPE_PRE_AUTH = "pre_auth"
SCOPE_RECOVERY = "recovery"


def create_access_token_for_user(user_id: str) -> str:
    return create_access_token(
        identity=str(user_id),
        additional_claims={"scope": SCOPE_FULL},
        expires_delta=timedelta(seconds=settings.JWT_ACCESS_TOKEN_EXPIRES),
    )


def create_pre_auth_token(user_id: str) -> str:
    """Short-lived token allowed only for 2FA verification endpoints."""
    return create_access_token(
        identity=str(user_id),
        additional_claims={"scope": SCOPE_PRE_AUTH},
        expires_delta=timedelta(minutes=settings.SECURITY_PRE_AUTH_TOKEN_MINUTES),
    )


def create_recovery_token(user_id: str) -> str:
    """Short-lived token for password reset / unlock after recovery verification."""
    return create_access_token(
        identity=str(user_id),
        additional_claims={"scope": SCOPE_RECOVERY},
        expires_delta=timedelta(minutes=settings.SECURITY_RECOVERY_TOKEN_MINUTES),
    )


def get_token_scope() -> str:
    claims = get_jwt() or {}
    return claims.get("scope", SCOPE_FULL)


def is_full_access_token() -> bool:
    return get_token_scope() == SCOPE_FULL
