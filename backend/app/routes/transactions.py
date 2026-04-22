from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..db import donations_col, coffee_col
from ..utils.auth_helpers import serialize_doc

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    skip = (page - 1) * limit

    donations = list(donations_col.find(
        {"recipient_id": user_id, "status": "success"}
    ).sort("created_at", -1).skip(skip).limit(limit))

    coffees = list(coffee_col.find(
        {"recipient_id": user_id, "status": "success"}
    ).sort("created_at", -1).skip(skip).limit(limit))

    all_txns = [serialize_doc(d) for d in donations] + [serialize_doc(c) for c in coffees]
    all_txns.sort(key=lambda x: x["created_at"], reverse=True)

    total_donations = donations_col.count_documents({"recipient_id": user_id, "status": "success"})
    total_coffees = coffee_col.count_documents({"recipient_id": user_id, "status": "success"})

    return jsonify({
        "transactions": all_txns[:limit],
        "total": total_donations + total_coffees,
        "page": page,
        "limit": limit,
    }), 200