import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from loguru import logger
from ..config import settings


class EmailService:
    """Email service for sending transactional emails."""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """Send an email using SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (optional)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            
            # Attach plain text and HTML parts
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, email: str, username: str, full_name: str) -> bool:
        """Send welcome email to new user."""
        subject = "Welcome to PromesaPay!"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Welcome to PromesaPay, {full_name}!</h2>
                    
                    <p>We're excited to have you on board. Your account is now active and ready to use.</p>
                    
                    <h3>What's Next?</h3>
                    <ul>
                        <li><strong>Complete Your Profile:</strong> Add a profile picture, bio, and fundraising goal</li>
                        <li><strong>Share Your Link:</strong> Start sharing your fundraising link with friends</li>
                        <li><strong>Customize Your Page:</strong> Set a fundraising goal amount and title</li>
                    </ul>
                    
                    <p>
                        <a href="{settings.FRONTEND_URL}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                            Go to Dashboard
                        </a>
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #999;">
                        If you have any questions, please don't hesitate to reach out to our support team.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Welcome to PromesaPay, {full_name}!
        
        We're excited to have you on board. Your account is now active and ready to use.
        
        What's Next?
        - Complete Your Profile: Add a profile picture, bio, and fundraising goal
        - Share Your Link: Start sharing your fundraising link with friends
        - Customize Your Page: Set a fundraising goal amount and title
        
        Go to Dashboard: {settings.FRONTEND_URL}
        """
        
        return self.send_email(email, subject, html_content, text_content)
    
    def send_password_reset_email(self, email: str, reset_token: str, full_name: str = None) -> bool:
        """Send password reset email."""
        subject = "Reset Your PromesaPay Password"
        reset_link = f"{settings.frontend_url('reset-password')}?token={reset_token}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    
                    <p>Hi {full_name or 'there'},</p>
                    
                    <p>We received a request to reset your PromesaPay password. Click the button below to reset it:</p>
                    
                    <p style="margin: 30px 0;">
                        <a href="{reset_link}" style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </p>
                    
                    <p style="font-size: 14px; color: #999;">
                        Or copy and paste this link in your browser: <br>
                        <code style="word-break: break-all;">{reset_link}</code>
                    </p>
                    
                    <p style="color: #d32f2f;">
                        <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #999;">
                        If you have any questions, please contact our support team.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request
        
        Hi {full_name or 'there'},
        
        We received a request to reset your PromesaPay password. Visit this link to reset it:
        
        {reset_link}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        """
        
        return self.send_email(email, subject, html_content, text_content)
    
    def send_transaction_confirmation(self, email: str, donor_name: str, amount: float, recipient_name: str, transaction_type: str) -> bool:
        """Send transaction confirmation email."""
        subject = f"Your {transaction_type.title()} Payment Confirmed"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Payment Confirmed! ✓</h2>
                    
                    <p>Hi {donor_name},</p>
                    
                    <p>Your {transaction_type} payment has been successfully processed.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Amount:</strong> ${amount:,.2f}</p>
                        <p><strong>Recipient:</strong> {recipient_name}</p>
                        <p><strong>Transaction Type:</strong> {transaction_type.title()}</p>
                    </div>
                    
                    <p>Thank you for your generosity! Your support makes a difference.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #999;">
                        If you have any questions, please contact our support team.
                    </p>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Payment Confirmed!
        
        Hi {donor_name},
        
        Your {transaction_type} payment has been successfully processed.
        
        Amount: ${amount:,.2f}
        Recipient: {recipient_name}
        Transaction Type: {transaction_type.title()}
        
        Thank you for your generosity!
        """
        
        return self.send_email(email, subject, html_content, text_content)

    def send_recovery_code_email(
        self, email: str, code: str, full_name: str = None, purpose: str = "password_reset"
    ) -> bool:
        """Send numeric recovery code for account recovery or unlock."""
        if purpose == "unlock_account":
            subject = "PromesaPay account unlock code"
            intro = "Use this code to unlock your account:"
        else:
            subject = "PromesaPay password recovery code"
            intro = "Use this code to verify your identity and reset your password:"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Account recovery</h2>
                    <p>Hi {full_name or 'there'},</p>
                    <p>{intro}</p>
                    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{code}</p>
                    <p style="color: #666;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
                </div>
            </body>
        </html>
        """
        text_content = f"{intro}\n\nCode: {code}\n\nExpires in 10 minutes."
        return self.send_email(email, subject, html_content, text_content)


# Singleton instance
email_service = EmailService()

