"""Admin payout queue API."""

from flask import Blueprint, jsonify, request

from ..utils.auth import require_admin
from ..services.admin_payouts import (
    PayoutStatusError,
    get_queue_stats,
    get_payout_detail,
    list_payouts,
    update_payout_status,
)

bp = Blueprint("admin_payouts", __name__, url_prefix="/api/admin/payouts")


@bp.route("/stats", methods=["GET"])
@require_admin
def stats(user_id):
    return jsonify(get_queue_stats()), 200


@bp.route("", methods=["GET"])
@require_admin
def queue(user_id):
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    status = request.args.get("status")
    data = list_payouts(status=status, page=page, per_page=per_page)
    return jsonify(data), 200


@bp.route("/<payout_id>", methods=["GET"])
@require_admin
def detail(user_id, payout_id):
    payout = get_payout_detail(payout_id)
    if not payout:
        return jsonify({"error": "Payout not found"}), 404
    return jsonify({"payout": payout}), 200


@bp.route("/<payout_id>/status", methods=["PATCH"])
@require_admin
def set_status(user_id, payout_id):
    data = request.get_json() or {}
    new_status = (data.get("status") or "").strip().lower()
    if not new_status:
        return jsonify({"error": "status is required"}), 400

    try:
        payout = update_payout_status(
            user_id,
            payout_id,
            new_status,
            notes=(data.get("notes") or "").strip(),
            reference=(data.get("reference") or "").strip(),
            failure_reason=(data.get("failure_reason") or "").strip(),
        )
        return jsonify(
            {
                "message": f"Payout marked as {new_status}",
                "payout": payout,
            }
        ), 200
    except PayoutStatusError as e:
        return jsonify({"error": str(e)}), 400
