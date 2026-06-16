from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from authlib.integrations.flask_client import OAuth
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_session import Session
import redis
import os
from loguru import logger
from urllib.parse import urlparse
from .config import settings
from .errors import register_error_handlers
from .csrf import get_csrf_token, validate_csrf_token

# Redis client for caching
redis_client = None
redis_available = False

jwt = JWTManager()
oauth = OAuth()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app(test_config=None):
    app = Flask(__name__)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    frontend_dist = os.path.join(project_root, "frontend", "dist")

    if test_config is not None:
        app.config.update(test_config)

    # Configure structured logging
    os.makedirs("logs", exist_ok=True)
    logger.remove()
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="1 week",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"
    )

    app.config.setdefault("SECRET_KEY", settings.SECRET_KEY)
    app.config.setdefault("JWT_SECRET_KEY", settings.JWT_SECRET_KEY)
    app.config.setdefault("JWT_ACCESS_TOKEN_EXPIRES", settings.JWT_ACCESS_TOKEN_EXPIRES)
    app.config.setdefault("CORS_HEADERS", "Content-Type")
    app.config.setdefault("PROPAGATE_EXCEPTIONS", True)
    app.config["RATELIMIT_STORAGE_URI"] = settings.RATELIMIT_STORAGE_URL
    app.config["RATELIMIT_ENABLED"] = not app.config.get("TESTING", False)
    app.config["SESSION_COOKIE_SECURE"] = settings.SESSION_COOKIE_SECURE
    app.config["SESSION_COOKIE_HTTPONLY"] = settings.SESSION_COOKIE_HTTPONLY
    app.config["SESSION_COOKIE_SAMESITE"] = settings.SESSION_COOKIE_SAMESITE

    frontend_url = str(settings.FRONTEND_URL)
    secure_cookie = urlparse(frontend_url).scheme == "https"

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "None" if secure_cookie else "Lax"
    app.config["SESSION_COOKIE_SECURE"] = secure_cookie

    # Required for OAuth state/session
    app.secret_key = app.config["SECRET_KEY"]

    @app.before_request
    def set_csrf_token():
        get_csrf_token()

    @app.before_request
    def enforce_csrf():
        validate_csrf_token()

    app.config["SESSION_TYPE"] = "redis" if redis_available else "filesystem"
    app.config["SESSION_REDIS"] = redis_client if redis_available else None
    app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = 86400  # 1 day

    CORS(app, resources={r"/api/*": {"origins": settings.CORS_ORIGINS.split(',') if settings.CORS_ORIGINS else [str(settings.FRONTEND_URL)]}}, supports_credentials=True)
    limiter.init_app(app)
    jwt.init_app(app)
    oauth.init_app(app)
    Session(app)

    force_https = False if app.config.get("TESTING", False) else not app.debug
    Talisman(app, content_security_policy=None, force_https=force_https)
    register_error_handlers(app)

    from flask_limiter.errors import RateLimitExceeded

    @app.errorhandler(RateLimitExceeded)
    def handle_flask_limiter(e):
        return jsonify({
            "error": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please try again later.",
            "status_code": 429,
        }), 429

    from .routes.auth import auth_bp
    from .routes.profile import profile_bp
    from .routes.donations import donations_bp
    from .routes.coffee import coffee_bp
    from .routes.transactions import transactions_bp
    from .routes.webhook import webhook_bp
    from .routes.wallet import wallet_bp
    from .routes.analytics import analytics_bp
    from .routes.campaigns import campaigns_bp
    from .routes.payouts import bp as payouts_bp
    from .routes.payment_methods import bp as payment_methods_bp
    from .routes.refunds import bp as refunds_bp
    from .routes.receipts import bp as receipts_bp
    from .routes.admin_finance import bp as admin_finance_bp
    from .routes.admin_payouts import bp as admin_payouts_bp
    from .routes.auth_security import security_bp
    from .routes.admin import admin_bp
    from .routes.disputes import disputes_bp, admin_disputes_bp
    from .routes.monitoring import monitoring_bp
    from .routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(security_bp, url_prefix="/api/auth")

    if not app.config.get("TESTING", False) and settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        oauth.register(
            name="google",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
            redirect_uri=settings.GOOGLE_CALLBACK_URL,
        )
        from .routes.auth_google import google_bp
        app.register_blueprint(google_bp, url_prefix="/api/auth")

    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(donations_bp, url_prefix="/api/donations")
    app.register_blueprint(coffee_bp, url_prefix="/api/coffee")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
    app.register_blueprint(webhook_bp, url_prefix="/api/webhook")
    app.register_blueprint(wallet_bp, url_prefix="/api/wallet")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(campaigns_bp, url_prefix="/api/campaigns")
    app.register_blueprint(payouts_bp)
    app.register_blueprint(payment_methods_bp)
    app.register_blueprint(refunds_bp)
    app.register_blueprint(receipts_bp)
    app.register_blueprint(admin_finance_bp)
    app.register_blueprint(admin_payouts_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(disputes_bp)
    app.register_blueprint(admin_disputes_bp)
    app.register_blueprint(monitoring_bp)
    app.register_blueprint(notifications_bp)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path == "api" or path.startswith("api/"):
            return jsonify({"error": "Not Found"}), 404

        asset_path = os.path.join(frontend_dist, path)
        if path and os.path.isfile(asset_path):
            return send_from_directory(frontend_dist, path)

        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            return send_from_directory(frontend_dist, "index.html")

        return jsonify({"error": "Frontend build not found"}), 404

    return app