from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from ..db import users_col, donations_col, coffee_col
from ..utils.auth_helpers import serialize_doc

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/<username>", methods=["GET"])
def get_profile(username):
    user = users_col.find_one({"username": username.lower()})
    if not user:
        return jsonify({"error": "Profile not found"}), 404

    user_data = serialize_doc(user)
    user_data.pop("password", None)

    # Calculate total raised from successful donations + coffee
    user_id = str(user["_id"])
    donation_total = donations_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])
    coffee_total = coffee_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])

    d_list = list(donation_total)
    c_list = list(coffee_total)
    total_raised = (d_list[0]["total"] if d_list else 0) + (c_list[0]["total"] if c_list else 0)

    user_data["total_raised"] = total_raised

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


@profile_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()

    allowed_fields = ["full_name", "bio", "profile_picture", "goal_amount", "goal_title", "social_links"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    if "goal_amount" in update_data:
        try:
            update_data["goal_amount"] = float(update_data["goal_amount"])
        except ValueError:
            return jsonify({"error": "Invalid goal amount"}), 400

    update_data["updated_at"] = datetime.utcnow()

    users_col.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    updated = users_col.find_one({"_id": ObjectId(user_id)})
    user_data = serialize_doc(updated)
    user_data.pop("password", None)

    return jsonify({"message": "Profile updated", "user": user_data}), 200


@profile_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_my_stats():
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