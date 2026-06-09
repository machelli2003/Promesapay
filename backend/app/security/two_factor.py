"""TOTP two-factor authentication with backup codes."""

import secrets
from datetime import datetime

import pyotp
from bson import ObjectId

from ..db import users_col
from ..errors import AuthenticationError, ValidationError
from ..utils.auth_helpers import check_password, hash_password
from .crypto import decrypt_value, encrypt_value
from .fraud_detection import record_security_event


def setup_totp(user_id: str, email: str):
    """Generate a new TOTP secret (not enabled until verified)."""
    secret = pyotp.random_base32()
    encrypted = encrypt_value(secret)
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "security.totp_secret_pending": encrypted,
                "security.two_factor_enabled": False,
                "updated_at": datetime.utcnow(),
            }
        },
    )
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=email, issuer_name="PromesaPay")
    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri,
        "message": "Scan the URI in an authenticator app, then confirm with a code.",
    }


def verify_totp_code(user: dict, code: str, *, use_pending: bool = False) -> bool:
    if not code or len(code.strip()) != 6:
        return False
    code = code.strip().replace(" ", "")
    security = user.get("security") or {}
    key_field = "totp_secret_pending" if use_pending else "totp_secret"
    encrypted = security.get(key_field)
    if not encrypted:
        return False
    try:
        secret = decrypt_value(encrypted)
    except ValueError:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def _verify_backup_code(user: dict, code: str) -> bool:
    if not code:
        return False
    normalized = code.strip().upper().replace(" ", "")
    hashes = (user.get("security") or {}).get("backup_code_hashes") or []
    for idx, stored in enumerate(hashes):
        if check_password(normalized, stored):
            hashes.pop(idx)
            users_col.update_one(
                {"_id": user["_id"]},
                {"$set": {"security.backup_code_hashes": hashes}},
            )
            record_security_event(
                "2fa_backup_code_used",
                user_id=str(user["_id"]),
                severity="warning",
            )
            return True
    return False


def verify_two_factor(user: dict, code: str) -> bool:
    """Verify TOTP or a one-time backup code."""
    if verify_totp_code(user, code, use_pending=False):
        return True
    return _verify_backup_code(user, code)


def enable_two_factor(user_id: str, code: str):
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValidationError("User not found")
    if not verify_totp_code(user, code, use_pending=True):
        raise AuthenticationError("Invalid authenticator code")

    pending = user.get("security", {}).get("totp_secret_pending")
    if not pending:
        raise ValidationError("Run 2FA setup first")

    backup_codes = generate_backup_codes()
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "security.totp_secret": pending,
                "security.two_factor_enabled": True,
                "security.backup_code_hashes": backup_codes["hashes"],
                "updated_at": datetime.utcnow(),
            },
            "$unset": {"security.totp_secret_pending": ""},
        },
    )
    record_security_event("2fa_enabled", user_id=user_id, severity="info")
    return {"backup_codes": backup_codes["plain"]}


def disable_two_factor(user_id: str, password: str, code: str):
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user or not check_password(password, user.get("password", "")):
        raise AuthenticationError("Invalid password")
    if not verify_two_factor(user, code):
        raise AuthenticationError("Invalid 2FA code")

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {"security.two_factor_enabled": False, "updated_at": datetime.utcnow()},
            "$unset": {
                "security.totp_secret": "",
                "security.totp_secret_pending": "",
                "security.backup_code_hashes": "",
            },
        },
    )
    record_security_event("2fa_disabled", user_id=user_id, severity="warning")


def generate_backup_codes(count: int = 8):
    plain = []
    hashes = []
    for _ in range(count):
        code = f"{secrets.token_hex(2)}-{secrets.token_hex(2)}".upper()
        plain.append(code)
        hashes.append(hash_password(code))
    return {"plain": plain, "hashes": hashes}


def regenerate_backup_codes(user_id: str, password: str, code: str):
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("security", {}).get("two_factor_enabled"):
        raise ValidationError("2FA is not enabled")
    if not check_password(password, user.get("password", "")):
        raise AuthenticationError("Invalid password")
    if not verify_two_factor(user, code):
        raise AuthenticationError("Invalid 2FA code")

    backup_codes = generate_backup_codes()
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"security.backup_code_hashes": backup_codes["hashes"]}},
    )
    record_security_event("2fa_backup_codes_regenerated", user_id=user_id, severity="info")
    return {"backup_codes": backup_codes["plain"]}


def user_requires_2fa(user: dict) -> bool:
    return bool((user.get("security") or {}).get("two_factor_enabled"))
