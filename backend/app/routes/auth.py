from flask import Blueprint, request, jsonify, session # pyright: ignore[reportMissingImports]
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import secrets

from .. import limiter
from ..db import users_col
from ..models.user import create_user_doc
from ..utils.auth_helpers import hash_password, check_password, serialize_doc
from ..utils.validators import is_valid_email, is_valid_username, is_valid_password
from ..utils.auth import require_full_token
from ..errors import ValidationError, AuthenticationError, NotFoundError, ConflictError
from ..csrf import get_csrf_token
from ..services.email import email_service
from ..security.rate_limits import auth_login_limit, auth_register_limit, recovery_limit
from ..security.fraud_detection import (
    assess_login_risk,
    record_login_attempt,
    record_security_event,
    register_successful_login,
)
from ..security.two_factor import user_requires_2fa
from ..security.jwt_tokens import create_access_token_for_user, create_pre_auth_token
from ..security.account_recovery import initiate_legacy_reset_link

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
@auth_register_limit
def register():
    data = request.get_json()

    required = ["username", "email", "password", "full_name"]
    for field in required:
        if not data.get(field):
            raise ValidationError(f"{field} is required")

    username = data["username"].strip().lower()
    email = data["email"].strip().lower()
    password = data["password"]
    full_name = data["full_name"].strip()

    if not is_valid_email(email):
        raise ValidationError("Invalid email format")
    if not is_valid_username(username):
        raise ValidationError("Username must be 3-30 chars, letters/numbers/underscore only")
    if not is_valid_password(password):
        raise ValidationError(
            "Password must be at least 10 characters and include uppercase, lowercase, number, and special symbol"
        )

    if users_col.find_one({"email": email}):
        raise ConflictError("Email already registered")
    if users_col.find_one({"username": username}):
        raise ConflictError("Username already taken")

    user_doc = create_user_doc(username, email, hash_password(password), full_name)
    users_col.insert_one(user_doc)

    try:
        email_service.send_welcome_email(email, username, full_name)
    except Exception as e:
        from loguru import logger
        logger.warning(f"Welcome email failed for {email}: {str(e)}")

    record_security_event("account_registered", user_id=str(user_doc["_id"]), email=email)

    token = create_access_token_for_user(str(user_doc["_id"]))
    user = serialize_doc(user_doc)
    user.pop("password", None)
    if "security" in user:
        user.pop("security")

    return jsonify({"message": "Account created successfully", "token": token, "user": user}), 201


@auth_bp.route("/login", methods=["POST"])
@auth_login_limit
def login():
    data = request.get_json()

    identifier = data.get("identifier", "").strip().lower()
    password = data.get("password", "")

    if not identifier or not password:
        raise ValidationError("Email/username and password are required")

    user = users_col.find_one({
        "$or": [{"email": identifier}, {"username": identifier}]
    })

    if not user or not user.get("password") or not check_password(password, user["password"]):
        record_login_attempt(identifier, False, user["_id"] if user else None)
        record_security_event(
            "login_failed",
            user_id=str(user["_id"]) if user else None,
            email=identifier if "@" in identifier else None,
            severity="warning",
        )
        raise AuthenticationError("Invalid credentials")

    assess_login_risk(user, identifier)
    record_login_attempt(identifier, True, user["_id"])

    if user_requires_2fa(user):
        pre_token = create_pre_auth_token(str(user["_id"]))
        record_security_event("login_2fa_required", user_id=str(user["_id"]), severity="info")
        return jsonify(
            {
                "message": "Two-factor authentication required",
                "requires_2fa": True,
                "pre_auth_token": pre_token,
            }
        ), 200

    register_successful_login(str(user["_id"]))
    token = create_access_token_for_user(str(user["_id"]))
    user_data = serialize_doc(user)
    user_data.pop("password", None)
    user_data.pop("security", None)

    return jsonify({"message": "Login successful", "token": token, "user": user_data}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
@require_full_token
def get_me():
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise NotFoundError("User not found")

    user_data = serialize_doc(user)
    user_data.pop("password", None)
    sec = user_data.get("security") or {}
    user_data["two_factor_enabled"] = bool(sec.get("two_factor_enabled"))
    user_data.pop("security", None)
    return jsonify({"user": user_data}), 200


@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
@require_full_token
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json()

    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    if not old_password or not new_password:
        raise ValidationError("Both old and new passwords are required")
    if not is_valid_password(new_password):
        raise ValidationError(
            "New password must be at least 10 characters and include uppercase, lowercase, number, and special symbol"
        )

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user or not check_password(old_password, user["password"]):
        raise AuthenticationError("Current password is incorrect")

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hash_password(new_password), "updated_at": datetime.utcnow()}},
    )
    record_security_event("password_changed", user_id=user_id, severity="info")

    return jsonify({"message": "Password updated successfully"}), 200


@auth_bp.route("/csrf-token", methods=["GET"])
def csrf_token():
    return jsonify({"csrf_token": get_csrf_token()}), 200


@auth_bp.route("/get-oauth-token", methods=["POST"])
def get_oauth_token():
    token = session.get("auth_token")
    if not token:
        raise AuthenticationError("OAuth token not available")
    return jsonify({"token": token}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
@recovery_limit
def forgot_password():
    """Request password reset (email link + optional recovery code flow)."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        raise ValidationError("Email is required")

    user = users_col.find_one({"email": email})
    if user:
        reset_token = initiate_legacy_reset_link(email)
        if reset_token:
            try:
                email_service.send_password_reset_email(
                    email, reset_token, user.get("full_name")
                )
            except Exception as e:
                from loguru import logger
                logger.error(f"Password reset email failed for {email}: {str(e)}")

    return jsonify({"message": "If email exists, reset link has been sent"}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@recovery_limit
def reset_password():
    """Reset password with link token (legacy)."""
    data = request.get_json()
    reset_token = data.get("token", "")
    new_password = data.get("new_password", "")

    if not reset_token or not new_password:
        raise ValidationError("Token and new password are required")

    if not is_valid_password(new_password):
        raise ValidationError(
            "Password must be at least 10 characters and include uppercase, lowercase, number, and special symbol"
        )

    user = users_col.find_one({
        "reset_token": {"$exists": True},
        "reset_token_expires": {"$gt": datetime.utcnow().timestamp()},
    })

    if not user or not check_password(reset_token, user.get("reset_token", "")):
        raise AuthenticationError("Invalid or expired reset token")

    users_col.update_one(
        {"_id": user["_id"]},
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
    record_security_event("password_reset_link", user_id=str(user["_id"]), severity="info")

    return jsonify({"message": "Password reset successfully"}), 200


@auth_bp.route("/send-verification-email", methods=["POST"])
@jwt_required()
def send_verification_email():
    """Send verification email to user's email address."""
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise NotFoundError("User not found")
    
    if user.get("email_verified"):
        raise ValidationError("Email is already verified")
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.utcnow().timestamp() + (3600)  # 1 hour
    
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "email_verification_token": hash_password(verification_token),
                "email_verification_expires": verification_expires,
            }
        }
    )
    
    # Send verification email
    try:
        verification_link = f"{session.get('FRONTEND_URL', 'http://localhost:5173')}/verify-email?token={verification_token}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Verify Your Email Address</h2>
                    <p>Hi {user.get('full_name')},</p>
                    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                    <p style="margin: 30px 0;">
                        <a href="{verification_link}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Verify Email
                        </a>
                    </p>
                    <p>Or copy and paste this link: <code>{verification_link}</code></p>
                    <p style="color: #d32f2f;">This link expires in 1 hour.</p>
                </div>
            </body>
        </html>
        """
        
        from ..services.email import email_service
        email_service.send_email(
            user.get("email"),
            "Verify Your PromesaPay Email",
            html_content
        )
        
        return jsonify({"message": "Verification email sent"}), 200
    except Exception as e:
        from loguru import logger
        logger.error(f"Failed to send verification email: {str(e)}")
        raise ValidationError("Failed to send verification email")


@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    """Verify email with token."""
    data = request.get_json()
    token = data.get("token", "").strip()
    
    if not token:
        raise ValidationError("Verification token is required")
    
    user = users_col.find_one({
        "email_verification_expires": {"$gt": datetime.utcnow().timestamp()},
    })
    
    if not user or not check_password(token, user.get("email_verification_token", "")):
        raise AuthenticationError("Invalid or expired verification token")
    
    users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verified": True,
                "updated_at": datetime.utcnow(),
            },
            "$unset": {
                "email_verification_token": "",
                "email_verification_expires": "",
            }
        }
    )
    
    record_security_event("email_verified", user_id=str(user["_id"]), severity="info")
    
    return jsonify({"message": "Email verified successfully"}), 200


@auth_bp.route("/verification-status", methods=["GET"])
@jwt_required()
def verification_status():
    """Get email verification status."""
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise NotFoundError("User not found")
    
    return jsonify({
        "email_verified": user.get("email_verified", False),
        "email": user.get("email")
    }), 200
