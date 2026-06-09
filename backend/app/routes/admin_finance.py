"""Admin financial dashboard API."""

from flask import Blueprint, jsonify, request, Response

from ..utils.auth import require_admin
from ..services.admin_finance import (
    build_overview,
    get_period_breakdown,
    get_transactions_page,
    parse_date_range,
)
from ..services.admin_finance_exports import build_csv_report, build_pdf_report
from ..services.paystack_splits import get_split_config, update_split_config

bp = Blueprint("admin_finance", __name__, url_prefix="/api/admin/finance")


@bp.route("/overview", methods=["GET"])
@require_admin
def overview(user_id):
    data = build_overview(
        request.args.get("start_date"),
        request.args.get("end_date"),
    )
    return jsonify(data), 200


@bp.route("/trends", methods=["GET"])
@require_admin
def trends(user_id):
    start_dt, end_dt = parse_date_range(
        request.args.get("start_date"),
        request.args.get("end_date"),
    )
    granularity = request.args.get("granularity", "daily")
    if granularity not in ("daily", "monthly"):
        granularity = "daily"
    return jsonify(
        {
            "date_range": {
                "start": start_dt.strftime("%Y-%m-%d"),
                "end": end_dt.strftime("%Y-%m-%d"),
            },
            "granularity": granularity,
            "series": get_period_breakdown(start_dt, end_dt, granularity),
        }
    ), 200


@bp.route("/transactions", methods=["GET"])
@require_admin
def transactions(user_id):
    start_dt, end_dt = parse_date_range(
        request.args.get("start_date"),
        request.args.get("end_date"),
    )
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    data = get_transactions_page(start_dt, end_dt, page=page, per_page=per_page)
    data["date_range"] = {
        "start": start_dt.strftime("%Y-%m-%d"),
        "end": end_dt.strftime("%Y-%m-%d"),
    }
    return jsonify(data), 200


@bp.route("/export/csv", methods=["GET"])
@require_admin
def export_csv(user_id):
    content, filename = build_csv_report(
        request.args.get("start_date"),
        request.args.get("end_date"),
    )
    return Response(
        content,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@bp.route("/export/pdf", methods=["GET"])
@require_admin
def export_pdf(user_id):
    try:
        content, filename = build_pdf_report(
            request.args.get("start_date"),
            request.args.get("end_date"),
        )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503

    return Response(
        content,
        mimetype="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@bp.route("/paystack-splits", methods=["GET"])
@require_admin
def paystack_splits_get(user_id):
    return jsonify({"config": get_split_config()}), 200


@bp.route("/paystack-splits", methods=["PUT"])
@require_admin
def paystack_splits_put(user_id):
    data = request.get_json() or {}
    config = update_split_config(data)
    return jsonify({"message": "Split configuration updated", "config": config}), 200
