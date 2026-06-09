from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import secrets

from .. import limiter
from ..db import users_col, db
from ..utils.auth_helpers import hash_password, serialize_doc
from ..utils.validators import is_valid_email, is_valid_password
from ..errors import ValidationError, AuthenticationError, NotFoundError, AuthorizationError
from ..services.email import email_service
from ..security.fraud_detection import record_security_event

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def require_admin(f):
    """Decorator to check if user is admin"""
    from functools import wraps
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        if not user or user.get("role") != "admin":
            raise AuthorizationError("Admin access required")
        
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# User Management Endpoints
# ============================================================================

@admin_bp.route("/users", methods=["GET"])
@require_admin
def get_users():
    """Get all users with pagination and filtering"""
    try:
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 20, type=int)
        search = request.args.get("search", "").lower()
        status = request.args.get("status", "all")  # all | active | suspended
        
        # Build filter
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}}
            ]
        
        if status != "all":
            filter_query["admin.account_status"] = status
        
        # Count total
        total = users_col.count_documents(filter_query)
        
        # Get paginated results
        skip = (page - 1) * limit
        users = list(users_col.find(filter_query)
                     .sort("created_at", -1)
                     .skip(skip)
                     .limit(limit))
        
        # Serialize user data (exclude sensitive fields)
        users_data = []
        for user in users:
            user_info = {
                "_id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "email_verified": user.get("email_verified", False),
                "role": user.get("role", "user"),
                "status": user.get("admin", {}).get("account_status", "active"),
                "total_received": user.get("total_received", 0),
                "total_donations": user.get("total_donations", 0),
                "last_login": user.get("security", {}).get("last_login_at"),
                "created_at": user.get("created_at")
            }
            users_data.append(user_info)
        
        return jsonify({
            "success": True,
            "users": users_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<user_id>", methods=["GET"])
@require_admin
def get_user_details(user_id):
    """Get detailed information about a specific user"""
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise NotFoundError("User not found")
        
        # Get user activity
        activity_col = db.get_collection("activity_log")
        activity = list(activity_col.find({"user_id": ObjectId(user_id)})
                       .sort("timestamp", -1)
                       .limit(20))
        
        # Get recent transactions
        transactions_col = db.get_collection("transactions")
        transactions = list(transactions_col.find({"user_id": ObjectId(user_id)})
                           .sort("created_at", -1)
                           .limit(10))
        
        user_detail = {
            "_id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "bio": user.get("bio", ""),
            "role": user.get("role", "user"),
            "email_verified": user.get("email_verified", False),
            "status": user.get("admin", {}).get("account_status", "active"),
            "suspension_reason": user.get("admin", {}).get("status_reason"),
            "admin_notes": user.get("admin", {}).get("notes", ""),
            "social_links": user.get("social_links", {}),
            "total_received": user.get("total_received", 0),
            "total_earned": user.get("total_earned", 0),
            "total_donations": user.get("total_donations", 0),
            "wallet_balance": user.get("wallet_balance", 0.0),
            "security": {
                "two_factor_enabled": user.get("security", {}).get("two_factor_enabled", False),
                "last_login": user.get("security", {}).get("last_login_at"),
                "last_login_ip": user.get("security", {}).get("last_login_ip")
            },
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
            "recent_activity": [
                {
                    "_id": str(a["_id"]),
                    "action": a.get("action"),
                    "details": a.get("details", {}),
                    "timestamp": a.get("timestamp")
                } for a in activity
            ],
            "recent_transactions": [
                {
                    "_id": str(t["_id"]),
                    "type": t.get("type"),
                    "amount": t.get("amount"),
                    "status": t.get("status"),
                    "created_at": t.get("created_at")
                } for t in transactions
            ]
        }
        
        return jsonify({
            "success": True,
            "user": user_detail
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<user_id>/status", methods=["PUT"])
@require_admin
@limiter.limit("10 per hour")
def update_user_status(user_id):
    """Suspend or activate a user account"""
    try:
        admin_id = get_jwt_identity()
        data = request.get_json()
        
        action = data.get("action")  # suspend | activate | delete
        reason = data.get("reason", "")
        
        if action not in ["suspend", "activate", "delete"]:
            raise ValidationError("Invalid action")
        
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise NotFoundError("User not found")
        
        if str(user["_id"]) == admin_id:
            raise ValidationError("Cannot modify your own account")
        
        # Update user status
        update_data = {
            "admin.account_status": "suspended" if action == "suspend" else ("deleted" if action == "delete" else "active"),
            "admin.status_reason": reason if action in ["suspend", "delete"] else None,
            "admin.suspended_at": datetime.utcnow() if action == "suspend" else user.get("admin", {}).get("suspended_at"),
            "admin.suspended_by": ObjectId(admin_id) if action == "suspend" else None,
            "updated_at": datetime.utcnow()
        }
        
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Record security event
        record_security_event(
            user_id=user_id,
            event_type="admin_account_change",
            details={
                "action": action,
                "reason": reason,
                "admin_id": admin_id
            }
        )
        
        # Send email notification
        if action == "suspend":
            email_service.send_account_suspended_email(
                user["email"],
                user["full_name"],
                reason
            )
        elif action == "activate":
            email_service.send_account_reactivated_email(
                user["email"],
                user["full_name"]
            )
        
        return jsonify({
            "success": True,
            "message": f"User {action}ed successfully",
            "user_id": user_id,
            "new_status": update_data["admin.account_status"]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<user_id>/password-reset", methods=["POST"])
@require_admin
@limiter.limit("5 per hour")
def admin_reset_user_password(user_id):
    """Admin reset user password and send recovery email"""
    try:
        admin_id = get_jwt_identity()
        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise NotFoundError("User not found")
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(12)
        hashed_password = hash_password(temp_password)
        
        # Update user password
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Record security event
        record_security_event(
            user_id=user_id,
            event_type="admin_password_reset",
            details={"admin_id": admin_id}
        )
        
        # Send email with temporary password
        email_service.send_admin_password_reset_email(
            user["email"],
            user["full_name"],
            temp_password
        )
        
        return jsonify({
            "success": True,
            "message": "Password reset email sent to user",
            "user_id": user_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<user_id>/notes", methods=["PUT"])
@require_admin
def update_admin_notes(user_id):
    """Update admin notes for a user"""
    try:
        data = request.get_json()
        notes = data.get("notes", "")
        
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise NotFoundError("User not found")
        
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "admin.notes": notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            "success": True,
            "message": "Admin notes updated",
            "user_id": user_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<user_id>/activity", methods=["GET"])
@require_admin
def get_user_activity(user_id):
    """Get user activity log"""
    try:
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 50, type=int)
        
        activity_col = db.get_collection("activity_log")
        
        # Count total
        total = activity_col.count_documents({"user_id": ObjectId(user_id)})
        
        # Get paginated activity
        skip = (page - 1) * limit
        activity = list(activity_col.find({"user_id": ObjectId(user_id)})
                       .sort("timestamp", -1)
                       .skip(skip)
                       .limit(limit))
        
        activity_data = [
            {
                "_id": str(a["_id"]),
                "action": a.get("action"),
                "details": a.get("details", {}),
                "timestamp": a.get("timestamp"),
                "ip_address": a.get("ip_address")
            } for a in activity
        ]
        
        return jsonify({
            "success": True,
            "activity": activity_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# Admin Statistics Endpoints
# ============================================================================

@admin_bp.route("/stats/overview", methods=["GET"])
@require_admin
def get_admin_stats():
    """Get overall system statistics"""
    try:
        # User statistics
        total_users = users_col.count_documents({})
        active_users = users_col.count_documents({"admin.account_status": "active"})
        suspended_users = users_col.count_documents({"admin.account_status": "suspended"})
        verified_users = users_col.count_documents({"email_verified": True})
        twofa_enabled = users_col.count_documents({"security.two_factor_enabled": True})
        
        # Payment statistics
        transactions_col = db.get_collection("transactions")
        total_transactions = transactions_col.count_documents({})
        
        # Calculate total revenue
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": "$amount"},
                    "success_count": {
                        "$sum": {"$cond": [{"$eq": ["$status", "success"]}, 1, 0]}
                    }
                }
            }
        ]
        
        revenue_stats = list(transactions_col.aggregate(pipeline))
        total_revenue = revenue_stats[0]["total_amount"] if revenue_stats else 0
        successful_transactions = revenue_stats[0]["success_count"] if revenue_stats else 0
        
        return jsonify({
            "success": True,
            "stats": {
                "users": {
                    "total": total_users,
                    "active": active_users,
                    "suspended": suspended_users,
                    "verified_email": verified_users,
                    "two_factor_enabled": twofa_enabled
                },
                "payments": {
                    "total_transactions": total_transactions,
                    "successful_transactions": successful_transactions,
                    "total_revenue": total_revenue
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/stats/daily-revenue", methods=["GET"])
@require_admin
def get_daily_revenue():
    """Get daily revenue statistics for the past 30 days"""
    try:
        from datetime import timedelta
        
        transactions_col = db.get_collection("transactions")
        
        # Get last 30 days of data
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": thirty_days_ago},
                    "status": "success"
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "revenue": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        daily_data = list(transactions_col.aggregate(pipeline))
        
        return jsonify({
            "success": True,
            "data": daily_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
