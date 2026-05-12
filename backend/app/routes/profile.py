from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from ..db import users_col, donations_col, coffee_col
from ..utils.auth_helpers import serialize_doc
from ..errors import ValidationError, NotFoundError, AuthenticationError
import base64

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    """Get authenticated user's full profile."""
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise NotFoundError("User not found")
    
    user_data = serialize_doc(user)
    user_data.pop("password", None)
    user_data.pop("reset_token", None)
    user_data.pop("reset_token_expires", None)
    
    return jsonify({"profile": user_data}), 200


@profile_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_my_profile():
    """Update authenticated user's profile."""
    user_id = get_jwt_identity()
    data = request.get_json()

    allowed_fields = ["full_name", "bio", "profile_picture", "goal_amount", "goal_title", "social_links"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        raise ValidationError("No valid fields to update")

    # Validate fields
    if "full_name" in update_data and not update_data["full_name"]:
        raise ValidationError("Full name cannot be empty")
    
    if "bio" in update_data:
        if len(update_data["bio"]) > 500:
            raise ValidationError("Bio cannot exceed 500 characters")
    
    if "goal_amount" in update_data:
        try:
            goal_amount = float(update_data["goal_amount"])
            if goal_amount < 0:
                raise ValueError
            update_data["goal_amount"] = goal_amount
        except (ValueError, TypeError):
            raise ValidationError("Invalid goal amount")
    
    if "social_links" in update_data:
        if not isinstance(update_data["social_links"], dict):
            raise ValidationError("Social links must be an object")

    update_data["updated_at"] = datetime.utcnow()

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    updated = users_col.find_one({"_id": ObjectId(user_id)})
    user_data = serialize_doc(updated)
    user_data.pop("password", None)
    user_data.pop("reset_token", None)
    user_data.pop("reset_token_expires", None)

    return jsonify({"message": "Profile updated successfully", "profile": user_data}), 200


@profile_bp.route("/me/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """Upload profile picture as base64 or file.
    
    Expected: either JSON with base64 data or multipart file upload
    """
    user_id = get_jwt_identity()
    
    # Handle base64 JSON upload
    if request.is_json:
        data = request.get_json()
        profile_picture = data.get("profile_picture", "")
        
        if not profile_picture:
            raise ValidationError("Profile picture data is required")
        
        # Validate base64
        if len(profile_picture) > 5000000:  # 5MB limit
            raise ValidationError("Image too large (max 5MB)")
        
        if not (profile_picture.startswith("data:image/")):
            # Check if it's raw base64
            try:
                base64.b64decode(profile_picture, validate=True)
            except Exception:
                raise ValidationError("Invalid image format")
    
    # Handle multipart file upload
    elif "avatar" in request.files:
        file = request.files["avatar"]
        
        if not file or file.filename == "":
            raise ValidationError("No file provided")
        
        allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
        if file.content_type not in allowed_types:
            raise ValidationError("Invalid image format. Use JPEG, PNG, GIF, or WebP")
        
        # Read file and convert to base64
        file_data = file.read()
        if len(file_data) > 5000000:  # 5MB limit
            raise ValidationError("Image too large (max 5MB)")
        
        profile_picture = base64.b64encode(file_data).decode("utf-8")
    else:
        raise ValidationError("No image data provided")
    
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "profile_picture": profile_picture,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return jsonify({"message": "Avatar updated successfully"}), 200


@profile_bp.route("/<username>", methods=["GET"])
def get_profile(username):
    """Get public profile for a username."""
    user = users_col.find_one({"username": username.lower()})
    if not user:
        raise NotFoundError("Profile not found")

    user_data = serialize_doc(user)
    user_data.pop("password", None)
    user_data.pop("reset_token", None)
    user_data.pop("reset_token_expires", None)

    # Calculate total raised from successful donations + coffee
    user_id = str(user["_id"])
    donation_total = list(donations_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]))
    coffee_total = list(coffee_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]))

    d_total = donation_total[0]["total"] if donation_total else 0
    c_total = coffee_total[0]["total"] if coffee_total else 0
    user_data["total_raised"] = d_total + c_total

    # Recent supporters (last 5)
    recent_donations = list(donations_col.find(
        {"recipient_id": user_id, "status": "success"},
        {"donor_name": 1, "amount": 1, "message": 1, "created_at": 1, "type": 1}
    ).sort("created_at", -1).limit(5))

    recent_coffee = list(coffee_col.find(
        {"recipient_id": user_id, "status": "success"},
        {"donor_name": 1, "amount": 1, "cups": 1, "message": 1, "created_at": 1, "type": 1}
    ).sort("created_at", -1).limit(5))

    supporters = [serialize_doc(s) for s in recent_donations + recent_coffee]
    supporters.sort(key=lambda x: x["created_at"], reverse=True)
    user_data["recent_supporters"] = supporters[:5]

    return jsonify({"profile": user_data}), 200


@profile_bp.route("/me/stats", methods=["GET"])
@jwt_required()
def get_my_stats():
    """Get authenticated user's transaction statistics."""
    user_id = get_jwt_identity()

    donation_agg = list(donations_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]))
    coffee_agg = list(coffee_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}, "cups": {"$sum": "$cups"}}}
    ]))

    d = donation_agg[0] if donation_agg else {"total": 0, "count": 0}
    c = coffee_agg[0] if coffee_agg else {"total": 0, "count": 0, "cups": 0}

    return jsonify({
        "stats": {
            "total_raised": d["total"] + c["total"],
            "donation_total": d["total"],
            "coffee_total": c["total"],
            "donation_count": d["count"],
            "coffee_count": c["count"],
            "total_cups": c.get("cups", 0),
            "total_supporters": d["count"] + c["count"],
        }
    }), 200


@profile_bp.route("/<username>/stats", methods=["GET"])
def get_public_stats(username):
    """Get public profile statistics for a username."""
    user = users_col.find_one({"username": username.lower()})
    if not user:
        raise NotFoundError("Profile not found")
    
    user_id = str(user["_id"])

    donation_agg = list(donations_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]))
    coffee_agg = list(coffee_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}, "cups": {"$sum": "$cups"}}}
    ]))

    d = donation_agg[0] if donation_agg else {"total": 0, "count": 0}
    c = coffee_agg[0] if coffee_agg else {"total": 0, "count": 0, "cups": 0}

    return jsonify({
        "stats": {
            "total_raised": d["total"] + c["total"],
            "donation_total": d["total"],
            "coffee_total": c["total"],
            "donation_count": d["count"],
            "coffee_count": c["count"],
            "total_cups": c.get("cups", 0),
            "total_supporters": d["count"] + c["count"],
        }
    }), 200