from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
import re

from .. import limiter
from ..db import users_col, db, donations_col, coffee_col, refunds_col
from ..utils.auth_helpers import serialize_doc
from ..utils.validators import is_valid_email
from ..errors import ValidationError, AuthenticationError, NotFoundError, AuthorizationError
from ..services.email import email_service
from ..security.fraud_detection import record_security_event

disputes_col = db["disputes"]
activity_log_col = db["activity_log"]

disputes_bp = Blueprint("disputes", __name__, url_prefix="/api/disputes")
admin_disputes_bp = Blueprint("admin_disputes", __name__, url_prefix="/api/admin/disputes")


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
# Dispute Status Enum
# ============================================================================
DISPUTE_STATUSES = {
    "open": "Dispute reported, awaiting review",
    "under_review": "Admin is investigating",
    "resolved": "Dispute resolved",
    "rejected": "Dispute rejected",
    "refunded": "Refund issued"
}

DISPUTE_TYPES = [
    "unauthorized_transaction",
    "services_not_rendered",
    "incorrect_amount",
    "duplicate_charge",
    "billing_error",
    "other"
]


def create_dispute_doc(transaction_id, dispute_type, reason, user_id, transaction_type):
    """Create a new dispute document"""
    return {
        "_id": ObjectId(),
        "transaction_id": ObjectId(transaction_id),
        "transaction_type": transaction_type,  # "donation" | "coffee"
        "user_id": ObjectId(user_id),
        "dispute_type": dispute_type,
        "reason": reason,
        "status": "open",
        "priority": "medium",
        "resolution_notes": "",
        "resolved_by": None,
        "refund_issued": False,
        "refund_amount": 0.0,
        "refund_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "resolved_at": None
    }


def log_activity(action, user_id, details):
    """Log admin activity"""
    activity_log_col.insert_one({
        "_id": ObjectId(),
        "action": action,
        "admin_id": ObjectId(user_id),
        "details": details,
        "timestamp": datetime.utcnow()
    })


# ============================================================================
# User Endpoints
# ============================================================================

@disputes_bp.route("/report", methods=["POST"])
@jwt_required()
@limiter.limit("5/hour")
def report_dispute():
    """User reports a dispute for a transaction"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["transaction_id", "dispute_type", "reason"]
        for field in required_fields:
            if not data.get(field):
                raise ValidationError(f"{field} is required")
        
        transaction_id = data.get("transaction_id")
        dispute_type = data.get("dispute_type")
        reason = data.get("reason", "").strip()
        
        # Validate dispute type
        if dispute_type not in DISPUTE_TYPES:
            raise ValidationError(f"Invalid dispute type. Valid types: {', '.join(DISPUTE_TYPES)}")
        
        # Validate reason
        if len(reason) < 10 or len(reason) > 1000:
            raise ValidationError("Reason must be between 10 and 1000 characters")
        
        # Find transaction (could be donation or coffee)
        transaction = donations_col.find_one({"_id": ObjectId(transaction_id)})
        transaction_type = "donation"
        
        if not transaction:
            transaction = coffee_col.find_one({"_id": ObjectId(transaction_id)})
            transaction_type = "coffee"
        
        if not transaction:
            raise NotFoundError("Transaction not found")
        
        # Check if user is party to the transaction
        if str(transaction.get("donor_id")) != user_id and str(transaction.get("recipient_id")) != user_id:
            raise AuthorizationError("You can only dispute transactions you are party to")
        
        # Check if dispute already exists
        existing = disputes_col.find_one({
            "transaction_id": ObjectId(transaction_id),
            "user_id": ObjectId(user_id),
            "status": {"$in": ["open", "under_review"]}
        })
        
        if existing:
            raise ValidationError("You already have an active dispute for this transaction")
        
        # Create dispute
        dispute = create_dispute_doc(transaction_id, dispute_type, reason, user_id, transaction_type)
        result = disputes_col.insert_one(dispute)
        
        # Notify user
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if user and user.get("email"):
            email_service.send_email(
                user["email"],
                "Dispute Reported",
                f"We've received your dispute report (ID: {result.inserted_id}). Our team will review it within 48 hours."
            )
        
        # Log security event
        record_security_event(
            user_id,
            "dispute_reported",
            {
                "dispute_id": str(result.inserted_id),
                "transaction_id": transaction_id,
                "type": dispute_type
            }
        )
        
        return jsonify({
            "status": "success",
            "message": "Dispute reported successfully",
            "dispute_id": str(result.inserted_id)
        }), 201
    
    except ValidationError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except AuthorizationError as e:
        return jsonify({"status": "error", "message": str(e)}), 403
    except NotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to report dispute"}), 500


@disputes_bp.route("/my-disputes", methods=["GET"])
@jwt_required()
def get_my_disputes():
    """Get disputes reported by current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        status = request.args.get("status", "all")  # all | open | under_review | resolved
        
        # Build filter
        filter_query = {"user_id": ObjectId(user_id)}
        if status != "all":
            filter_query["status"] = status
        
        # Get total count
        total = disputes_col.count_documents(filter_query)
        total_pages = (total + limit - 1) // limit
        
        # Get disputes
        skip = (page - 1) * limit
        disputes = list(disputes_col.find(filter_query)
                       .sort("created_at", -1)
                       .skip(skip)
                       .limit(limit))
        
        # Serialize
        disputes = [serialize_doc(d) for d in disputes]
        
        # Fetch transaction details
        for dispute in disputes:
            if dispute["transaction_type"] == "donation":
                txn = donations_col.find_one({"_id": ObjectId(dispute["transaction_id"])})
            else:
                txn = coffee_col.find_one({"_id": ObjectId(dispute["transaction_id"])})
            
            if txn:
                dispute["transaction_amount"] = txn.get("amount", 0)
                dispute["transaction_date"] = str(txn.get("created_at", ""))
        
        return jsonify({
            "status": "success",
            "disputes": disputes,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to fetch disputes"}), 500


# ============================================================================
# Admin Endpoints
# ============================================================================

@admin_disputes_bp.route("", methods=["GET"])
@require_admin
def get_all_disputes():
    """Admin: Get all disputes with pagination and filtering"""
    try:
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 20, type=int)
        status = request.args.get("status", "all")  # all | open | under_review | resolved | rejected
        priority = request.args.get("priority", "all")  # all | low | medium | high
        search = request.args.get("search", "").lower()
        
        # Build filter
        filter_query = {}
        if status != "all":
            filter_query["status"] = status
        if priority != "all":
            filter_query["priority"] = priority
        
        # Get total count
        total = disputes_col.count_documents(filter_query)
        total_pages = (total + limit - 1) // limit
        
        # Get disputes
        skip = (page - 1) * limit
        disputes = list(disputes_col.find(filter_query)
                       .sort("created_at", -1)
                       .skip(skip)
                       .limit(limit))
        
        # Serialize and enrich
        disputes = [serialize_doc(d) for d in disputes]
        for dispute in disputes:
            user = users_col.find_one({"_id": ObjectId(dispute["user_id"])})
            dispute["user_email"] = user.get("email", "") if user else ""
            dispute["user_username"] = user.get("username", "") if user else ""
        
        return jsonify({
            "status": "success",
            "disputes": disputes,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to fetch disputes"}), 500


@admin_disputes_bp.route("/<dispute_id>", methods=["GET"])
@require_admin
def get_dispute_details(dispute_id):
    """Admin: Get detailed dispute information"""
    try:
        dispute = disputes_col.find_one({"_id": ObjectId(dispute_id)})
        
        if not dispute:
            raise NotFoundError("Dispute not found")
        
        dispute = serialize_doc(dispute)
        
        # Fetch user details
        user = users_col.find_one({"_id": ObjectId(dispute["user_id"])})
        if user:
            dispute["user"] = {
                "id": str(user["_id"]),
                "email": user.get("email", ""),
                "username": user.get("username", ""),
                "full_name": user.get("full_name", "")
            }
        
        # Fetch transaction details
        if dispute["transaction_type"] == "donation":
            txn = donations_col.find_one({"_id": ObjectId(dispute["transaction_id"])})
        else:
            txn = coffee_col.find_one({"_id": ObjectId(dispute["transaction_id"])})
        
        if txn:
            dispute["transaction"] = {
                "id": str(txn["_id"]),
                "amount": txn.get("amount", 0),
                "date": str(txn.get("created_at", "")),
                "status": txn.get("status", ""),
                "type": dispute["transaction_type"],
                "donor_id": str(txn.get("donor_id", "")),
                "recipient_id": str(txn.get("recipient_id", ""))
            }
        
        # Fetch refund if issued
        if dispute.get("refund_id"):
            refund = refunds_col.find_one({"_id": ObjectId(dispute["refund_id"])})
            if refund:
                dispute["refund"] = {
                    "id": str(refund["_id"]),
                    "amount": refund.get("amount", 0),
                    "date": str(refund.get("created_at", "")),
                    "status": refund.get("status", "")
                }
        
        return jsonify({
            "status": "success",
            "dispute": dispute
        }), 200
    
    except NotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to fetch dispute"}), 500


@admin_disputes_bp.route("/<dispute_id>/status", methods=["PUT"])
@require_admin
@limiter.limit("10/hour")
def update_dispute_status(dispute_id):
    """Admin: Update dispute status and add notes"""
    try:
        admin_id = get_jwt_identity()
        data = request.get_json()
        
        dispute = disputes_col.find_one({"_id": ObjectId(dispute_id)})
        if not dispute:
            raise NotFoundError("Dispute not found")
        
        new_status = data.get("status", "").strip()
        notes = data.get("notes", "").strip()
        priority = data.get("priority", dispute.get("priority"))
        
        if not new_status:
            raise ValidationError("Status is required")
        
        if new_status not in DISPUTE_STATUSES:
            raise ValidationError(f"Invalid status. Valid statuses: {', '.join(DISPUTE_STATUSES.keys())}")
        
        # Update dispute
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow(),
            "priority": priority
        }
        
        if notes:
            update_data["resolution_notes"] = notes
        
        if new_status in ["resolved", "rejected", "refunded"]:
            update_data["resolved_at"] = datetime.utcnow()
            update_data["resolved_by"] = ObjectId(admin_id)
        
        disputes_col.update_one(
            {"_id": ObjectId(dispute_id)},
            {"$set": update_data}
        )
        
        # Log activity
        log_activity(
            "dispute_status_updated",
            admin_id,
            {
                "dispute_id": dispute_id,
                "old_status": dispute.get("status"),
                "new_status": new_status,
                "notes": notes
            }
        )
        
        # Notify user
        user = users_col.find_one({"_id": ObjectId(dispute["user_id"])})
        if user and user.get("email"):
            status_message = {
                "under_review": "Your dispute is now under review",
                "resolved": "Your dispute has been resolved",
                "rejected": "Your dispute has been rejected",
                "refunded": "A refund has been issued for your dispute"
            }.get(new_status, "Your dispute status has been updated")
            
            email_service.send_email(
                user["email"],
                f"Dispute Update: {new_status.replace('_', ' ').title()}",
                f"{status_message}\n\nDispute ID: {dispute_id}\n\nNotes: {notes if notes else 'None'}"
            )
        
        return jsonify({
            "status": "success",
            "message": f"Dispute status updated to {new_status}"
        }), 200
    
    except ValidationError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except NotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to update dispute"}), 500


@admin_disputes_bp.route("/<dispute_id>/refund", methods=["POST"])
@require_admin
@limiter.limit("5/hour")
def issue_refund(dispute_id):
    """Admin: Issue a refund for a dispute"""
    try:
        admin_id = get_jwt_identity()
        data = request.get_json()
        
        dispute = disputes_col.find_one({"_id": ObjectId(dispute_id)})
        if not dispute:
            raise NotFoundError("Dispute not found")
        
        if dispute.get("refund_issued"):
            raise ValidationError("Refund already issued for this dispute")
        
        refund_amount = data.get("amount")
        if not refund_amount or refund_amount <= 0:
            raise ValidationError("Valid refund amount is required")
        
        # Get transaction
        if dispute["transaction_type"] == "donation":
            txn = donations_col.find_one({"_id": ObjectId(dispute["transaction_id"])})
        else:
            txn = coffee_col.find_one({"_id": ObjectId(dispute["transaction_id"])})
        
        if not txn:
            raise NotFoundError("Original transaction not found")
        
        # Create refund
        refund_doc = {
            "_id": ObjectId(),
            "transaction_id": ObjectId(dispute["transaction_id"]),
            "transaction_type": dispute["transaction_type"],
            "user_id": ObjectId(dispute["user_id"]),
            "amount": refund_amount,
            "reason": f"Dispute refund: {dispute.get('dispute_type')}",
            "status": "completed",
            "created_by": ObjectId(admin_id),
            "created_at": datetime.utcnow()
        }
        
        refund_result = refunds_col.insert_one(refund_doc)
        
        # Update dispute
        disputes_col.update_one(
            {"_id": ObjectId(dispute_id)},
            {
                "$set": {
                    "refund_issued": True,
                    "refund_amount": refund_amount,
                    "refund_id": refund_result.inserted_id,
                    "status": "refunded",
                    "resolved_at": datetime.utcnow(),
                    "resolved_by": ObjectId(admin_id),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update user wallet
        users_col.update_one(
            {"_id": ObjectId(dispute["user_id"])},
            {"$inc": {"wallet_balance": refund_amount}}
        )
        
        # Log activity
        log_activity(
            "refund_issued",
            admin_id,
            {
                "dispute_id": dispute_id,
                "amount": refund_amount,
                "refund_id": str(refund_result.inserted_id)
            }
        )
        
        # Notify user
        user = users_col.find_one({"_id": ObjectId(dispute["user_id"])})
        if user and user.get("email"):
            email_service.send_email(
                user["email"],
                "Refund Issued",
                f"A refund of ${refund_amount:.2f} has been issued to your wallet for dispute {dispute_id}."
            )
        
        return jsonify({
            "status": "success",
            "message": f"Refund of ${refund_amount:.2f} issued successfully",
            "refund_id": str(refund_result.inserted_id)
        }), 201
    
    except ValidationError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except NotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to issue refund"}), 500


# ============================================================================
# Stats Endpoints
# ============================================================================

@admin_disputes_bp.route("/stats/overview", methods=["GET"])
@require_admin
def get_dispute_stats():
    """Admin: Get dispute statistics"""
    try:
        total_disputes = disputes_col.count_documents({})
        open_disputes = disputes_col.count_documents({"status": "open"})
        under_review = disputes_col.count_documents({"status": "under_review"})
        resolved = disputes_col.count_documents({"status": "resolved"})
        rejected = disputes_col.count_documents({"status": "rejected"})
        refunded = disputes_col.count_documents({"status": "refunded"})
        
        # Total refunds issued
        total_refunded = disputes_col.aggregate([
            {"$match": {"status": "refunded"}},
            {"$group": {"_id": None, "total": {"$sum": "$refund_amount"}}}
        ])
        total_refunded_amount = list(total_refunded)[0]["total"] if list(total_refunded) else 0
        
        return jsonify({
            "status": "success",
            "stats": {
                "total": total_disputes,
                "open": open_disputes,
                "under_review": under_review,
                "resolved": resolved,
                "rejected": rejected,
                "refunded": refunded,
                "total_refunded_amount": total_refunded_amount
            }
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to fetch stats"}), 500
