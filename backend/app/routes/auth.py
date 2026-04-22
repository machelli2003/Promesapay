from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId
from ..db import users_col
from ..models.user import create_user_doc
from ..utils.auth_helpers import hash_password, check_password, serialize_doc
from ..utils.validators import is_valid_email, is_valid_username
from datetime import datetime

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    required = ["username", "email", "password", "full_name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    username = data["username"].strip().lower()
    email = data["email"].strip().lower()
    password = data["password"]
    full_name = data["full_name"].strip()

    # Validate format
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    if not is_valid_username(username):
        return jsonify({"error": "Username must be 3-30 chars, letters/numbers/underscore only"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check duplicates
    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409
    if users_col.find_one({"username": username}):
        return jsonify({"error": "Username already taken"}), 409

    # Create and insert user
    user_doc = create_user_doc(username, email, hash_password(password), full_name)
    users_col.insert_one(user_doc)

    # Generate token
    token = create_access_token(identity=str(user_doc["_id"]))
    user = serialize_doc(user_doc)
    user.pop("password", None)

    return jsonify({"message": "Account created successfully", "token": token, "user": user}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    identifier = data.get("identifier", "").strip().lower()  # email or username
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Email/username and password are required"}), 400

    # Find by email or username
    user = users_col.find_one({
        "$or": [{"email": identifier}, {"username": identifier}]
    })

    if not user or not check_password(password, user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

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
        return jsonify({"error": "User not found"}), 404

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
        return jsonify({"error": "Both old and new passwords are required"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user or not check_password(old_password, user["password"]):
        return jsonify({"error": "Current password is incorrect"}), 401

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hash_password(new_password), "updated_at": datetime.utcnow()}}
    )

    return jsonify({"message": "Password updated successfully"}), 200