"""Admin financial analytics from platform_revenue and payouts."""

from datetime import datetime, timedelta

from bson import ObjectId

from ..db import platform_revenue_col, payouts_col, users_col
from ..errors import ValidationError


def parse_date_range(start_date_str=None, end_date_str=None, default_days=30):
    """Return (start_datetime, end_datetime) inclusive UTC day bounds."""
    now = datetime.utcnow()
    if end_date_str:
        try:
            end_day = datetime.strptime(end_date_str, "%Y-%m-%d")
        except ValueError as e:
            raise ValidationError("Invalid end_date. Use YYYY-MM-DD") from e
    else:
        end_day = now

    end_dt = end_day.replace(hour=23, minute=59, second=59, microsecond=999999)

    if start_date_str:
        try:
            start_day = datetime.strptime(start_date_str, "%Y-%m-%d")
        except ValueError as e:
            raise ValidationError("Invalid start_date. Use YYYY-MM-DD") from e
    else:
        start_day = (end_day - timedelta(days=default_days - 1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

    start_dt = start_day.replace(hour=0, minute=0, second=0, microsecond=0)

    if start_dt > end_dt:
        raise ValidationError("start_date must be on or before end_date")

    return start_dt, end_dt


def _revenue_match(start_dt, end_dt):
    return {"created_at": {"$gte": start_dt, "$lte": end_dt}}


def get_revenue_summary(start_dt, end_dt):
    pipeline = [
        {"$match": _revenue_match(start_dt, end_dt)},
        {
            "$group": {
                "_id": None,
                "total_platform_revenue": {"$sum": "$platform_fee"},
                "total_gross_volume": {"$sum": "$gross_amount"},
                "total_paystack_fees": {"$sum": "$paystack_fee"},
                "total_creator_earnings": {"$sum": "$creator_earnings"},
                "transaction_count": {"$sum": 1},
            }
        },
    ]
    rows = list(platform_revenue_col.aggregate(pipeline))
    base = rows[0] if rows else {}
    return {
        "total_platform_revenue": round(base.get("total_platform_revenue", 0) or 0, 2),
        "total_gross_volume": round(base.get("total_gross_volume", 0) or 0, 2),
        "total_paystack_fees": round(base.get("total_paystack_fees", 0) or 0, 2),
        "total_creator_earnings": round(base.get("total_creator_earnings", 0) or 0, 2),
        "transaction_count": int(base.get("transaction_count", 0) or 0),
    }


def get_payouts_summary(start_dt, end_dt):
    match = {"created_at": {"$gte": start_dt, "$lte": end_dt}}

    completed = list(
        payouts_col.aggregate(
            [
                {"$match": {**match, "status": "completed"}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            ]
        )
    )
    pending = payouts_col.count_documents({**match, "status": "pending"})
    processing = payouts_col.count_documents({**match, "status": "processing"})

    comp = completed[0] if completed else {}
    return {
        "total_payouts_completed": round(comp.get("total", 0) or 0, 2),
        "completed_payout_count": int(comp.get("count", 0) or 0),
        "pending_payout_count": pending,
        "processing_payout_count": processing,
    }


def get_period_breakdown(start_dt, end_dt, period="daily"):
    fmt = "%Y-%m" if period == "monthly" else "%Y-%m-%d"
    pipeline = [
        {"$match": _revenue_match(start_dt, end_dt)},
        {
            "$group": {
                "_id": {"$dateToString": {"format": fmt, "date": "$created_at"}},
                "platform_revenue": {"$sum": "$platform_fee"},
                "gross_volume": {"$sum": "$gross_amount"},
                "paystack_fees": {"$sum": "$paystack_fee"},
                "creator_earnings": {"$sum": "$creator_earnings"},
                "transactions": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    rows = platform_revenue_col.aggregate(pipeline)
    return [
        {
            "period": r["_id"],
            "platform_revenue": round(r.get("platform_revenue", 0), 2),
            "gross_volume": round(r.get("gross_volume", 0), 2),
            "paystack_fees": round(r.get("paystack_fees", 0), 2),
            "creator_earnings": round(r.get("creator_earnings", 0), 2),
            "transactions": r.get("transactions", 0),
        }
        for r in rows
    ]


def get_recent_activity(start_dt, end_dt, limit=10):
    rows = list(
        platform_revenue_col.find(_revenue_match(start_dt, end_dt))
        .sort("created_at", -1)
        .limit(limit)
    )
    return [_serialize_revenue_row(r) for r in rows]


def get_transactions_page(start_dt, end_dt, page=1, per_page=20):
    query = _revenue_match(start_dt, end_dt)
    skip = (page - 1) * per_page
    total = platform_revenue_col.count_documents(query)
    rows = list(
        platform_revenue_col.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(per_page)
    )
    return {
        "transactions": [_serialize_revenue_row(r) for r in rows],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": max(1, (total + per_page - 1) // per_page),
        },
    }


def get_all_transactions_for_export(start_dt, end_dt):
    rows = list(
        platform_revenue_col.find(_revenue_match(start_dt, end_dt)).sort("created_at", -1)
    )
    return [_serialize_revenue_row(r) for r in rows]


def _serialize_revenue_row(doc):
    recipient_id = doc.get("recipient_id")
    creator_username = None
    creator_name = None
    if recipient_id:
        try:
            user = users_col.find_one({"_id": ObjectId(recipient_id)})
            if user:
                creator_username = user.get("username")
                creator_name = user.get("full_name") or user.get("username")
        except Exception:
            pass

    created = doc.get("created_at")
    return {
        "id": str(doc.get("_id")),
        "reference": doc.get("reference"),
        "transaction_type": doc.get("transaction_type"),
        "transaction_id": str(doc.get("transaction_id", "")),
        "recipient_id": str(recipient_id) if recipient_id else None,
        "creator_username": creator_username,
        "creator_name": creator_name,
        "gross_amount": round(doc.get("gross_amount", 0), 2),
        "paystack_fee": round(doc.get("paystack_fee", 0), 2),
        "platform_fee": round(doc.get("platform_fee", 0), 2),
        "creator_earnings": round(doc.get("creator_earnings", 0), 2),
        "created_at": created.isoformat() if hasattr(created, "isoformat") else created,
    }


def build_overview(start_date_str=None, end_date_str=None):
    start_dt, end_dt = parse_date_range(start_date_str, end_date_str)
    revenue = get_revenue_summary(start_dt, end_dt)
    payouts = get_payouts_summary(start_dt, end_dt)
    return {
        "date_range": {
            "start": start_dt.strftime("%Y-%m-%d"),
            "end": end_dt.strftime("%Y-%m-%d"),
        },
        "summary": {**revenue, **payouts},
        "daily_breakdown": get_period_breakdown(start_dt, end_dt, "daily"),
        "monthly_breakdown": get_period_breakdown(start_dt, end_dt, "monthly"),
        "recent_activity": get_recent_activity(start_dt, end_dt, limit=15),
    }
