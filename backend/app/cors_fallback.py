from flask import Blueprint, make_response

cors_fallback_bp = Blueprint("cors_fallback", __name__)

@cors_fallback_bp.route("/api", methods=["OPTIONS"])
def handle_api_options():
    response = make_response("", 200)
    return response

@cors_fallback_bp.route("/api/<path:path>", methods=["OPTIONS"])
def handle_api_options_path(path):
    response = make_response("", 200)
    return response
