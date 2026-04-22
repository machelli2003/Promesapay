from flask import Blueprint, request, jsonify
from bson import ObjectId
import uuid
from datetime import datetime
from ..db import users_col, coffee_col
from ..models.coffee import create_coffee_doc
from ..services.paystack import initialize_payment, verify_payment
from ..utils.auth_helpers import serialize_doc

coffee_bp = Blueprint("coffee", __name__)

COFFEE_PRICE_GHC = 5  # GH₵5 per coffee


@coffee_bp.route("/initiate", methods=["POST"])
def initiate_coffee():
    data = request.get_json()

    required = ["recipient_username", "cups", "donor_name", "donor_email"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    cups = int(data["cups"])
    if cups < 1 or cups > 10:
        return jsonify({"error": "Cups must be between 1 and 10"}), 400

    amount = cups * COFFEE_PRICE_GHC

    # Find recipient
    recipient = users_col.find_one({"username": data["recipient_username"].lower()})
    if not recipient:
        return jsonify({"error": "Recipient not found"}), 404

    recipient_id = str(recipient["_id"])
    reference = f"cof_{uuid.uuid4().hex[:16]}"

    metadata = {
        "type": "coffee",
        "recipient_id": recipient_id,
        "cups": cups,
        "donor_name": data["donor_name"],
        "message": data.get("message", ""),
    }

    paystack_res = initialize_payment(
        email=data["donor_email"],
        amount_ghc=amount,
        reference=reference,
        metadata=metadata,
    )

    if not paystack_res.get("status"):
        return jsonify({"error": "Payment initialization failed"}), 502

    # Save pending coffee
    doc = create_coffee_doc(
        recipient_id=recipient_id,
        cups=cups,
        amount=amount,
        donor_name=data["donor_name"],
        donor_email=data["donor_email"],
        message=data.get("message", ""),
        reference=reference,
        status="pending",
    )
    coffee_col.insert_one(doc)

    return jsonify({
        "authorization_url": paystack_res["data"]["authorization_url"],
        "reference": reference,
    }), 200


@coffee_bp.route("/verify", methods=["POST"])
def verify_coffee():
    data = request.get_json()
    reference = data.get("reference")

    if not reference:
        return jsonify({"error": "Reference is required"}), 400

    coffee = coffee_col.find_one({"reference": reference})
    if not coffee:
        return jsonify({"error": "Coffee transaction not found"}), 404

    if coffee["status"] == "success":
        return jsonify({"message": "Already verified", "status": "success"}), 200

    result = verify_payment(reference)

    if not result.get("status"):
        return jsonify({"error": "Verification failed"}), 502

    paystack_status = result["data"]["status"]

    if paystack_status == "success":
        amount = coffee["amount"]
        recipient_id = coffee["recipient_id"]

        coffee_col.update_one(
            {"reference": reference},
            {"$set": {"status": "success", "verified_at": datetime.utcnow()}}
        )

        users_col.update_one(
            {"_id": ObjectId(recipient_id)},
            {"$inc": {"total_received": amount}}
        )

        updated_user = users_col.find_one({"_id": ObjectId(recipient_id)})
        user_data = serialize_doc(updated_user)
        user_data.pop("password", None)

        return jsonify({"message": "Coffee sent!", "status": "success", "user": user_data}), 200

    else:
        coffee_col.update_one(
            {"reference": reference},
            {"$set": {"status": "failed"}}
        )
        return jsonify({"message": "Payment was not successful", "status": "failed"}), 200