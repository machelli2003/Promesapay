"""
System Monitoring Endpoints (Phase 3.3)
Provides real-time health checks, error tracking, and performance metrics
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
import psutil
import os

from .. import limiter
from ..db import (
    users_col, donations_col, coffee_col, 
    security_events_col, activity_log_col, db
)
from ..errors import AuthorizationError
from ..utils.auth_helpers import serialize_doc

monitoring_bp = Blueprint("monitoring", __name__, url_prefix="/api/monitoring")


def require_admin(f):
    """Decorator to check if user is admin"""
    from functools import wraps
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        if not user or user.get("role") != "admin":
            raise AuthorizationError("Admin access required")
        
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# Health Check Endpoints
# ============================================================================

@monitoring_bp.route("/health", methods=["GET"])
def health_check():
    """Basic health check endpoint (no auth required)"""
    try:
        # Check MongoDB connection
        try:
            db.client.admin.command('ping')
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
        
        # Check system resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_status = "healthy" if db_status == "healthy" and cpu_percent < 80 else "degraded"
        
        return jsonify({
            "status": health_status,
            "timestamp": datetime.utcnow().isoformat(),
            "database": db_status,
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 503


@monitoring_bp.route("/health/detailed", methods=["GET"])
@require_admin
def detailed_health_check():
    """Detailed health check for admins"""
    try:
        # Database health
        db_collections = {
            "users": users_col.count_documents({}),
            "donations": donations_col.count_documents({}),
            "coffee": coffee_col.count_documents({}),
            "security_events": security_events_col.count_documents({})
        }
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Uptime
        uptime_seconds = datetime.utcnow().timestamp() - psutil.Process(os.getpid()).create_time()
        uptime_hours = uptime_seconds / 3600
        
        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "status": "healthy",
                "collections": db_collections
            },
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_mb": {
                    "total": memory.total // (1024 * 1024),
                    "available": memory.available // (1024 * 1024),
                    "used": memory.used // (1024 * 1024)
                },
                "disk_percent": disk.percent,
                "uptime_hours": round(uptime_hours, 2)
            },
            "process": {
                "pid": os.getpid(),
                "threads": psutil.Process(os.getpid()).num_threads()
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# System Statistics
# ============================================================================

@monitoring_bp.route("/stats/overview", methods=["GET"])
@require_admin
def system_stats_overview():
    """Overview statistics for admin dashboard"""
    try:
        # User statistics
        total_users = users_col.count_documents({})
        verified_users = users_col.count_documents({"email_verified": True})
        admin_users = users_col.count_documents({"role": "admin"})
        
        # Transaction statistics
        total_donations = donations_col.count_documents({})
        completed_donations = donations_col.count_documents({"status": "completed"})
        total_coffee = coffee_col.count_documents({})
        completed_coffee = coffee_col.count_documents({"status": "completed"})
        
        # Revenue
        revenue = donations_col.aggregate([
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ])
        total_revenue = list(revenue)[0]["total"] if list(revenue) else 0
        
        # Security events (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        security_events_24h = security_events_col.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "users": {
                "total": total_users,
                "verified": verified_users,
                "admin": admin_users,
                "unverified": total_users - verified_users
            },
            "transactions": {
                "donations": {
                    "total": total_donations,
                    "completed": completed_donations,
                    "pending": total_donations - completed_donations
                },
                "coffee": {
                    "total": total_coffee,
                    "completed": completed_coffee,
                    "pending": total_coffee - completed_coffee
                }
            },
            "revenue": {
                "total": total_revenue,
                "currency": "USD"
            },
            "security": {
                "events_24h": security_events_24h
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@monitoring_bp.route("/stats/daily", methods=["GET"])
@require_admin
def daily_statistics():
    """Daily statistics for trending"""
    try:
        days = request.args.get("days", 30, type=int)
        
        # Get daily data
        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "created_at": {"$gte": datetime.utcnow() - timedelta(days=days)}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "count": {"$sum": 1},
                    "amount": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        daily_data = list(donations_col.aggregate(pipeline))
        
        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "days": days,
            "data": daily_data
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@monitoring_bp.route("/stats/hourly", methods=["GET"])
@require_admin
def hourly_statistics():
    """Last 24 hours statistics by hour"""
    try:
        # Get hourly data for last 24 hours
        now = datetime.utcnow()
        yesterday = now - timedelta(hours=24)
        
        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "created_at": {"$gte": yesterday}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d %H:00",
                            "date": "$created_at"
                        }
                    },
                    "count": {"$sum": 1},
                    "amount": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        hourly_data = list(donations_col.aggregate(pipeline))
        
        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "data": hourly_data
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# Error Tracking
# ============================================================================

@monitoring_bp.route("/errors", methods=["GET"])
@require_admin
def get_error_logs():
    """Retrieve error logs from last N hours"""
    try:
        hours = request.args.get("hours", 24, type=int)
        limit = request.args.get("limit", 100, type=int)
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        # Collect errors from security_events and activity logs
        errors = security_events_col.find({
            "timestamp": {"$gte": cutoff},
            "event_type": {"$in": ["error", "failure", "exception"]}
        }).sort("timestamp", -1).limit(limit)
        
        error_list = []
        for error in errors:
            error_list.append({
                "id": str(error.get("_id")),
                "type": error.get("event_type"),
                "message": error.get("message", ""),
                "timestamp": str(error.get("timestamp")),
                "user_id": str(error.get("user_id")) if error.get("user_id") else None
            })
        
        return jsonify({
            "status": "success",
            "errors": error_list,
            "count": len(error_list),
            "hours": hours
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@monitoring_bp.route("/errors/summary", methods=["GET"])
@require_admin
def error_summary():
    """Summary of errors by type"""
    try:
        hours = request.args.get("hours", 24, type=int)
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": cutoff},
                    "event_type": {"$in": ["error", "failure", "exception"]}
                }
            },
            {
                "$group": {
                    "_id": "$event_type",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        summary = security_events_col.aggregate(pipeline)
        
        return jsonify({
            "status": "success",
            "summary": list(summary),
            "hours": hours
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# Activity Monitoring
# ============================================================================

@monitoring_bp.route("/activity/recent", methods=["GET"])
@require_admin
def recent_activity():
    """Recent admin and user activity"""
    try:
        limit = request.args.get("limit", 50, type=int)
        
        # Get recent activity
        activity = activity_log_col.find({}).sort("timestamp", -1).limit(limit)
        
        activity_list = []
        for log in activity:
            activity_list.append({
                "id": str(log.get("_id")),
                "action": log.get("action"),
                "admin_id": str(log.get("admin_id")) if log.get("admin_id") else None,
                "details": log.get("details"),
                "timestamp": str(log.get("timestamp"))
            })
        
        return jsonify({
            "status": "success",
            "activity": activity_list,
            "count": len(activity_list)
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@monitoring_bp.route("/activity/summary", methods=["GET"])
@require_admin
def activity_summary():
    """Summary of activity by type"""
    try:
        hours = request.args.get("hours", 24, type=int)
        
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": cutoff}
                }
            },
            {
                "$group": {
                    "_id": "$action",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        summary = activity_log_col.aggregate(pipeline)
        
        return jsonify({
            "status": "success",
            "summary": list(summary),
            "hours": hours
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# Performance Metrics
# ============================================================================

@monitoring_bp.route("/performance/endpoints", methods=["GET"])
@require_admin
def endpoint_performance():
    """Performance metrics for API endpoints"""
    try:
        # This would require Flask middleware to track request times
        # Placeholder implementation
        return jsonify({
            "status": "success",
            "message": "Endpoint performance tracking requires middleware implementation",
            "note": "Implement RequestMetrics middleware in app initialization"
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@monitoring_bp.route("/performance/database", methods=["GET"])
@require_admin
def database_performance():
    """Database performance metrics"""
    try:
        stats = {
            "users_collection": {
                "count": users_col.count_documents({}),
                "indexes": len(users_col.list_indexes())
            },
            "donations_collection": {
                "count": donations_col.count_documents({}),
                "indexes": len(donations_col.list_indexes())
            },
            "coffee_collection": {
                "count": coffee_col.count_documents({}),
                "indexes": len(coffee_col.list_indexes())
            }
        }
        
        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": stats
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# Real-time Status
# ============================================================================

@monitoring_bp.route("/status/current", methods=["GET"])
@require_admin
def current_status():
    """Current system status snapshot"""
    try:
        # Basic health check
        db_healthy = True
        try:
            db.client.admin.command('ping')
        except:
            db_healthy = False
        
        # System resources
        cpu = psutil.cpu_percent(interval=0.5)
        memory = psutil.virtual_memory()
        
        # Determine overall status
        status = "healthy"
        if not db_healthy or cpu > 80 or memory.percent > 85:
            status = "degraded"
        if not db_healthy or cpu > 95 or memory.percent > 95:
            status = "critical"
        
        return jsonify({
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": "healthy" if db_healthy else "unhealthy",
                "cpu": "normal" if cpu < 70 else "elevated" if cpu < 85 else "high",
                "memory": "normal" if memory.percent < 70 else "elevated" if memory.percent < 85 else "high"
            },
            "metrics": {
                "cpu_percent": cpu,
                "memory_percent": memory.percent
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================================
# Alerts & Thresholds
# ============================================================================

@monitoring_bp.route("/alerts", methods=["GET"])
@require_admin
def get_alerts():
    """Get current system alerts"""
    try:
        alerts = []
        
        # CPU check
        cpu = psutil.cpu_percent(interval=1)
        if cpu > 80:
            alerts.append({
                "level": "warning" if cpu < 95 else "critical",
                "message": f"High CPU usage: {cpu}%",
                "metric": "cpu",
                "value": cpu
            })
        
        # Memory check
        memory = psutil.virtual_memory()
        if memory.percent > 80:
            alerts.append({
                "level": "warning" if memory.percent < 95 else "critical",
                "message": f"High memory usage: {memory.percent}%",
                "metric": "memory",
                "value": memory.percent
            })
        
        # Database check
        try:
            db.client.admin.command('ping')
        except:
            alerts.append({
                "level": "critical",
                "message": "Database connection failed",
                "metric": "database",
                "value": 0
            })
        
        # Recent errors
        yesterday = datetime.utcnow() - timedelta(days=1)
        error_count = security_events_col.count_documents({
            "event_type": {"$in": ["error", "exception"]},
            "created_at": {"$gte": yesterday}
        })
        if error_count > 50:
            alerts.append({
                "level": "warning",
                "message": f"High error rate: {error_count} errors in last 24 hours",
                "metric": "error_rate",
                "value": error_count
            })
        
        return jsonify({
            "status": "success",
            "alerts": alerts,
            "alert_count": len(alerts),
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
