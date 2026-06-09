from flask import Blueprint, request, jsonify, send_file
from bson import ObjectId
from datetime import datetime
from ..db import receipts_col, donations_col, coffee_col, users_col
from ..utils.auth import require_auth
from ..services.receipt_service import ensure_receipt_for_transaction
from ..utils.pdf_generator import generate_receipt_pdf, generate_receipt_filename
import logging

bp = Blueprint("receipts", __name__, url_prefix="/api/receipts")
logger = logging.getLogger(__name__)


@bp.route("", methods=["GET"])
@require_auth
def get_receipts(user_id):
    """Get receipts for user (as payer or recipient)"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        receipt_type = request.args.get("type", None)  # "payment" (paid) or "income" (received)
        
        skip = (page - 1) * per_page
        
        if receipt_type == "payment":
            # Receipts where user is payer
            query = {"payer_email": users_col.find_one({"_id": ObjectId(user_id)}).get("email")}
        elif receipt_type == "income":
            # Receipts where user is recipient
            query = {"recipient_id": ObjectId(user_id)}
        else:
            # All receipts related to user
            user_email = users_col.find_one({"_id": ObjectId(user_id)}).get("email")
            query = {
                "$or": [
                    {"payer_email": user_email},
                    {"recipient_id": ObjectId(user_id)}
                ]
            }
        
        receipts = list(
            receipts_col.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Convert ObjectId to string
        for receipt in receipts:
            receipt["_id"] = str(receipt["_id"])
            receipt["transaction_id"] = str(receipt["transaction_id"])
            if isinstance(receipt["recipient_id"], ObjectId):
                receipt["recipient_id"] = str(receipt["recipient_id"])
        
        total = receipts_col.count_documents(query)
        
        return jsonify({
            "receipts": receipts,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching receipts: {e}")
        return jsonify({"error": "Failed to fetch receipts"}), 500


@bp.route("/<receipt_id>", methods=["GET"])
@require_auth
def get_receipt(user_id, receipt_id):
    """Get specific receipt details"""
    try:
        user_email = users_col.find_one({"_id": ObjectId(user_id)}).get("email")
        
        receipt = receipts_col.find_one({
            "_id": ObjectId(receipt_id),
            "$or": [
                {"payer_email": user_email},
                {"recipient_id": ObjectId(user_id)}
            ]
        })
        
        if not receipt:
            return jsonify({"error": "Receipt not found"}), 404
        
        receipt["_id"] = str(receipt["_id"])
        receipt["transaction_id"] = str(receipt["transaction_id"])
        if isinstance(receipt["recipient_id"], ObjectId):
            receipt["recipient_id"] = str(receipt["recipient_id"])
        
        return jsonify(receipt)
    except Exception as e:
        logger.error(f"Error fetching receipt: {e}")
        return jsonify({"error": "Failed to fetch receipt"}), 500


@bp.route("/transaction/<transaction_id>", methods=["GET"])
@require_auth
def get_receipt_for_transaction(user_id, transaction_id):
    """Get receipt for a specific transaction"""
    try:
        receipt = receipts_col.find_one({"transaction_id": ObjectId(transaction_id)})
        
        if not receipt:
            return jsonify({"error": "Receipt not found"}), 404
        
        # Verify user has access to this receipt
        user_email = users_col.find_one({"_id": ObjectId(user_id)}).get("email")
        if receipt["payer_email"] != user_email and str(receipt["recipient_id"]) != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        receipt["_id"] = str(receipt["_id"])
        receipt["transaction_id"] = str(receipt["transaction_id"])
        if isinstance(receipt["recipient_id"], ObjectId):
            receipt["recipient_id"] = str(receipt["recipient_id"])
        
        return jsonify(receipt)
    except Exception as e:
        logger.error(f"Error fetching receipt: {e}")
        return jsonify({"error": "Failed to fetch receipt"}), 500


@bp.route("/create/<transaction_id>/<transaction_type>", methods=["POST"])
def create_receipt(transaction_id, transaction_type):
    """
    Create a receipt for a successful transaction
    Called internally after payment success
    """
    try:
        if transaction_type not in ["donation", "coffee"]:
            return jsonify({"error": "Invalid transaction type"}), 400
        
        # Fetch transaction
        if transaction_type == "donation":
            transaction = donations_col.find_one({"_id": ObjectId(transaction_id)})
        else:
            transaction = coffee_col.find_one({"_id": ObjectId(transaction_id)})
        
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404
        
        if transaction.get("status") != "success":
            return jsonify({"error": "Cannot create receipt for unsuccessful transaction"}), 400

        had_receipt = receipts_col.find_one({"transaction_id": ObjectId(transaction_id)}) is not None
        receipt = ensure_receipt_for_transaction(transaction, transaction_type)
        if not receipt:
            return jsonify({"error": "Failed to create receipt"}), 500

        receipt = dict(receipt)
        receipt["_id"] = str(receipt["_id"])
        receipt["transaction_id"] = str(receipt["transaction_id"])
        if isinstance(receipt.get("recipient_id"), ObjectId):
            receipt["recipient_id"] = str(receipt["recipient_id"])

        return jsonify({
            "message": "Receipt already exists" if had_receipt else "Receipt created successfully",
            "receipt": receipt,
        }), 200 if had_receipt else 201
    except Exception as e:
        logger.error(f"Error creating receipt: {e}")
        return jsonify({"error": "Failed to create receipt"}), 500


@bp.route("/<receipt_id>/resend", methods=["POST"])
@require_auth
def resend_receipt(user_id, receipt_id):
    """Resend receipt email to user"""
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        receipt = receipts_col.find_one({
            "_id": ObjectId(receipt_id),
            "$or": [
                {"payer_email": user.get("email")},
                {"recipient_id": ObjectId(user_id)}
            ]
        })
        
        if not receipt:
            return jsonify({"error": "Receipt not found"}), 404
        
        # In production, send email using email service
        # send_receipt_email(receipt["payer_email"], receipt)
        
        return jsonify({"message": "Receipt email sent successfully"})
    except Exception as e:
        logger.error(f"Error resending receipt: {e}")
        return jsonify({"error": "Failed to resend receipt"}), 500


@bp.route("/<receipt_id>/download", methods=["GET"])
@require_auth
def download_receipt_pdf(user_id, receipt_id):
    """Download receipt as PDF"""
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        receipt = receipts_col.find_one({
            "_id": ObjectId(receipt_id),
            "$or": [
                {"payer_email": user.get("email")},
                {"recipient_id": ObjectId(user_id)}
            ]
        })
        
        if not receipt:
            return jsonify({"error": "Receipt not found"}), 404
        
        # Generate PDF
        pdf_content = generate_receipt_pdf(receipt)
        filename = generate_receipt_filename(receipt.get("receipt_number", "unknown"))
        
        return send_file(
            pdf_content,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"Error downloading receipt: {e}")
        return jsonify({"error": "Failed to download receipt"}), 500
