from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..db import donations_col, coffee_col
from ..utils.auth_helpers import serialize_doc
from ..errors import ValidationError

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/", methods=["GET"])
@jwt_required()
def get_transactions():
    """Get user's transaction history with filtering and pagination.
    
    Query Parameters:
    - page: int (default: 1)
    - limit: int (default: 20, max: 100)
    - status: str (success, pending, failed) - comma-separated
    - type: str (donation, coffee) - comma-separated
    - start_date: ISO date string (YYYY-MM-DD)
    - end_date: ISO date string (YYYY-MM-DD)
    - sort: str (newest, oldest, highest, lowest)
    """
    user_id = get_jwt_identity()
    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(1, int(request.args.get("limit", 20))))
    skip = (page - 1) * limit
    
    # Build filter
    status_filter = request.args.get("status", "success").split(",")
    status_filter = [s.strip() for s in status_filter if s.strip()]
    
    type_filter = request.args.get("type", "").split(",")
    type_filter = [t.strip() for t in type_filter if t.strip()]
    
    match_stage = {
        "recipient_id": user_id,
        "status": {"$in": status_filter}
    }
    
    # Date filtering
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    if start_date or end_date:
        date_range = {}
        if start_date:
            try:
                date_range["$gte"] = datetime.fromisoformat(start_date)
            except ValueError:
                raise ValidationError("Invalid start_date format. Use YYYY-MM-DD")
        if end_date:
            try:
                # Add 1 day to include entire end date
                date_range["$lte"] = datetime.fromisoformat(end_date) + timedelta(days=1)
            except ValueError:
                raise ValidationError("Invalid end_date format. Use YYYY-MM-DD")
        match_stage["created_at"] = date_range
    
    # Determine sort order
    sort_param = request.args.get("sort", "newest")
    if sort_param == "newest":
        sort_order = [("created_at", -1)]
    elif sort_param == "oldest":
        sort_order = [("created_at", 1)]
    elif sort_param == "highest":
        sort_order = [("amount", -1), ("created_at", -1)]
    elif sort_param == "lowest":
        sort_order = [("amount", 1), ("created_at", -1)]
    else:
        sort_order = [("created_at", -1)]
    
    # Fetch from both collections
    donations_pipeline = [
        {"$match": match_stage},
        {"$sort": dict(sort_order)},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    coffee_pipeline = [
        {"$match": match_stage},
        {"$sort": dict(sort_order)},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    donations = list(donations_col.aggregate(donations_pipeline))
    coffees = list(coffee_col.aggregate(coffee_pipeline))
    
    # Filter by type if specified
    if type_filter:
        if "donation" not in type_filter:
            donations = []
        if "coffee" not in type_filter:
            coffees = []
    
    # Merge and sort
    all_txns = [serialize_doc(d) for d in donations] + [serialize_doc(c) for c in coffees]
    all_txns.sort(key=lambda x: x["created_at"], reverse=(sort_param == "newest" or sort_param == "highest"))
    all_txns = all_txns[:limit]
    
    # Count totals with filters
    total_donations = donations_col.count_documents(match_stage)
    total_coffees = coffee_col.count_documents(match_stage)
    
    return jsonify({
        "transactions": all_txns,
        "total": total_donations + total_coffees,
        "page": page,
        "limit": limit,
        "total_pages": (total_donations + total_coffees + limit - 1) // limit
    }), 200


@transactions_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_transaction_stats():
    """Get transaction statistics for dashboard."""
    user_id = get_jwt_identity()
    
    # Success transactions
    donation_stats = list(donations_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]))
    
    coffee_stats = list(coffee_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}, "cups": {"$sum": "$cups"}}}
    ]))
    
    # Pending transactions
    pending_donations = donations_col.count_documents({"recipient_id": user_id, "status": "pending"})
    pending_coffees = coffee_col.count_documents({"recipient_id": user_id, "status": "pending"})
    
    d = donation_stats[0] if donation_stats else {"total": 0, "count": 0}
    c = coffee_stats[0] if coffee_stats else {"total": 0, "count": 0, "cups": 0}
    
    return jsonify({
        "stats": {
            "success": {
                "total_raised": d["total"] + c["total"],
                "donation_total": d["total"],
                "coffee_total": c["total"],
                "donation_count": d["count"],
                "coffee_count": c["count"],
                "total_cups": c.get("cups", 0),
                "total_supporters": d["count"] + c["count"],
            },
            "pending": {
                "pending_donations": pending_donations,
                "pending_coffees": pending_coffees
            }
        }
    }), 200