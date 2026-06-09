"""Centralized error handling and response formatting."""

from flask import jsonify, current_app, request
from werkzeug.exceptions import HTTPException
import traceback
import logging


class APIError(Exception):
    """Base class for API errors."""

    def __init__(self, message, status_code=400, error_code=None, details=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details
        super().__init__(self.message)


class ValidationError(APIError):
    """Raised when input validation fails."""

    def __init__(self, message, details=None):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR", details=details)


class AuthenticationError(APIError):
    """Raised when authentication fails."""

    def __init__(self, message="Authentication failed"):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR")


class AuthorizationError(APIError):
    """Raised when user lacks permissions."""

    def __init__(self, message="Insufficient permissions"):
        super().__init__(message, status_code=403, error_code="AUTHORIZATION_ERROR")


class NotFoundError(APIError):
    """Raised when resource is not found."""

    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404, error_code="NOT_FOUND")


class ConflictError(APIError):
    """Raised when resource already exists."""

    def __init__(self, message="Resource already exists"):
        super().__init__(message, status_code=409, error_code="CONFLICT")


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message="Rate limit exceeded"):
        super().__init__(message, status_code=429, error_code="RATE_LIMIT_EXCEEDED")


class PaymentError(APIError):
    """Raised when payment processing fails."""

    def __init__(self, message="Payment processing failed"):
        super().__init__(message, status_code=402, error_code="PAYMENT_ERROR")


def register_error_handlers(app):
    """Register error handlers for the Flask app."""

    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle custom API errors."""
        response = {
            "error": error.error_code,
            "message": error.message,
            "status_code": error.status_code
        }
        if error.details:
            response["details"] = error.details

        # Log error details
        logging.warning(f"API Error [{error.status_code}]: {error.error_code} - {error.message}")

        return jsonify(response), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle Werkzeug HTTP exceptions."""
        response = {
            "error": "HTTP_EXCEPTION",
            "message": error.description,
            "status_code": error.code
        }
        logging.warning(f"HTTP Exception [{error.code}]: {error.description}")
        return jsonify(response), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected errors."""
        # Don't expose internal errors in production
        if current_app.config.get("ENV") == "production":
            message = "An unexpected error occurred"
            error_code = "INTERNAL_ERROR"
        else:
            message = str(error)
            error_code = "INTERNAL_ERROR_DEBUG"

        # Log full traceback
        logging.error(f"Unexpected error: {str(error)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        logging.error(f"Request: {request.method} {request.url}")

        response = {
            "error": error_code,
            "message": message,
            "status_code": 500
        }

        return jsonify(response), 500


class RateLimitExceededError(APIError):
    """Raised when rate limit exceeded (application-level)."""

    def __init__(self, message="Rate limit exceeded"):
        super().__init__(message, status_code=429, error_code="RATE_LIMIT_EXCEEDED")


class ExternalServiceError(APIError):
    """Raised when external service fails."""
    
    def __init__(self, service_name, message):
        msg = f"{service_name} service error: {message}"
        super().__init__(msg, status_code=502, error_code="EXTERNAL_SERVICE_ERROR")


def error_response(error):
    """Convert error to JSON response."""
    if isinstance(error, APIError):
        return jsonify({
            "error": error.message,
            "error_code": error.error_code
        }), error.status_code
    
    if isinstance(error, HTTPException):
        return jsonify({
            "error": error.description,
            "error_code": "HTTP_ERROR"
        }), error.code
    
    return jsonify({
        "error": "Internal server error",
        "error_code": "INTERNAL_ERROR"
    }), 500


def register_error_handlers(app):
    """Register error handlers with Flask app."""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        return error_response(error)
    
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return error_response(error)
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        import logging
        logging.error(f"Unhandled exception: {str(error)}", exc_info=True)
        return error_response(error)
