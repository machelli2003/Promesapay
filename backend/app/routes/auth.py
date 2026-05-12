from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId
from .. import limiter
from ..db import users_col
from ..models.user import create_user_doc
from ..utils.auth_helpers import hash_password, check_password, serialize_doc
from ..utils.validators import is_valid_email, is_valid_username, is_valid_password
from ..errors import ValidationError, AuthenticationError, NotFoundError, ConflictError
from ..csrf import get_csrf_token
from ..services.email import email_service
from datetime import datetime
import secrets

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    required = ["username", "email", "password", "full_name"]
    for field in required:
        if not data.get(field):
            raise ValidationError(f"{field} is required")

    username = data["username"].strip().lower()
    email = data["email"].strip().lower()
    password = data["password"]
    full_name = data["full_name"].strip()

    # Validate format
    if not is_valid_email(email):
        raise ValidationError("Invalid email format")
    if not is_valid_username(username):
        raise ValidationError("Username must be 3-30 chars, letters/numbers/underscore only")
    if not is_valid_password(password):
        raise ValidationError("Password must be at least 10 characters and include uppercase, lowercase, number, and special symbol")

    # Check duplicates
    if users_col.find_one({"email": email}):
        raise ConflictError("Email already registered")
    if users_col.find_one({"username": username}):
        raise ConflictError("Username already taken")

    # Create and insert user
    user_doc = create_user_doc(username, email, hash_password(password), full_name)
    users_col.insert_one(user_doc)

    # Send welcome email asynchronously (log errors but don't block)
    try:
        email_service.send_welcome_email(email, username, full_name)
    except Exception as e:
        from loguru import logger
        logger.warning(f"Welcome email failed for {email}: {str(e)}")

    # Generate token
    token = create_access_token(identity=str(user_doc["_id"]))
    user = serialize_doc(user_doc)
    user.pop("password", None)

    return jsonify({"message": "Account created successfully", "token": token, "user": user}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per 15 minutes")
def login():
    data = request.get_json()

    identifier = data.get("identifier", "").strip().lower()  # email or username
    password = data.get("password", "")

    if not identifier or not password:
        raise ValidationError("Email/username and password are required")

    # Find by email or username
    user = users_col.find_one({
        "$or": [{"email": identifier}, {"username": identifier}]
    })

    if not user or not user.get("password") or not check_password(password, user["password"]):
        raise AuthenticationError("Invalid credentials")

    token = create_access_token(identity=str(user["_id"]))
    user_data = serialize_doc(user)
    user_data.pop("password", None)

    return jsonify({"message": "Login successful", "token": token, "user": user_data}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise NotFoundError("User not found")

    user_data = serialize_doc(user)
    user_data.pop("password", None)
    return jsonify({"user": user_data}), 200


@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json()

    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    if not old_password or not new_password:
        raise ValidationError("Both old and new passwords are required")
    if not is_valid_password(new_password):
        raise ValidationError("New password must be at least 10 characters and include uppercase, lowercase, number, and special symbol")

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user or not check_password(old_password, user["password"]):
        raise AuthenticationError("Current password is incorrect")

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hash_password(new_password), "updated_at": datetime.utcnow()}}
    )

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
@limiter.limit("3 per 15 minutes")
def forgot_password():
    """Request password reset token."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        raise ValidationError("Email is required")

    user = users_col.find_one({"email": email})
    if not user:
        # Don't reveal if email exists, for security
        return jsonify({"message": "If email exists, reset link has been sent"}), 200

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_hash = hash_password(reset_token)
    
    # Store token with expiry (1 hour)
    users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token_hash,
                "reset_token_expires": datetime.utcnow().timestamp() + 3600
            }
        }
    )

    # Send email with reset link
    try:
        email_service.send_password_reset_email(email, reset_token, user.get("full_name"))
    except Exception as e:
        from loguru import logger
        logger.error(f"Password reset email failed for {email}: {str(e)}")
        # Still return success to not leak user existence

    return jsonify({"message": "If email exists, reset link has been sent"}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per 15 minutes")
def reset_password():
    """Reset password with token."""
    data = request.get_json()
    reset_token = data.get("token", "")
    new_password = data.get("new_password", "")

    if not reset_token or not new_password:
        raise ValidationError("Token and new password are required")

    if not is_valid_password(new_password):
        raise ValidationError("Password must be at least 10 characters and include uppercase, lowercase, number, and special symbol")

    # Find user with valid token
    user = users_col.find_one({
        "reset_token": {"$exists": True},
        "reset_token_expires": {"$gt": datetime.utcnow().timestamp()}
    })

    if not user or not check_password(reset_token, user.get("reset_token", "")):
        raise AuthenticationError("Invalid or expired reset token")

    # Update password and clear reset token
    users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": hash_password(new_password),
                "updated_at": datetime.utcnow()
            },
            "$unset": {
                "reset_token": "",
                "reset_token_expires": ""
            }
        }
    )

    return jsonify({"message": "Password reset successfully"}), 200