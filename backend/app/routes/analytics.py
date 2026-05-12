"""Analytics and metrics tracking."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
from ..db import donations_col, coffee_col, users_col
from ..errors import NotFoundError
import logging

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard_analytics():
    """Get comprehensive analytics for creator dashboard."""
    user_id = get_jwt_identity()

    # Date range (default: last 30 days)
    days = int(request.args.get("days", 30))
    start_date = datetime.utcnow() - timedelta(days=days)

    try:
        # Revenue metrics
        donations_pipeline = [
            {"$match": {"creator_id": ObjectId(user_id), "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "count": {"$sum": 1},
                "avg_amount": {"$avg": "$amount"}
            }}
        ]

        coffee_pipeline = [
            {"$match": {"creator_id": ObjectId(user_id), "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }}
        ]

        donations_stats = list(donations_col.aggregate(donations_pipeline))
        coffee_stats = list(coffee_col.aggregate(coffee_pipeline))

        donations_data = donations_stats[0] if donations_stats else {"total_amount": 0, "count": 0, "avg_amount": 0}
        coffee_data = coffee_stats[0] if coffee_stats else {"total_amount": 0, "count": 0}

        # Supporter growth
        supporter_growth = get_supporter_growth(user_id, days)

        # Top supporters
        top_supporters = get_top_supporters(user_id, days)

        # Revenue by day (for charts)
        revenue_by_day = get_revenue_by_day(user_id, days)

        return jsonify({
            "period_days": days,
            "revenue": {
                "donations": donations_data["total_amount"],
                "coffee": coffee_data["total_amount"],
                "total": donations_data["total_amount"] + coffee_data["total_amount"]
            },
            "transactions": {
                "donations": donations_data["count"],
                "coffee": coffee_data["count"],
                "total": donations_data["count"] + coffee_data["count"]
            },
            "averages": {
                "donation_amount": donations_data["avg_amount"]
            },
            "supporter_growth": supporter_growth,
            "top_supporters": top_supporters,
            "revenue_chart": revenue_by_day
        })

    except Exception as e:
        logging.error(f"Error generating analytics: {str(e)}")
        return jsonify({"error": "Failed to generate analytics"}), 500

def get_supporter_growth(user_id, days):
    """Get supporter growth over time."""
    # This is a simplified version - in production you'd want more granular data
    pipeline = [
        {"$match": {"creator_id": ObjectId(user_id)}},
        {"$group": {
            "_id": {
                "$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": "$created_at"
                }
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]

    results = list(donations_col.aggregate(pipeline))
    return [{"date": item["_id"], "supporters": item["count"]} for item in results]

def get_top_supporters(user_id, days):
    """Get top supporters by total amount."""
    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"creator_id": ObjectId(user_id), "created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$user_id",
            "total_amount": {"$sum": "$amount"},
            "donation_count": {"$sum": 1}
        }},
        {"$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "_id",
            "as": "user_info"
        }},
        {"$unwind": "$user_info"},
        {"$project": {
            "username": "$user_info.username",
            "total_amount": 1,
            "donation_count": 1
        }},
        {"$sort": {"total_amount": -1}},
        {"$limit": 10}
    ]

    results = list(donations_col.aggregate(pipeline))
    return results

def get_revenue_by_day(user_id, days):
    """Get daily revenue data for charts."""
    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {"creator_id": ObjectId(user_id), "created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {
                "$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": "$created_at"
                }
            },
            "amount": {"$sum": "$amount"}
        }},
        {"$sort": {"_id": 1}}
    ]

    results = list(donations_col.aggregate(pipeline))
    return [{"date": item["_id"], "amount": item["amount"]} for item in results]