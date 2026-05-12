"""Wallet and balance management routes."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..db import users_col
from ..errors import NotFoundError, ValidationError
from ..utils.auth_helpers import serialize_doc

wallet_bp = Blueprint("wallet", __name__)

@wallet_bp.route("/balance", methods=["GET"])
@jwt_required()
def get_balance():
    """Get user's wallet balance and earnings summary."""
    user_id = get_jwt_identity()

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise NotFoundError("User not found")

    return jsonify({
        "wallet_balance": user.get("wallet_balance", 0.0),
        "total_earned": user.get("total_earned", 0.0),
        "total_donations": user.get("total_donations", 0),
        "available_for_withdrawal": user.get("wallet_balance", 0.0)
    })

@wallet_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_wallet_transactions():
    """Get user's wallet transaction history."""
    user_id = get_jwt_identity()

    # Get pagination parameters
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    skip = (page - 1) * limit

    # This would need to be implemented with a wallet_transactions collection
    # For now, return empty array as placeholder
    return jsonify({
        "transactions": [],
        "page": page,
        "limit": limit,
        "total": 0
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

    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise NotFoundError("User not found")

    wallet_balance = user.get("wallet_balance", 0.0)
    if amount > wallet_balance:
        raise ValidationError("Insufficient wallet balance")

    # This would create a withdrawal request record
    # For now, just return success (Phase 3 feature)
    return jsonify({
        "message": "Withdrawal request submitted successfully",
        "amount": amount,
        "status": "pending",
        "estimated_processing_days": 3
    })