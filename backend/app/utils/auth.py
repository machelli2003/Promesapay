from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..db import users_col
from ..errors import AuthenticationError, AuthorizationError
from ..security.jwt_tokens import get_token_scope, SCOPE_FULL


def require_auth(fn):
    """
    Decorator to require JWT authentication on a route.
    Automatically passes user_id as first argument to the route function.
  Rejects pre_auth and recovery scoped tokens.
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if get_token_scope() != SCOPE_FULL:
            raise AuthorizationError("Full authentication required")
        try:
            user_id = get_jwt_identity()
            if not user_id:
                raise AuthenticationError("Invalid token: no user identity")
            return fn(user_id, *args, **kwargs)
        except Exception as e:
            if isinstance(e, (AuthenticationError, AuthorizationError)):
                raise
            raise AuthenticationError(str(e))

    return wrapper


def require_full_token(fn):
    """For routes that use @jwt_required() directly without require_auth."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if get_token_scope() != SCOPE_FULL:
            raise AuthorizationError("Full authentication required")
        return fn(*args, **kwargs)

    return wrapper


def require_admin(fn):
    """Require JWT auth and admin role."""

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if get_token_scope() != SCOPE_FULL:
            raise AuthorizationError("Full authentication required")
        user_id = get_jwt_identity()
        if not user_id:
            raise AuthenticationError("Invalid token: no user identity")

        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            raise AuthorizationError("Admin access required")

        return fn(user_id, *args, **kwargs)

    return wrapper
