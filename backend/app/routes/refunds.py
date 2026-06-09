from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from ..db import refunds_col, donations_col, coffee_col, users_col
from ..utils.auth import require_auth
from ..models.refund import create_refund_doc
import logging

bp = Blueprint("refunds", __name__, url_prefix="/api/refunds")
logger = logging.getLogger(__name__)


@bp.route("", methods=["GET"])
@require_auth
def get_refunds(user_id):
    """Get refunds for user (both requested and received)"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        
        # Get refunds requested by user
        skip = (page - 1) * per_page
        refunds = list(
            refunds_col.find({"user_id": ObjectId(user_id)})
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Convert ObjectId to string
        for refund in refunds:
            refund["_id"] = str(refund["_id"])
            refund["user_id"] = str(refund["user_id"])
            refund["transaction_id"] = str(refund["transaction_id"])
        
        total = refunds_col.count_documents({"user_id": ObjectId(user_id)})
        
        return jsonify({
            "refunds": refunds,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching refunds: {e}")
        return jsonify({"error": "Failed to fetch refunds"}), 500


@bp.route("/request", methods=["POST"])
@require_auth
def request_refund(user_id):
    """Request a refund for a donation or coffee"""
    try:
        data = request.json or {}
        
        transaction_id = data.get("transaction_id")
        transaction_type = data.get("transaction_type")  # "donation" or "coffee"
        reason = data.get("reason", "")
        
        if not transaction_id or not transaction_type:
            return jsonify({"error": "Transaction ID and type required"}), 400
        
        if transaction_type not in ["donation", "coffee"]:
            return jsonify({"error": "Invalid transaction type"}), 400
        
        if not reason:
            return jsonify({"error": "Refund reason required"}), 400
        
        # Fetch transaction
        if transaction_type == "donation":
            collection = donations_col
        else:
            collection = coffee_col
        
        transaction = collection.find_one({"_id": ObjectId(transaction_id)})
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404
        
        # Check if transaction is successful
        if transaction.get("status") != "success":
            return jsonify({"error": "Can only refund successful transactions"}), 400
        
        # Check if transaction is not too old (within 30 days)
        from datetime import timedelta
        if (datetime.utcnow() - transaction.get("created_at")).days > 30:
            return jsonify({"error": "Refund request window (30 days) has passed"}), 400
        
        # Check if refund already exists
        existing_refund = refunds_col.find_one({
            "transaction_id": ObjectId(transaction_id),
            "status": {"$in": ["pending", "approved", "processing", "completed"]}
        })
        if existing_refund:
            return jsonify({"error": "Refund already requested for this transaction"}), 400
        
        # Create refund request
        refund_doc = create_refund_doc(
            transaction_id=ObjectId(transaction_id),
            transaction_type=transaction_type,
            user_id=ObjectId(user_id),
            original_amount=transaction.get("amount"),
            refund_amount=transaction.get("amount"),  # Full refund by default
            reason=reason
        )
        
        result = refunds_col.insert_one(refund_doc)
        refund_doc["_id"] = str(result.inserted_id)
        refund_doc["user_id"] = str(refund_doc["user_id"])
        refund_doc["transaction_id"] = str(refund_doc["transaction_id"])
        
        return jsonify({
            "message": "Refund request submitted successfully",
            "refund": refund_doc
        }), 201
    except Exception as e:
        logger.error(f"Error requesting refund: {e}")
        return jsonify({"error": "Failed to request refund"}), 500


@bp.route("/<refund_id>", methods=["GET"])
@require_auth
def get_refund(user_id, refund_id):
    """Get specific refund details"""
    try:
        refund = refunds_col.find_one({
            "_id": ObjectId(refund_id),
            "user_id": ObjectId(user_id)
        })
        
        if not refund:
            return jsonify({"error": "Refund not found"}), 404
        
        refund["_id"] = str(refund["_id"])
        refund["user_id"] = str(refund["user_id"])
        refund["transaction_id"] = str(refund["transaction_id"])
        
        return jsonify(refund)
    except Exception as e:
        logger.error(f"Error fetching refund: {e}")
        return jsonify({"error": "Failed to fetch refund"}), 500


@bp.route("/<refund_id>/approve", methods=["POST"])
@require_auth
def approve_refund(user_id, refund_id):
    """Approve a refund (admin only)"""
    try:
        # Check if user is admin
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        refund = refunds_col.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            return jsonify({"error": "Refund not found"}), 404
        
        if refund.get("status") != "pending":
            return jsonify({"error": "Can only approve pending refunds"}), 400
        
        # Update refund status
        refunds_col.update_one(
            {"_id": ObjectId(refund_id)},
            {
                "$set": {
                    "status": "approved",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({"message": "Refund approved successfully"})
    except Exception as e:
        logger.error(f"Error approving refund: {e}")
        return jsonify({"error": "Failed to approve refund"}), 500


@bp.route("/<refund_id>/process", methods=["POST"])
@require_auth
def process_refund(user_id, refund_id):
    """Process an approved refund (admin only)"""
    try:
        # Check if user is admin
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        refund = refunds_col.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            return jsonify({"error": "Refund not found"}), 404
        
        if refund.get("status") != "approved":
            return jsonify({"error": "Refund must be approved first"}), 400
        
        # Get transaction to find original payer
        transaction_type = refund.get("transaction_type")
        if transaction_type == "donation":
            transaction = donations_col.find_one({"_id": ObjectId(refund["transaction_id"])})
        else:
            transaction = coffee_col.find_one({"_id": ObjectId(refund["transaction_id"])})
        
        if transaction:
            payer_email = transaction.get("donor_email")
        
        # Update refund status to processing
        refunds_col.update_one(
            {"_id": ObjectId(refund_id)},
            {
                "$set": {
                    "status": "processing",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # In production, integrate with payment provider (Paystack) to process refund
        # paystack.refund(transaction["reference"], refund["refund_amount"])
        
        return jsonify({
            "message": "Refund is being processed",
            "refund_id": refund_id
        })
    except Exception as e:
        logger.error(f"Error processing refund: {e}")
        return jsonify({"error": "Failed to process refund"}), 500


@bp.route("/<refund_id>/complete", methods=["POST"])
@require_auth
def complete_refund(user_id, refund_id):
    """Mark refund as completed (admin only, after payment provider confirms)"""
    try:
        # Check if user is admin
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        refund = refunds_col.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            return jsonify({"error": "Refund not found"}), 404
        
        if refund.get("status") != "processing":
            return jsonify({"error": "Refund must be in processing status"}), 400
        
        # Update refund status
        refunds_col.update_one(
            {"_id": ObjectId(refund_id)},
            {
                "$set": {
                    "status": "completed",
                    "processed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update transaction status to refunded
        transaction_type = refund.get("transaction_type")
        if transaction_type == "donation":
            donations_col.update_one(
                {"_id": ObjectId(refund["transaction_id"])},
                {"$set": {"status": "refunded"}}
            )
        else:
            coffee_col.update_one(
                {"_id": ObjectId(refund["transaction_id"])},
                {"$set": {"status": "refunded"}}
            )
        
        # Restore recipient's balance if needed
        transaction = (donations_col if transaction_type == "donation" else coffee_col).find_one(
            {"_id": ObjectId(refund["transaction_id"])}
        )
        if transaction and transaction.get("status") == "refunded":
            recipient_id = transaction.get("recipient_id")
            users_col.update_one(
                {"_id": ObjectId(recipient_id)},
                {"$inc": {
                    "wallet_balance": -refund["refund_amount"],
                    "total_earned": -refund["refund_amount"]
                }}
            )
        
        return jsonify({"message": "Refund completed successfully"})
    except Exception as e:
        logger.error(f"Error completing refund: {e}")
        return jsonify({"error": "Failed to complete refund"}), 500


@bp.route("/<refund_id>/reject", methods=["POST"])
@require_auth
def reject_refund(user_id, refund_id):
    """Reject a refund request (admin only)"""
    try:
        # Check if user is admin
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        refund = refunds_col.find_one({"_id": ObjectId(refund_id)})
        if not refund:
            return jsonify({"error": "Refund not found"}), 404
        
        if refund.get("status") not in ["pending", "approved"]:
            return jsonify({"error": "Cannot reject this refund"}), 400
        
        data = request.json or {}
        notes = data.get("notes", "")
        
        # Update refund status
        refunds_col.update_one(
            {"_id": ObjectId(refund_id)},
            {
                "$set": {
                    "status": "rejected",
                    "notes": notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({"message": "Refund rejected successfully"})
    except Exception as e:
        logger.error(f"Error rejecting refund: {e}")
        return jsonify({"error": "Failed to reject refund"}), 500
