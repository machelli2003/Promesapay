"""Withdrawal request and management routes."""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import logging
from ..db import (
    withdrawals_col, 
    payment_methods_col, 
    users_col, 
    transactions_col,
    notifications_col
)
from ..utils.auth import require_auth
from ..models.withdrawal import create_withdrawal_doc
from ..models.transaction import create_transaction_doc

logger = logging.getLogger(__name__)
bp = Blueprint("withdrawals", __name__, url_prefix="/api/withdrawals")


@bp.route("", methods=["POST"])
@require_auth
def request_withdrawal(user_id):
    """User requests a withdrawal from wallet balance."""
    try:
        data = request.json or {}
        
        # Validate required fields
        amount = data.get("amount")
        if not amount or amount <= 0:
            return jsonify({"error": "Invalid withdrawal amount"}), 400
        
        # Minimum withdrawal amount
        if amount < 50:
            return jsonify({"error": "Minimum withdrawal amount is 50"}), 400
        
        payment_method_id = data.get("payment_method_id")
        if not payment_method_id:
            return jsonify({"error": "Payment method is required"}), 400
        
        reason = data.get("reason", "")
        
        # Fetch user
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if user has sufficient balance
        wallet_balance = user.get("wallet_balance", 0)
        if wallet_balance < amount:
            return jsonify({
                "error": "Insufficient wallet balance",
                "available": wallet_balance
            }), 400
        
        # Fetch and validate payment method
        payment_method = payment_methods_col.find_one({
            "_id": ObjectId(payment_method_id),
            "user_id": ObjectId(user_id)
        })
        if not payment_method:
            return jsonify({"error": "Payment method not found"}), 404
        
        # Check if payment method is approved
        if payment_method.get("approval_status") != "approved":
            return jsonify({
                "error": "Payment method not approved",
                "status": payment_method.get("approval_status")
            }), 400
        
        # Create withdrawal request
        withdrawal_doc = create_withdrawal_doc(
            user_id=ObjectId(user_id),
            payment_method_id=ObjectId(payment_method_id),
            amount=amount,
            reason=reason,
            status="pending"
        )
        
        result = withdrawals_col.insert_one(withdrawal_doc)
        withdrawal_id = result.inserted_id
        
        # Create transaction record
        transaction_doc = create_transaction_doc(
            user_id=ObjectId(user_id),
            transaction_type="withdrawal",
            amount=amount,
            description=f"Withdrawal request for {amount}",
            reference_id=withdrawal_id,
            payment_method_id=ObjectId(payment_method_id),
            status="pending"
        )
        transactions_col.insert_one(transaction_doc)
        
        # Create notification for admins
        # TODO: Create admin notification that new withdrawal request is pending
        
        # Serialize response
        withdrawal_doc["_id"] = str(withdrawal_id)
        withdrawal_doc["user_id"] = str(withdrawal_doc["user_id"])
        withdrawal_doc["payment_method_id"] = str(withdrawal_doc["payment_method_id"])
        
        return jsonify({
            "message": "Withdrawal request submitted successfully",
            "withdrawal": withdrawal_doc
        }), 201
        
    except Exception as e:
        logger.error(f"Error requesting withdrawal: {e}")
        return jsonify({"error": "Failed to request withdrawal"}), 500


@bp.route("", methods=["GET"])
@require_auth
def get_user_withdrawals(user_id):
    """Get user's withdrawal history."""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        status = request.args.get("status", None)
        
        query = {"user_id": ObjectId(user_id)}
        if status:
            query["status"] = status
        
        skip = (page - 1) * per_page
        withdrawals = list(
            withdrawals_col.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Serialize
        for w in withdrawals:
            w["_id"] = str(w["_id"])
            w["user_id"] = str(w["user_id"])
            w["payment_method_id"] = str(w["payment_method_id"])
            if w.get("approved_by"):
                w["approved_by"] = str(w["approved_by"])
            if w.get("rejected_by"):
                w["rejected_by"] = str(w["rejected_by"])
        
        total = withdrawals_col.count_documents(query)
        
        return jsonify({
            "withdrawals": withdrawals,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching withdrawals: {e}")
        return jsonify({"error": "Failed to fetch withdrawals"}), 500


@bp.route("/<withdrawal_id>", methods=["GET"])
@require_auth
def get_withdrawal_detail(user_id, withdrawal_id):
    """Get withdrawal details."""
    try:
        withdrawal = withdrawals_col.find_one({
            "_id": ObjectId(withdrawal_id),
            "user_id": ObjectId(user_id)
        })
        
        if not withdrawal:
            return jsonify({"error": "Withdrawal not found"}), 404
        
        withdrawal["_id"] = str(withdrawal["_id"])
        withdrawal["user_id"] = str(withdrawal["user_id"])
        withdrawal["payment_method_id"] = str(withdrawal["payment_method_id"])
        if withdrawal.get("approved_by"):
            withdrawal["approved_by"] = str(withdrawal["approved_by"])
        if withdrawal.get("rejected_by"):
            withdrawal["rejected_by"] = str(withdrawal["rejected_by"])
        
        return jsonify(withdrawal)
    except Exception as e:
        logger.error(f"Error fetching withdrawal: {e}")
        return jsonify({"error": "Failed to fetch withdrawal"}), 500


@bp.route("/<withdrawal_id>/cancel", methods=["POST"])
@require_auth
def cancel_withdrawal(user_id, withdrawal_id):
    """Cancel a pending withdrawal request."""
    try:
        withdrawal = withdrawals_col.find_one({
            "_id": ObjectId(withdrawal_id),
            "user_id": ObjectId(user_id)
        })
        
        if not withdrawal:
            return jsonify({"error": "Withdrawal not found"}), 404
        
        if withdrawal.get("status") != "pending":
            return jsonify({
                "error": "Only pending withdrawals can be cancelled",
                "current_status": withdrawal.get("status")
            }), 400
        
        # Update withdrawal status
        withdrawals_col.update_one(
            {"_id": ObjectId(withdrawal_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({"message": "Withdrawal cancelled successfully"})
    except Exception as e:
        logger.error(f"Error cancelling withdrawal: {e}")
        return jsonify({"error": "Failed to cancel withdrawal"}), 500
