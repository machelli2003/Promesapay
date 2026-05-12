"""Email queue system for reliable email delivery."""

import redis
import json
import threading
import time
from datetime import datetime
from ..config import settings
from ..services.email import email_service
import logging

class EmailQueue:
    """Redis-based email queue for reliable delivery."""

    def __init__(self):
        self.redis_client = None
        self.queue_name = "email_queue"
        self.processing_queue = "email_processing"
        self.worker_thread = None
        self.running = False

        try:
            if settings.REDIS_URL and settings.REDIS_URL != "memory://":
                self.redis_client = redis.from_url(settings.REDIS_URL)
                self.redis_client.ping()  # Test connection
                logging.info("Email queue: Redis connection established")
            else:
                logging.warning("Email queue: Redis not configured, using in-memory fallback")
                # Fallback to in-memory (not persistent)
                self.redis_client = None
        except Exception as e:
            logging.error(f"Email queue: Failed to connect to Redis: {str(e)}")
            self.redis_client = None

    def enqueue_email(self, email_data):
        """Add email to queue for processing."""
        try:
            email_data['queued_at'] = datetime.utcnow().isoformat()
            email_data['attempts'] = 0

            if self.redis_client:
                self.redis_client.lpush(self.queue_name, json.dumps(email_data))
                logging.info(f"Email queued: {email_data.get('subject', 'No subject')}")
                return True
            else:
                # Fallback: send immediately
                logging.warning("Redis unavailable, sending email immediately")
                return self._send_email_immediately(email_data)
        except Exception as e:
            logging.error(f"Failed to queue email: {str(e)}")
            return False

    def start_worker(self):
        """Start the email processing worker thread."""
        if self.worker_thread and self.worker_thread.is_alive():
            logging.warning("Email worker already running")
            return

        self.running = True
        self.worker_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.worker_thread.start()
        logging.info("Email queue worker started")

    def stop_worker(self):
        """Stop the email processing worker."""
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        logging.info("Email queue worker stopped")

    def _process_queue(self):
        """Process emails from the queue."""
        while self.running:
            try:
                if not self.redis_client:
                    time.sleep(5)  # Wait before checking again
                    continue

                # Get next email from queue
                email_json = self.redis_client.brpoplpush(self.queue_name, self.processing_queue, timeout=5)
                if not email_json:
                    continue

                email_data = json.loads(email_json)

                # Send email
                success = self._send_email_immediately(email_data)

                if success:
                    # Remove from processing queue
                    self.redis_client.lrem(self.processing_queue, 1, email_json)
                    logging.info(f"Email sent successfully: {email_data.get('subject')}")
                else:
                    # Handle failure
                    self._handle_send_failure(email_data, email_json)

            except Exception as e:
                logging.error(f"Email queue processing error: {str(e)}")
                time.sleep(1)  # Brief pause on error

    def _send_email_immediately(self, email_data):
        """Send email immediately (used for Redis fallback or direct sending)."""
        try:
            email_type = email_data.get('type')

            if email_type == 'welcome':
                return email_service.send_welcome_email(
                    email_data['to_email'],
                    email_data['username']
                )
            elif email_type == 'password_reset':
                return email_service.send_password_reset_email(
                    email_data['to_email'],
                    email_data['reset_token']
                )
            elif email_type == 'donation_notification':
                return email_service.send_donation_notification(
                    email_data['to_email'],
                    email_data['donor_name'],
                    email_data['amount']
                )
            else:
                logging.error(f"Unknown email type: {email_type}")
                return False

        except Exception as e:
            logging.error(f"Failed to send email: {str(e)}")
            return False

    def _handle_send_failure(self, email_data, email_json):
        """Handle email sending failure."""
        email_data['attempts'] = email_data.get('attempts', 0) + 1
        email_data['last_attempt'] = datetime.utcnow().isoformat()

        if email_data['attempts'] >= 3:
            # Move to dead letter queue after 3 attempts
            logging.error(f"Email failed permanently after 3 attempts: {email_data.get('subject')}")
            self.redis_client.lrem(self.processing_queue, 1, email_json)
            # Could add to dead letter queue here
        else:
            # Re-queue for retry
            logging.warning(f"Email failed, retrying (attempt {email_data['attempts']}): {email_data.get('subject')}")
            self.redis_client.lpush(self.queue_name, json.dumps(email_data))
            self.redis_client.lrem(self.processing_queue, 1, email_json)

# Global email queue instance
email_queue = EmailQueue()