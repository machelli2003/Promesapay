"""Wallet and balance management routes."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import logging
from ..db import (
    users_col, 
    withdrawals_col, 
    payment_methods_col,
    transactions_col,
    notifications_col
)
from ..errors import NotFoundError, ValidationError
from ..utils.auth_helpers import serialize_doc
from ..models.withdrawal import create_withdrawal_doc
from ..models.transaction import create_transaction_doc

logger = logging.getLogger(__name__)
wallet_bp = Blueprint("wallet", __name__)

@wallet_bp.route("/balance", methods=["GET"])
@jwt_required()
def get_balance():
    """Get user's wallet balance and earnings summary."""
    user_id = get_jwt_identity()

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise NotFoundError("User not found")

    # Calculate pending withdrawal total
    pending_withdrawals = list(withdrawals_col.find({
        "user_id": ObjectId(user_id),
        "status": "pending"
    }))
    pending_total = sum(w.get("amount", 0) for w in pending_withdrawals)

    return jsonify({
        "wallet_balance": user.get("wallet_balance", 0.0),
        "total_earned": user.get("total_earned", 0.0),
        "total_donations": user.get("total_donations", 0),
        "available_for_withdrawal": max(0, user.get("wallet_balance", 0.0) - pending_total),
        "pending_withdrawal_total": pending_total
    })

@wallet_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_wallet_transactions():
    """Get user's wallet transaction history."""
    user_id = get_jwt_identity()

    # Get pagination parameters
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    tx_type = request.args.get("type", None)
    skip = (page - 1) * limit

    query = {"user_id": ObjectId(user_id)}
    if tx_type:
        query["transaction_type"] = tx_type

    transactions = list(
        transactions_col.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    
    # Serialize
    for tx in transactions:
        tx["_id"] = str(tx["_id"])
        tx["user_id"] = str(tx["user_id"])
        if tx.get("reference_id"):
            tx["reference_id"] = str(tx["reference_id"])
        if tx.get("payment_method_id"):
            tx["payment_method_id"] = str(tx["payment_method_id"])
    
    total = transactions_col.count_documents(query)
    
    return jsonify({
        "transactions": transactions,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    })

@wallet_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_financial_summary():
    """Get user's complete financial summary."""
    user_id = get_jwt_identity()
    
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise NotFoundError("User not found")
    
    # Get stats
    wallet_balance = user.get("wallet_balance", 0.0)
    total_earned = user.get("total_earned", 0.0)
    total_donations = user.get("total_donations", 0)
    
    # Count completed withdrawals
    completed_withdrawals = withdrawals_col.count_documents({
        "user_id": ObjectId(user_id),
        "status": "completed"
    })
    
    # Sum completed withdrawal amounts
    withdrawn_total = 0
    for w in withdrawals_col.find({
        "user_id": ObjectId(user_id),
        "status": "completed"
    }):
        withdrawn_total += w.get("amount", 0)
    
    # Count pending withdrawals
    pending_withdrawals = withdrawals_col.count_documents({
        "user_id": ObjectId(user_id),
        "status": "pending"
    })
    
    # Sum pending withdrawal amounts
    pending_total = 0
    for w in withdrawals_col.find({
        "user_id": ObjectId(user_id),
        "status": "pending"
    }):
        pending_total += w.get("amount", 0)
    
    return jsonify({
        "wallet_balance": wallet_balance,
        "total_earned": total_earned,
        "total_donations": total_donations,
        "total_withdrawn": withdrawn_total,
        "completed_withdrawals_count": completed_withdrawals,
        "pending_withdrawals": {
            "count": pending_withdrawals,
            "total_amount": pending_total
        },
        "available_for_withdrawal": max(0, wallet_balance - pending_total)
    })

@wallet_bp.route("/withdraw", methods=["POST"])
@jwt_required()
def request_withdrawal():
    """Request withdrawal from wallet balance."""
    user_id = get_jwt_identity()
    data = request.get_json()

    amount = data.get("amount")
    if not amount or amount <= 0:
        raise ValidationError("Valid withdrawal amount is required")

    # Minimum withdrawal amount
    if amount < 50:  # 50 GHC minimum
        raise ValidationError("Minimum withdrawal amount is 50 GHC")
    
    payment_method_id = data.get("payment_method_id")
    if not payment_method_id:
        raise ValidationError("Payment method is required")
    
    reason = data.get("reason", "")

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise NotFoundError("User not found")

    wallet_balance = user.get("wallet_balance", 0.0)
    if amount > wallet_balance:
        raise ValidationError("Insufficient wallet balance")
    
    # Fetch and validate payment method
    payment_method = payment_methods_col.find_one({
        "_id": ObjectId(payment_method_id),
        "user_id": ObjectId(user_id)
    })
    if not payment_method:
        raise NotFoundError("Payment method not found")
    
    # Check if payment method is approved
    if payment_method.get("approval_status") != "approved":
        raise ValidationError(f"Payment method not approved. Status: {payment_method.get('approval_status')}")
    
    try:
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
        
        # Serialize response
        withdrawal_doc["_id"] = str(withdrawal_id)
        withdrawal_doc["user_id"] = str(withdrawal_doc["user_id"])
        withdrawal_doc["payment_method_id"] = str(withdrawal_doc["payment_method_id"])
        
        return jsonify({
            "message": "Withdrawal request submitted successfully",
            "withdrawal": withdrawal_doc
        }), 201
    except Exception as e:
        logger.error(f"Error creating withdrawal: {e}")
        raise ValidationError("Failed to create withdrawal request")

    # This would create a withdrawal request record
    # For now, just return success (Phase 3 feature)
    return jsonify({
        "message": "Withdrawal request submitted successfully",
        "amount": amount,
        "status": "pending",
        "estimated_processing_days": 3
    })