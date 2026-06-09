from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from ..db import payouts_col, payment_methods_col, users_col, receipts_col
from ..utils.auth import require_auth
from ..models.payout import create_payout_doc
from ..models.payment_method import create_payment_method_doc
import logging

bp = Blueprint("payouts", __name__, url_prefix="/api/payouts")
logger = logging.getLogger(__name__)


@bp.route("", methods=["GET"])
@require_auth
def get_payouts(user_id):
    """Get user's payout history"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        status = request.args.get("status", None)
        
        query = {"user_id": ObjectId(user_id)}
        if status:
            query["status"] = status
        
        skip = (page - 1) * per_page
        payouts = list(
            payouts_col.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Convert ObjectId to string
        for payout in payouts:
            payout["_id"] = str(payout["_id"])
            payout["user_id"] = str(payout["user_id"])
            if payout.get("payment_method_id"):
                payout["payment_method_id"] = str(payout["payment_method_id"])
        
        total = payouts_col.count_documents(query)
        
        return jsonify({
            "payouts": payouts,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching payouts: {e}")
        return jsonify({"error": "Failed to fetch payouts"}), 500


@bp.route("/initiate", methods=["POST"])
@require_auth
def initiate_payout(user_id):
    """Initiate a new payout request"""
    try:
        data = request.json or {}
        
        # Validate required fields
        amount = data.get("amount", 0)
        if not amount or amount <= 0:
            return jsonify({"error": "Invalid amount"}), 400
        
        payment_method_id = data.get("payment_method_id")
        if not payment_method_id:
            return jsonify({"error": "Payment method required"}), 400
        
        # Fetch user
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if user has sufficient balance
        wallet_balance = user.get("wallet_balance", 0)
        if wallet_balance < amount:
            return jsonify({"error": "Insufficient wallet balance"}), 400
        
        # Fetch payment method
        payment_method = payment_methods_col.find_one({
            "_id": ObjectId(payment_method_id),
            "user_id": ObjectId(user_id)
        })
        if not payment_method:
            return jsonify({"error": "Payment method not found"}), 404
        
        # Create payout document
        payout_doc = create_payout_doc(
            user_id=ObjectId(user_id),
            amount=amount,
            payment_method_id=ObjectId(payment_method_id),
            payment_method_type=payment_method.get("method_type"),
            payment_method_provider=payment_method.get("provider"),
            account_details=payment_method.get("account_info"),
            status="pending",
            notes=data.get("notes", "")
        )
        
        result = payouts_col.insert_one(payout_doc)
        payout_doc["_id"] = str(result.inserted_id)
        
        # Deduct from wallet balance (place on hold)
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"wallet_balance": -amount}}
        )
        
        return jsonify({
            "message": "Payout initiated successfully",
            "payout": payout_doc
        }), 201
    except Exception as e:
        logger.error(f"Error initiating payout: {e}")
        return jsonify({"error": "Failed to initiate payout"}), 500


@bp.route("/<payout_id>", methods=["GET"])
@require_auth
def get_payout(user_id, payout_id):
    """Get specific payout details"""
    try:
        payout = payouts_col.find_one({
            "_id": ObjectId(payout_id),
            "user_id": ObjectId(user_id)
        })
        
        if not payout:
            return jsonify({"error": "Payout not found"}), 404
        
        payout["_id"] = str(payout["_id"])
        payout["user_id"] = str(payout["user_id"])
        if payout.get("payment_method_id"):
            payout["payment_method_id"] = str(payout["payment_method_id"])
        
        return jsonify(payout)
    except Exception as e:
        logger.error(f"Error fetching payout: {e}")
        return jsonify({"error": "Failed to fetch payout"}), 500


@bp.route("/<payout_id>/cancel", methods=["POST"])
@require_auth
def cancel_payout(user_id, payout_id):
    """Cancel a pending payout"""
    try:
        payout = payouts_col.find_one({
            "_id": ObjectId(payout_id),
            "user_id": ObjectId(user_id),
            "status": "pending"
        })
        
        if not payout:
            return jsonify({"error": "Payout not found or cannot be cancelled"}), 404
        
        # Update payout status
        payouts_col.update_one(
            {"_id": ObjectId(payout_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Refund to wallet balance
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"wallet_balance": payout["amount"]}}
        )
        
        return jsonify({"message": "Payout cancelled successfully"})
    except Exception as e:
        logger.error(f"Error cancelling payout: {e}")
        return jsonify({"error": "Failed to cancel payout"}), 500


@bp.route("/stats", methods=["GET"])
@require_auth
def get_payout_stats(user_id):
    """Get payout statistics for user"""
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        stats = {
            "wallet_balance": user.get("wallet_balance", 0),
            "total_earned": user.get("total_earned", 0),
            "total_withdrawn": 0,
            "pending_payouts": 0,
            "recent_payouts": []
        }
        
        # Calculate total withdrawn (completed payouts)
        withdrawn = payouts_col.aggregate([
            {"$match": {"user_id": ObjectId(user_id), "status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ])
        withdrawn_list = list(withdrawn)
        if withdrawn_list:
            stats["total_withdrawn"] = withdrawn_list[0].get("total", 0)
        
        # Count pending payouts
        stats["pending_payouts"] = payouts_col.count_documents({
            "user_id": ObjectId(user_id),
            "status": "pending"
        })
        
        # Get recent payouts
        recent = list(
            payouts_col.find({"user_id": ObjectId(user_id)})
            .sort("created_at", -1)
            .limit(5)
        )
        for p in recent:
            p["_id"] = str(p["_id"])
            stats["recent_payouts"].append({
                "id": p["_id"],
                "amount": p.get("amount"),
                "status": p.get("status"),
                "created_at": p.get("created_at").isoformat(),
                "type": p.get("payment_method_type")
            })
        
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error fetching payout stats: {e}")
        return jsonify({"error": "Failed to fetch payout stats"}), 500
