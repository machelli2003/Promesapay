"""
Logging Configuration for PromesaPay
Provides structured logging with rotation and multiple handlers
"""

import sys
import os
from pathlib import Path
from loguru import logger as loguru_logger


def setup_logging(app=None, log_level="INFO", log_dir="logs"):
    """
    Configure logging for the application
    
    Args:
        app: Flask app instance (optional)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory to store log files
    
    Usage:
        from app.logging_config import setup_logging
        setup_logging(app, log_level="DEBUG")
    """
    
    # Create logs directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    # Remove default loguru handler
    loguru_logger.remove()
    
    # Console handler (stdout)
    loguru_logger.add(
        sys.stdout,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True,
        backtrace=True,
        diagnose=True,
    )
    
    # File handler (rotating)
    loguru_logger.add(
        log_path / "app.log",
        level=log_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="500 MB",  # Rotate every 500MB
        retention="7 days",  # Keep logs for 7 days
        compression="zip",  # Compress old logs
        backtrace=True,
        diagnose=True,
    )
    
    # Error file handler (separate error logs)
    loguru_logger.add(
        log_path / "error.log",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="500 MB",
        retention="30 days",  # Keep error logs longer
        compression="zip",
        backtrace=True,
        diagnose=True,
    )
    
    # Security events (separate file for audit trail)
    loguru_logger.add(
        log_path / "security.log",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}",
        rotation="1 GB",
        retention="90 days",
        compression="zip",
        filter=lambda record: "security" in record["extra"],
    )
    
    # Flask integration (optional)
    if app:
        # Suppress Flask's default logger
        app.logger.handlers.clear()
        
        # Redirect Flask logs to loguru
        class LoguruHandler:
            def handle(self, record):
                level = record.levelname
                msg = record.getMessage()
                loguru_logger.log(level, f"[Flask] {msg}")
        
        app.logger.addHandler(LoguruHandler())
        app.logger.setLevel(log_level)
    
    return loguru_logger


# Log templates for common operations
class LogTemplates:
    """Common log message templates"""
    
    @staticmethod
    def auth_success(user_id, method="password"):
        return f"Authentication successful | user_id={user_id} | method={method}"
    
    @staticmethod
    def auth_failure(email, reason):
        return f"Authentication failed | email={email} | reason={reason}"
    
    @staticmethod
    def security_event(event_type, user_id, details=""):
        extra = {"security": True}
        return f"SECURITY | event_type={event_type} | user_id={user_id} | {details}"
    
    @staticmethod
    def api_error(endpoint, status_code, error_msg):
        return f"API Error | endpoint={endpoint} | status={status_code} | error={error_msg}"
    
    @staticmethod
    def db_operation(operation, collection, affected_rows, duration_ms):
        return f"DB {operation} | collection={collection} | rows={affected_rows} | {duration_ms}ms"
    
    @staticmethod
    def external_api_call(service, endpoint, status_code, duration_ms):
        return f"External API | service={service} | endpoint={endpoint} | status={status_code} | {duration_ms}ms"


# Context managers for structured logging
class log_context:
    """Context manager for logging with additional context"""
    
    def __init__(self, operation_name, **context):
        self.operation = operation_name
        self.context = context
        self.logger = loguru_logger.bind(**context)
    
    def __enter__(self):
        self.logger.debug(f"Starting: {self.operation}")
        return self.logger
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.logger.error(
                f"Failed: {self.operation} | error={exc_val}",
                exc_info=(exc_type, exc_val, exc_tb)
            )
        else:
            self.logger.debug(f"Completed: {self.operation}")
