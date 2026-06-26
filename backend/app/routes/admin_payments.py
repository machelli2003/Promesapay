"""Admin payment management, withdrawal approval, and fund allocation routes."""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import logging
from ..db import (
    payment_methods_col,
    withdrawals_col,
    users_col,
    transactions_col,
    notifications_col
)
from ..utils.auth import require_auth
from ..models.transaction import create_transaction_doc

logger = logging.getLogger(__name__)
bp = Blueprint("admin_payments", __name__, url_prefix="/api/admin/payments")


def require_admin(func):
    """Decorator to require admin role."""
    from functools import wraps
    @wraps(func)
    def wrapper(*args, user_id=None, **kwargs):
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return func(*args, user_id=user_id, **kwargs)
    return wrapper


# ============================================================================
# Payment Method Approval Management
# ============================================================================

@bp.route("/methods/pending", methods=["GET"])
@require_auth
def get_pending_payment_methods(user_id):
    """Get all pending payment methods for approval."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        
        skip = (page - 1) * per_page
        pending = list(
            payment_methods_col.find({"approval_status": "pending"})
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Serialize and add user info
        for method in pending:
            method["_id"] = str(method["_id"])
            method["user_id"] = str(method["user_id"])
            user_info = users_col.find_one({"_id": ObjectId(method["user_id"])})
            if user_info:
                method["user_email"] = user_info.get("email")
                method["user_username"] = user_info.get("username")
                method["user_name"] = user_info.get("full_name")
        
        total = payment_methods_col.count_documents({"approval_status": "pending"})
        
        return jsonify({
            "methods": pending,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching pending methods: {e}")
        return jsonify({"error": "Failed to fetch pending methods"}), 500


@bp.route("/methods/<method_id>/approve", methods=["POST"])
@require_auth
def approve_payment_method(user_id, method_id):
    """Approve a payment method."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.json or {}
        notes = data.get("notes", "")
        
        method = payment_methods_col.find_one({"_id": ObjectId(method_id)})
        if not method:
            return jsonify({"error": "Payment method not found"}), 404
        
        if method.get("approval_status") != "pending":
            return jsonify({
                "error": "Only pending methods can be approved",
                "current_status": method.get("approval_status")
            }), 400
        
        # Update payment method
        payment_methods_col.update_one(
            {"_id": ObjectId(method_id)},
            {
                "$set": {
                    "approval_status": "approved",
                    "approved_by": ObjectId(user_id),
                    "approved_at": datetime.utcnow(),
                    "admin_notes": notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update payment method as default if no other approved method exists
        user_id_for_method = method["user_id"]
        approved_count = payment_methods_col.count_documents({
            "user_id": user_id_for_method,
            "approval_status": "approved"
        })
        
        if approved_count == 1:  # This is the first approved one
            payment_methods_col.update_one(
                {"_id": ObjectId(method_id)},
                {"$set": {"is_default": True}}
            )
        
        # Create notification for user
        notification = {
            "_id": ObjectId(),
            "user_id": user_id_for_method,
            "type": "payment_method_approved",
            "title": "Payment Method Approved",
            "message": f"Your {method.get('method_type')} payment method has been approved",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        updated = payment_methods_col.find_one({"_id": ObjectId(method_id)})
        updated["_id"] = str(updated["_id"])
        updated["user_id"] = str(updated["user_id"])
        updated["approved_by"] = str(updated["approved_by"])
        
        return jsonify({
            "message": "Payment method approved successfully",
            "method": updated
        })
    except Exception as e:
        logger.error(f"Error approving payment method: {e}")
        return jsonify({"error": "Failed to approve payment method"}), 500


@bp.route("/methods/<method_id>/reject", methods=["POST"])
@require_auth
def reject_payment_method(user_id, method_id):
    """Reject a payment method."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.json or {}
        rejection_reason = data.get("rejection_reason", "")
        if not rejection_reason:
            return jsonify({"error": "Rejection reason is required"}), 400
        
        method = payment_methods_col.find_one({"_id": ObjectId(method_id)})
        if not method:
            return jsonify({"error": "Payment method not found"}), 404
        
        # Update payment method
        payment_methods_col.update_one(
            {"_id": ObjectId(method_id)},
            {
                "$set": {
                    "approval_status": "rejected",
                    "rejected_by": ObjectId(user_id),
                    "rejected_at": datetime.utcnow(),
                    "rejection_reason": rejection_reason,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create notification for user
        user_id_for_method = method["user_id"]
        notification = {
            "_id": ObjectId(),
            "user_id": user_id_for_method,
            "type": "payment_method_rejected",
            "title": "Payment Method Rejected",
            "message": f"Your {method.get('method_type')} payment method was rejected. Reason: {rejection_reason}",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        updated = payment_methods_col.find_one({"_id": ObjectId(method_id)})
        updated["_id"] = str(updated["_id"])
        updated["user_id"] = str(updated["user_id"])
        updated["rejected_by"] = str(updated["rejected_by"])
        
        return jsonify({
            "message": "Payment method rejected successfully",
            "method": updated
        })
    except Exception as e:
        logger.error(f"Error rejecting payment method: {e}")
        return jsonify({"error": "Failed to reject payment method"}), 500


@bp.route("/methods", methods=["GET"])
@require_auth
def get_all_payment_methods(user_id):
    """Get all payment methods (admin view)."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        approval_status = request.args.get("status", None)
        
        query = {}
        if approval_status:
            query["approval_status"] = approval_status
        
        skip = (page - 1) * per_page
        methods = list(
            payment_methods_col.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Serialize and add user info
        for method in methods:
            method["_id"] = str(method["_id"])
            method["user_id"] = str(method["user_id"])
            user_info = users_col.find_one({"_id": ObjectId(method["user_id"])})
            if user_info:
                method["user_email"] = user_info.get("email")
                method["user_username"] = user_info.get("username")
                method["user_name"] = user_info.get("full_name")
            if method.get("approved_by"):
                method["approved_by"] = str(method["approved_by"])
            if method.get("rejected_by"):
                method["rejected_by"] = str(method["rejected_by"])
        
        total = payment_methods_col.count_documents(query)
        
        return jsonify({
            "methods": methods,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching payment methods: {e}")
        return jsonify({"error": "Failed to fetch payment methods"}), 500


# ============================================================================
# Withdrawal Management
# ============================================================================

@bp.route("/withdrawals/pending", methods=["GET"])
@require_auth
def get_pending_withdrawals(user_id):
    """Get all pending withdrawal requests."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        
        skip = (page - 1) * per_page
        withdrawals = list(
            withdrawals_col.find({"status": "pending"})
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Serialize and add user info
        for w in withdrawals:
            w["_id"] = str(w["_id"])
            w["user_id"] = str(w["user_id"])
            w["payment_method_id"] = str(w["payment_method_id"])
            user_info = users_col.find_one({"_id": ObjectId(w["user_id"])})
            if user_info:
                w["user_email"] = user_info.get("email")
                w["user_username"] = user_info.get("username")
                w["user_name"] = user_info.get("full_name")
        
        total = withdrawals_col.count_documents({"status": "pending"})
        
        return jsonify({
            "withdrawals": withdrawals,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching pending withdrawals: {e}")
        return jsonify({"error": "Failed to fetch pending withdrawals"}), 500


@bp.route("/withdrawals/<withdrawal_id>/approve", methods=["POST"])
@require_auth
def approve_withdrawal(user_id, withdrawal_id):
    """Approve a withdrawal request."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.json or {}
        notes = data.get("notes", "")
        
        withdrawal = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        if not withdrawal:
            return jsonify({"error": "Withdrawal not found"}), 404
        
        if withdrawal.get("status") != "pending":
            return jsonify({
                "error": "Only pending withdrawals can be approved",
                "current_status": withdrawal.get("status")
            }), 400
        
        # Update withdrawal
        withdrawals_col.update_one(
            {"_id": ObjectId(withdrawal_id)},
            {
                "$set": {
                    "status": "approved",
                    "approved_by": ObjectId(user_id),
                    "approved_at": datetime.utcnow(),
                    "admin_notes": notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create notification for user
        notification = {
            "_id": ObjectId(),
            "user_id": withdrawal["user_id"],
            "type": "withdrawal_approved",
            "title": "Withdrawal Approved",
            "message": f"Your withdrawal request of {withdrawal['amount']} has been approved. Funds will be sent to your payment method shortly.",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        updated = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        updated["_id"] = str(updated["_id"])
        updated["user_id"] = str(updated["user_id"])
        updated["payment_method_id"] = str(updated["payment_method_id"])
        updated["approved_by"] = str(updated["approved_by"])
        
        return jsonify({
            "message": "Withdrawal approved successfully",
            "withdrawal": updated
        })
    except Exception as e:
        logger.error(f"Error approving withdrawal: {e}")
        return jsonify({"error": "Failed to approve withdrawal"}), 500


@bp.route("/withdrawals/<withdrawal_id>/reject", methods=["POST"])
@require_auth
def reject_withdrawal(user_id, withdrawal_id):
    """Reject a withdrawal request."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.json or {}
        rejection_reason = data.get("rejection_reason", "")
        if not rejection_reason:
            return jsonify({"error": "Rejection reason is required"}), 400
        
        withdrawal = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        if not withdrawal:
            return jsonify({"error": "Withdrawal not found"}), 404
        
        # Update withdrawal
        withdrawals_col.update_one(
            {"_id": ObjectId(withdrawal_id)},
            {
                "$set": {
                    "status": "rejected",
                    "rejected_by": ObjectId(user_id),
                    "rejected_at": datetime.utcnow(),
                    "rejection_reason": rejection_reason,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Refund balance if it was deducted (should be kept in wallet)
        # In this system, we keep funds in wallet until approval, so no refund needed
        
        # Create notification for user
        notification = {
            "_id": ObjectId(),
            "user_id": withdrawal["user_id"],
            "type": "withdrawal_rejected",
            "title": "Withdrawal Rejected",
            "message": f"Your withdrawal request was rejected. Reason: {rejection_reason}",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        updated = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        updated["_id"] = str(updated["_id"])
        updated["user_id"] = str(updated["user_id"])
        updated["payment_method_id"] = str(updated["payment_method_id"])
        updated["rejected_by"] = str(updated["rejected_by"])
        
        return jsonify({
            "message": "Withdrawal rejected successfully",
            "withdrawal": updated
        })
    except Exception as e:
        logger.error(f"Error rejecting withdrawal: {e}")
        return jsonify({"error": "Failed to reject withdrawal"}), 500


@bp.route("/withdrawals/<withdrawal_id>/complete", methods=["POST"])
@require_auth
def complete_withdrawal(user_id, withdrawal_id):
    """Mark withdrawal as completed after funds sent."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.json or {}
        transaction_id = data.get("transaction_id", "")  # Payment provider transaction ID
        
        withdrawal = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        if not withdrawal:
            return jsonify({"error": "Withdrawal not found"}), 404
        
        if withdrawal.get("status") != "approved":
            return jsonify({
                "error": "Only approved withdrawals can be completed",
                "current_status": withdrawal.get("status")
            }), 400
        
        # Update withdrawal
        withdrawals_col.update_one(
            {"_id": ObjectId(withdrawal_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "transaction_id": transaction_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update transaction record
        transactions_col.update_one(
            {"reference_id": ObjectId(withdrawal_id)},
            {
                "$set": {
                    "status": "completed",
                    "metadata": {"transaction_id": transaction_id}
                }
            }
        )
        
        # Create notification for user
        notification = {
            "_id": ObjectId(),
            "user_id": withdrawal["user_id"],
            "type": "withdrawal_completed",
            "title": "Withdrawal Completed",
            "message": f"Your withdrawal of {withdrawal['amount']} has been completed and funds have been sent to your payment method.",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        updated = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        updated["_id"] = str(updated["_id"])
        updated["user_id"] = str(updated["user_id"])
        updated["payment_method_id"] = str(updated["payment_method_id"])
        
        return jsonify({
            "message": "Withdrawal marked as completed successfully",
            "withdrawal": updated
        })
    except Exception as e:
        logger.error(f"Error completing withdrawal: {e}")
        return jsonify({"error": "Failed to complete withdrawal"}), 500


@bp.route("/withdrawals", methods=["GET"])
@require_auth
def get_all_withdrawals(user_id):
    """Get all withdrawals (admin view)."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        status = request.args.get("status", None)
        
        query = {}
        if status:
            query["status"] = status
        
        skip = (page - 1) * per_page
        withdrawals = list(
            withdrawals_col.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Serialize and add user info
        for w in withdrawals:
            w["_id"] = str(w["_id"])
            w["user_id"] = str(w["user_id"])
            w["payment_method_id"] = str(w["payment_method_id"])
            user_info = users_col.find_one({"_id": ObjectId(w["user_id"])})
            if user_info:
                w["user_email"] = user_info.get("email")
                w["user_username"] = user_info.get("username")
                w["user_name"] = user_info.get("full_name")
            if w.get("approved_by"):
                w["approved_by"] = str(w["approved_by"])
            if w.get("rejected_by"):
                w["rejected_by"] = str(w["rejected_by"])
        
        total = withdrawals_col.count_documents(query)
        
        return jsonify({
            "withdrawals": withdrawals,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching withdrawals: {e}")
        return jsonify({"error": "Failed to fetch withdrawals"}), 500


# ============================================================================
# Admin Fund Allocation
# ============================================================================

@bp.route("/allocate-funds", methods=["POST"])
@require_auth
def allocate_funds_to_user(user_id):
    """Allocate funds directly to a user's wallet."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.json or {}
        target_user_id = data.get("user_id")
        amount = data.get("amount")
        reason = data.get("reason", "")
        
        if not target_user_id or not amount:
            return jsonify({"error": "User ID and amount are required"}), 400
        
        if amount <= 0:
            return jsonify({"error": "Amount must be positive"}), 400
        
        if not reason:
            return jsonify({"error": "Reason for allocation is required"}), 400
        
        # Get target user
        target_user = users_col.find_one({"_id": ObjectId(target_user_id)})
        if not target_user:
            return jsonify({"error": "Target user not found"}), 404
        
        # Update user wallet balance
        new_balance = target_user.get("wallet_balance", 0) + amount
        new_total_earned = target_user.get("total_earned", 0) + amount
        
        users_col.update_one(
            {"_id": ObjectId(target_user_id)},
            {
                "$set": {
                    "wallet_balance": new_balance,
                    "total_earned": new_total_earned,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create transaction record
        transaction_doc = create_transaction_doc(
            user_id=ObjectId(target_user_id),
            transaction_type="admin_allocation",
            amount=amount,
            description=f"Admin allocation: {reason}",
            reference_id=ObjectId(user_id),  # Admin who allocated
            status="completed",
            metadata={
                "allocated_by": str(user_id),
                "allocated_by_email": admin.get("email"),
                "reason": reason
            }
        )
        transactions_col.insert_one(transaction_doc)
        
        # Create notification for user
        notification = {
            "_id": ObjectId(),
            "user_id": ObjectId(target_user_id),
            "type": "funds_allocated",
            "title": "Funds Allocated to Your Account",
            "message": f"Admin has allocated {amount} to your account. Reason: {reason}",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        return jsonify({
            "message": "Funds allocated successfully",
            "allocation": {
                "_id": str(transaction_doc["_id"]),
                "user_id": str(target_user_id),
                "amount": amount,
                "reason": reason,
                "new_balance": new_balance,
                "allocated_at": datetime.utcnow().isoformat()
            }
        }), 201
    except Exception as e:
        logger.error(f"Error allocating funds: {e}")
        return jsonify({"error": "Failed to allocate funds"}), 500


@bp.route("/allocations", methods=["GET"])
@require_auth
def get_fund_allocations(user_id):
    """Get all fund allocations (admin view)."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        target_user_id = request.args.get("user_id", None)
        
        query = {"transaction_type": "admin_allocation"}
        if target_user_id:
            query["user_id"] = ObjectId(target_user_id)
        
        skip = (page - 1) * per_page
        allocations = list(
            transactions_col.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Serialize and add user info
        for alloc in allocations:
            alloc["_id"] = str(alloc["_id"])
            alloc["user_id"] = str(alloc["user_id"])
            user_info = users_col.find_one({"_id": ObjectId(alloc["user_id"])})
            if user_info:
                alloc["user_email"] = user_info.get("email")
                alloc["user_username"] = user_info.get("username")
                alloc["user_name"] = user_info.get("full_name")
        
        total = transactions_col.count_documents(query)
        
        return jsonify({
            "allocations": allocations,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        })
    except Exception as e:
        logger.error(f"Error fetching allocations: {e}")
        return jsonify({"error": "Failed to fetch allocations"}), 500


# ============================================================================
# Admin Financial Overview
# ============================================================================

@bp.route("/financial-overview", methods=["GET"])
@require_auth
def get_financial_overview(user_id):
    """Get platform financial overview."""
    try:
        # Check admin role
        admin = users_col.find_one({"_id": ObjectId(user_id)})
        if not admin or admin.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        # Calculate totals
        total_donations = 0
        for user in users_col.find({}):
            total_donations += user.get("total_earned", 0)
        
        # Total withdrawn
        total_withdrawn = 0
        for w in withdrawals_col.find({"status": "completed"}):
            total_withdrawn += w.get("amount", 0)
        
        # Pending withdrawals
        pending_withdrawal_count = withdrawals_col.count_documents({"status": "pending"})
        pending_withdrawal_amount = 0
        for w in withdrawals_col.find({"status": "pending"}):
            pending_withdrawal_amount += w.get("amount", 0)
        
        # Total allocated by admins
        total_allocated = 0
        for alloc in transactions_col.find({"transaction_type": "admin_allocation"}):
            total_allocated += alloc.get("amount", 0)
        
        # Pending payment method approvals
        pending_payment_methods = payment_methods_col.count_documents({"approval_status": "pending"})
        
        # Calculate platform balance (total donations - total withdrawn)
        platform_balance = total_donations - total_withdrawn
        
        return jsonify({
            "total_donations_received": total_donations,
            "total_withdrawn": total_withdrawn,
            "total_admin_allocations": total_allocated,
            "current_platform_balance": platform_balance,
            "pending_withdrawals": {
                "count": pending_withdrawal_count,
                "total_amount": pending_withdrawal_amount
            },
            "pending_payment_approvals": pending_payment_methods,
            "statistics": {
                "total_users": users_col.count_documents({}),
                "completed_withdrawals": withdrawals_col.count_documents({"status": "completed"}),
                "total_approved_payment_methods": payment_methods_col.count_documents({"approval_status": "approved"})
            }
        })
    except Exception as e:
        logger.error(f"Error fetching financial overview: {e}")
        return jsonify({"error": "Failed to fetch financial overview"}), 500
