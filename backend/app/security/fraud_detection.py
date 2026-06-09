"""Fraud detection: login velocity, lockouts, risk scoring, audit events."""

from datetime import datetime, timedelta

from bson import ObjectId
from flask import request

from ..config import settings
from ..db import login_attempts_col, security_events_col, users_col
from ..errors import AuthenticationError, RateLimitExceededError


def _client_ip() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()


def _user_agent() -> str:
    return (request.headers.get("User-Agent") or "")[:512]


def record_security_event(
    event_type: str,
    *,
    user_id=None,
    email=None,
    severity="info",
    metadata=None,
    ip=None,
):
    security_events_col.insert_one(
        {
            "event_type": event_type,
            "user_id": ObjectId(user_id) if user_id else None,
            "email": email,
            "severity": severity,
            "ip": ip or _client_ip(),
            "user_agent": _user_agent(),
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
        }
    )


def record_login_attempt(identifier: str, success: bool, user_id=None):
    login_attempts_col.insert_one(
        {
            "identifier": identifier.lower() if identifier else "",
            "user_id": ObjectId(user_id) if user_id else None,
            "success": success,
            "ip": _client_ip(),
            "user_agent": _user_agent(),
            "created_at": datetime.utcnow(),
        }
    )


def _failed_attempts_since(identifier: str, ip: str, minutes: int) -> int:
    since = datetime.utcnow() - timedelta(minutes=minutes)
    by_id = login_attempts_col.count_documents(
        {
            "identifier": identifier.lower(),
            "success": False,
            "created_at": {"$gte": since},
        }
    )
    by_ip = login_attempts_col.count_documents(
        {"ip": ip, "success": False, "created_at": {"$gte": since}}
    )
    return max(by_id, by_ip)


def is_account_locked(user: dict) -> bool:
    if not user:
        return False
    locked_until = user.get("security", {}).get("locked_until")
    if not locked_until:
        return False
    if isinstance(locked_until, datetime):
        return locked_until > datetime.utcnow()
    return False


def lock_account(user_id, minutes: int | None = None):
    minutes = minutes or settings.SECURITY_LOCKOUT_MINUTES
    until = datetime.utcnow() + timedelta(minutes=minutes)
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"security.locked_until": until, "updated_at": datetime.utcnow()}},
    )
    record_security_event(
        "account_locked",
        user_id=str(user_id),
        severity="warning",
        metadata={"locked_until": until.isoformat()},
    )


def unlock_account(user_id):
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$unset": {"security.locked_until": ""},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    record_security_event("account_unlocked", user_id=str(user_id), severity="info")


def assess_login_risk(user, identifier: str) -> dict:
    """
    Evaluate login risk. Raises AuthenticationError or RateLimitError when blocked.
    Returns metadata dict for logging (risk_score, flags).
    """
    ip = _client_ip()
    window = settings.SECURITY_LOGIN_WINDOW_MINUTES
    max_attempts = settings.SECURITY_MAX_LOGIN_ATTEMPTS
    max_ip_attempts = settings.SECURITY_MAX_IP_LOGIN_ATTEMPTS

    failed = _failed_attempts_since(identifier, ip, window)
    flags = []
    risk_score = min(100, failed * 15)

    if user and is_account_locked(user):
        record_security_event(
            "login_blocked_locked",
            user_id=str(user["_id"]),
            email=user.get("email"),
            severity="warning",
        )
        raise AuthenticationError(
            "Account temporarily locked due to suspicious activity. "
            "Use account recovery or try again later."
        )

    if failed >= max_ip_attempts:
        record_security_event(
            "login_blocked_ip",
            email=identifier if "@" in identifier else None,
            severity="critical",
            metadata={"failed_attempts": failed, "ip": ip},
        )
        raise RateLimitExceededError(
            "Too many failed login attempts from this network. Try again later."
        )

    if user and failed >= max_attempts:
        lock_account(user["_id"])
        record_security_event(
            "login_blocked_account",
            user_id=str(user["_id"]),
            email=user.get("email"),
            severity="critical",
            metadata={"failed_attempts": failed},
        )
        raise AuthenticationError(
            "Account locked after too many failed attempts. Use account recovery."
        )

    if failed >= 2:
        flags.append("elevated_failed_attempts")
        risk_score += 20

    known_ips = (user or {}).get("security", {}).get("known_ips") or []
    if user and ip not in known_ips:
        flags.append("new_ip")
        risk_score += 10

    return {"risk_score": risk_score, "flags": flags, "ip": ip}


def register_successful_login(user_id: str, ip: str | None = None):
    ip = ip or _client_ip()
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$addToSet": {"security.known_ips": ip},
            "$set": {
                "security.last_login_at": datetime.utcnow(),
                "security.last_login_ip": ip,
                "updated_at": datetime.utcnow(),
            },
            "$unset": {"security.locked_until": ""},
        },
    )
    record_security_event("login_success", user_id=user_id, severity="info", ip=ip)


def get_user_security_events(user_id: str, limit: int = 20):
    rows = list(
        security_events_col.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
        .limit(limit)
    )
    for row in rows:
        row["_id"] = str(row["_id"])
        if row.get("user_id"):
            row["user_id"] = str(row["user_id"])
        if row.get("created_at"):
            row["created_at"] = row["created_at"].isoformat()
    return rows
