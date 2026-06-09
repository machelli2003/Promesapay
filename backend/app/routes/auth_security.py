"""Security API: 2FA, account recovery, security status."""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from ..db import users_col
from ..errors import AuthenticationError, ValidationError, AuthorizationError
from ..utils.auth_helpers import serialize_doc, check_password
from ..utils.auth import require_full_token
from ..security.rate_limits import recovery_limit, twofa_verify_limit
from ..security import (
    setup_totp,
    enable_two_factor,
    disable_two_factor,
    verify_two_factor,
    regenerate_backup_codes,
    create_access_token_for_user,
)
from ..security.jwt_tokens import get_token_scope, SCOPE_PRE_AUTH, SCOPE_RECOVERY
from ..security.account_recovery import (
    initiate_recovery,
    verify_recovery_code,
    reset_password_with_recovery_token,
)
from ..security.fraud_detection import get_user_security_events, register_successful_login
from .. import limiter
from ..security.rate_limits import LIMIT_2FA_SETUP, user_or_ip_key

security_bp = Blueprint("auth_security", __name__)


@security_bp.route("/2fa/setup", methods=["POST"])
@jwt_required()
@require_full_token
@limiter.limit(LIMIT_2FA_SETUP, key_func=user_or_ip_key)
def twofa_setup():
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValidationError("User not found")
    data = setup_totp(user_id, user["email"])
    return jsonify(
        {
            "provisioning_uri": data["provisioning_uri"],
            "secret": data["secret"],
            "message": data["message"],
        }
    ), 200


@security_bp.route("/2fa/enable", methods=["POST"])
@jwt_required()
@require_full_token
@twofa_verify_limit
def twofa_enable():
    user_id = get_jwt_identity()
    code = (request.get_json() or {}).get("code", "")
    result = enable_two_factor(user_id, code)
    return jsonify(
        {
            "message": "Two-factor authentication enabled",
            "backup_codes": result["backup_codes"],
        }
    ), 200


@security_bp.route("/2fa/disable", methods=["POST"])
@jwt_required()
@require_full_token
@twofa_verify_limit
def twofa_disable():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    disable_two_factor(user_id, data.get("password", ""), data.get("code", ""))
    return jsonify({"message": "Two-factor authentication disabled"}), 200


@security_bp.route("/2fa/verify-login", methods=["POST"])
@jwt_required()
@twofa_verify_limit
def twofa_verify_login():
    """Exchange pre_auth JWT + TOTP/backup code for full access token."""
    if get_token_scope() != SCOPE_PRE_AUTH:
        raise AuthorizationError("Invalid token for 2FA verification")

    user_id = get_jwt_identity()
    code = (request.get_json() or {}).get("code", "")
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user or not verify_two_factor(user, code):
        raise AuthenticationError("Invalid authenticator or backup code")

    register_successful_login(user_id)
    token = create_access_token_for_user(user_id)
    user_data = serialize_doc(user)
    user_data.pop("password", None)
    user_data.pop("security", None)
    return jsonify(
        {
            "message": "Login successful",
            "token": token,
            "user": user_data,
        }
    ), 200


@security_bp.route("/2fa/backup-codes", methods=["POST"])
@jwt_required()
@require_full_token
@twofa_verify_limit
def twofa_backup_codes():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    result = regenerate_backup_codes(user_id, data.get("password", ""), data.get("code", ""))
    return jsonify(
        {
            "message": "New backup codes generated. Store them securely.",
            "backup_codes": result["backup_codes"],
        }
    ), 200


@security_bp.route("/security/status", methods=["GET"])
@jwt_required()
@require_full_token
def security_status():
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValidationError("User not found")
    sec = user.get("security") or {}
    return jsonify(
        {
            "two_factor_enabled": bool(sec.get("two_factor_enabled")),
            "last_login_at": sec.get("last_login_at"),
            "last_login_ip": sec.get("last_login_ip"),
            "account_locked": bool(
                sec.get("locked_until")
                and sec.get("locked_until") > datetime.utcnow()
            ),
        }
    ), 200


@security_bp.route("/security/events", methods=["GET"])
@jwt_required()
@require_full_token
def security_events():
    user_id = get_jwt_identity()
    limit = min(50, request.args.get("limit", 20, type=int))
    return jsonify({"events": get_user_security_events(user_id, limit=limit)}), 200


@security_bp.route("/recovery/request", methods=["POST"])
@recovery_limit
def recovery_request():
    data = request.get_json() or {}
    result = initiate_recovery(
        data.get("email", ""),
        purpose=data.get("purpose", "password_reset"),
    )
    return jsonify(result), 200


@security_bp.route("/recovery/verify", methods=["POST"])
@recovery_limit
def recovery_verify():
    data = request.get_json() or {}
    result = verify_recovery_code(
        data.get("email", ""),
        data.get("code", ""),
        purpose=data.get("purpose", "password_reset"),
    )
    return jsonify(result), 200


@security_bp.route("/recovery/reset-password", methods=["POST"])
@jwt_required()
@recovery_limit
def recovery_reset_password():
    if get_token_scope() != SCOPE_RECOVERY:
        raise AuthorizationError("Valid recovery verification required")

    user_id = get_jwt_identity()
    new_password = (request.get_json() or {}).get("new_password", "")
    reset_password_with_recovery_token(user_id, new_password)
    return jsonify({"message": "Password reset successfully"}), 200
