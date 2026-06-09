"""Account recovery: email codes, unlock, password reset with recovery JWT."""

import secrets
from datetime import datetime, timedelta

from bson import ObjectId

from ..config import settings
from ..db import recovery_requests_col, users_col
from ..errors import AuthenticationError, ValidationError
from ..services.email import email_service
from ..utils.auth_helpers import hash_password, check_password
from ..utils.validators import is_valid_password
from .fraud_detection import record_security_event, unlock_account
from .jwt_tokens import create_recovery_token


def _hash_code(code: str) -> str:
    return hash_password(code.strip())


def _generate_numeric_code(length: int = 6) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def initiate_recovery(email: str, purpose: str = "password_reset"):
    """
    Send a recovery code by email. Always returns success message (no email enumeration).
    purpose: password_reset | unlock_account
    """
    email = email.strip().lower()
    if not email:
        raise ValidationError("Email is required")
    if purpose not in ("password_reset", "unlock_account"):
        raise ValidationError("Invalid recovery purpose")

    user = users_col.find_one({"email": email})
    if user:
        code = _generate_numeric_code(6)
        expires = datetime.utcnow() + timedelta(minutes=settings.SECURITY_RECOVERY_CODE_MINUTES)
        recovery_requests_col.insert_one(
            {
                "user_id": user["_id"],
                "email": email,
                "purpose": purpose,
                "code_hash": _hash_code(code),
                "used": False,
                "expires_at": expires,
                "created_at": datetime.utcnow(),
                "ip": None,
            }
        )
        try:
            email_service.send_recovery_code_email(
                email, code, user.get("full_name"), purpose=purpose
            )
        except Exception:
            pass
        record_security_event(
            "recovery_code_sent",
            user_id=str(user["_id"]),
            email=email,
            severity="info",
            metadata={"purpose": purpose},
        )

    return {"message": "If an account exists for this email, a recovery code has been sent."}


def verify_recovery_code(email: str, code: str, purpose: str = "password_reset"):
    email = email.strip().lower()
    code = (code or "").strip()
    if not email or not code:
        raise ValidationError("Email and code are required")

    request_doc = recovery_requests_col.find_one(
        {
            "email": email,
            "purpose": purpose,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()},
        },
        sort=[("created_at", -1)],
    )
    if not request_doc or not check_password(code, request_doc["code_hash"]):
        record_security_event(
            "recovery_code_failed",
            email=email,
            severity="warning",
            metadata={"purpose": purpose},
        )
        raise AuthenticationError("Invalid or expired recovery code")

    recovery_requests_col.update_one(
        {"_id": request_doc["_id"]},
        {"$set": {"used": True, "verified_at": datetime.utcnow()}},
    )

    user_id = str(request_doc["user_id"])
    if purpose == "unlock_account":
        unlock_account(user_id)

    token = create_recovery_token(user_id)
    record_security_event(
        "recovery_code_verified",
        user_id=user_id,
        email=email,
        severity="info",
        metadata={"purpose": purpose},
    )
    return {
        "recovery_token": token,
        "purpose": purpose,
        "message": "Recovery verified. Complete the next step within 15 minutes.",
    }


def reset_password_with_recovery_token(user_id: str, new_password: str):
    if not is_valid_password(new_password):
        raise ValidationError(
            "Password must be at least 10 characters and include uppercase, lowercase, number, and special symbol"
        )

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password": hash_password(new_password),
                "updated_at": datetime.utcnow(),
            },
            "$unset": {
                "reset_token": "",
                "reset_token_expires": "",
                "security.locked_until": "",
            },
        },
    )
    record_security_event("password_reset_recovery", user_id=user_id, severity="info")


def initiate_legacy_reset_link(email: str) -> str | None:
    """Existing link-based reset; returns raw token if user exists."""
    import secrets as sec

    user = users_col.find_one({"email": email.strip().lower()})
    if not user:
        return None
    reset_token = sec.token_urlsafe(32)
    users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": hash_password(reset_token),
                "reset_token_expires": datetime.utcnow().timestamp()
                + settings.PASSWORD_RESET_EXPIRY,
            }
        },
    )
    return reset_token
