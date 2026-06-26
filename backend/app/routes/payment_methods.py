from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from ..db import payment_methods_col, users_col
from ..utils.auth import require_auth
from ..utils.auth_helpers import serialize_doc
from ..models.payment_method import create_payment_method_doc
import logging

bp = Blueprint("payment_methods", __name__, url_prefix="/api/payment-methods")
logger = logging.getLogger(__name__)


@bp.route("", methods=["GET"])
@require_auth
def get_payment_methods(user_id):
    """Get user's payment methods"""
    try:
        methods = list(
            payment_methods_col.find({"user_id": ObjectId(user_id)})
            .sort("is_default", -1)
            .sort("created_at", -1)
        )
        
        methods = [serialize_doc(method) for method in methods]
        return jsonify(methods)
    except Exception as e:
        logger.error(f"Error fetching payment methods: {e}")
        return jsonify({"error": "Failed to fetch payment methods"}), 500


@bp.route("", methods=["POST"])
@require_auth
def add_payment_method(user_id):
    """Add a new payment method"""
    try:
        data = request.json or {}
        
        method_type = data.get("method_type")
        if not method_type or method_type not in ["bank_transfer", "mobile_money", "paypal", "crypto"]:
            return jsonify({"error": "Invalid payment method type"}), 400
        
        provider = data.get("provider")
        if not provider:
            return jsonify({"error": "Provider required"}), 400
        
        account_info = data.get("account_info", {})
        if not account_info:
            return jsonify({"error": "Account info required"}), 400
        
        # Validate account info based on type
        if method_type == "bank_transfer":
            required_fields = ["bank_name", "account_number", "account_name", "bank_code"]
        elif method_type == "mobile_money":
            required_fields = ["phone", "provider"]
        elif method_type == "paypal":
            required_fields = ["email"]
        elif method_type == "crypto":
            required_fields = ["wallet_address", "currency"]
        else:
            required_fields = []
        
        for field in required_fields:
            if field not in account_info or not account_info[field]:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        is_default = data.get("is_default", False)
        
        # If this is the first method, set as default
        existing = payment_methods_col.find_one({"user_id": ObjectId(user_id)})
        if not existing:
            is_default = True
        
        # If setting as default, unset other defaults
        if is_default:
            payment_methods_col.update_many(
                {"user_id": ObjectId(user_id)},
                {"$set": {"is_default": False}}
            )
        
        # Create payment method
        method_doc = create_payment_method_doc(
            user_id=ObjectId(user_id),
            method_type=method_type,
            provider=provider,
            account_info=account_info,
            is_default=is_default
        )
        
        result = payment_methods_col.insert_one(method_doc)
        method_doc["_id"] = str(result.inserted_id)
        method_doc["user_id"] = str(method_doc["user_id"])
        
        return jsonify({
            "message": "Payment method added successfully",
            "method": method_doc
        }), 201
    except Exception as e:
        logger.error(f"Error adding payment method: {e}")
        return jsonify({"error": "Failed to add payment method"}), 500


@bp.route("/<method_id>", methods=["GET"])
@require_auth
def get_payment_method(user_id, method_id):
    """Get specific payment method"""
    try:
        method = payment_methods_col.find_one({
            "_id": ObjectId(method_id),
            "user_id": ObjectId(user_id)
        })
        
        if not method:
            return jsonify({"error": "Payment method not found"}), 404
        
        return jsonify(serialize_doc(method))
    except Exception as e:
        logger.error(f"Error fetching payment method: {e}")
        return jsonify({"error": "Failed to fetch payment method"}), 500


@bp.route("/<method_id>", methods=["PUT"])
@require_auth
def update_payment_method(user_id, method_id):
    """Update a payment method"""
    try:
        data = request.json or {}
        
        method = payment_methods_col.find_one({
            "_id": ObjectId(method_id),
            "user_id": ObjectId(user_id)
        })
        
        if not method:
            return jsonify({"error": "Payment method not found"}), 404
        
        update_fields = {}
        
        if "is_default" in data:
            is_default = data.get("is_default")
            if is_default:
                # Unset other defaults
                payment_methods_col.update_many(
                    {"user_id": ObjectId(user_id)},
                    {"$set": {"is_default": False}}
                )
            update_fields["is_default"] = is_default
        
        # If account_info is being updated, reset approval status to pending
        if "account_info" in data:
            update_fields["account_info"] = data.get("account_info")
            # Reset approval status if payment method was previously approved
            if method.get("approval_status") == "approved":
                update_fields["approval_status"] = "pending"
                update_fields["approved_by"] = None
                update_fields["approved_at"] = None
        
        update_fields["updated_at"] = datetime.utcnow()
        
        payment_methods_col.update_one(
            {"_id": ObjectId(method_id)},
            {"$set": update_fields}
        )
        
        updated = payment_methods_col.find_one({"_id": ObjectId(method_id)})
        return jsonify({
            "message": "Payment method updated successfully",
            "method": serialize_doc(updated)
        })
    except Exception as e:
        logger.error(f"Error updating payment method: {e}")
        return jsonify({"error": "Failed to update payment method"}), 500


@bp.route("/<method_id>", methods=["DELETE"])
@require_auth
def delete_payment_method(user_id, method_id):
    """Delete a payment method"""
    try:
        method = payment_methods_col.find_one({
            "_id": ObjectId(method_id),
            "user_id": ObjectId(user_id)
        })
        
        if not method:
            return jsonify({"error": "Payment method not found"}), 404
        
        # Don't allow deletion if it's the last one
        count = payment_methods_col.count_documents({"user_id": ObjectId(user_id)})
        if count == 1:
            return jsonify({"error": "Cannot delete the only payment method"}), 400
        
        payment_methods_col.delete_one({"_id": ObjectId(method_id)})
        
        return jsonify({"message": "Payment method deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting payment method: {e}")
        return jsonify({"error": "Failed to delete payment method"}), 500


@bp.route("/<method_id>/verify", methods=["POST"])
@require_auth
def verify_payment_method(user_id, method_id):
    """Verify a payment method (for bank transfers, can send small amounts)"""
    try:
        method = payment_methods_col.find_one({
            "_id": ObjectId(method_id),
            "user_id": ObjectId(user_id)
        })
        
        if not method:
            return jsonify({"error": "Payment method not found"}), 404
        
        # In production, you would integrate with payment provider
        # to verify bank details, send micro-deposits, etc.
        
        payment_methods_col.update_one(
            {"_id": ObjectId(method_id)},
            {
                "$set": {
                    "is_verified": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({"message": "Payment method verified successfully"})
    except Exception as e:
        logger.error(f"Error verifying payment method: {e}")
        return jsonify({"error": "Failed to verify payment method"}), 500
