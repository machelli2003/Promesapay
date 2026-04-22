from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from authlib.integrations.flask_client import OAuth
from .config import Config

jwt = JWTManager()
oauth = OAuth()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Required for OAuth state/session
    app.secret_key = Config.SECRET_KEY

    CORS(app, resources={r"/api/*": {"origins": Config.FRONTEND_URL}}, supports_credentials=True)
    jwt.init_app(app)
    oauth.init_app(app)

    # Register Google with OAuth
    oauth.register(
        name="google",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

    from .routes.auth import auth_bp
    from .routes.auth_google import google_bp       # <-- new
    from .routes.profile import profile_bp
    from .routes.donations import donations_bp
    from .routes.coffee import coffee_bp
    from .routes.transactions import transactions_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(google_bp, url_prefix="/api/auth")  # <-- new
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(donations_bp, url_prefix="/api/donations")
    app.register_blueprint(coffee_bp, url_prefix="/api/coffee")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")

    return app