# secure_logger.py
import re
import logging
from flask import request
from werkzeug.exceptions import BadRequest

class SecureLogger:
    """Custom logger that redacts sensitive information from logs"""
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the secure logger with the Flask app"""
        # Disable default Werkzeug request logging
        logging.getLogger('werkzeug').setLevel(logging.WARNING)
        
        # Set up custom request logging
        @app.before_request
        def log_request():
            self.log_secure_request()
        
        @app.after_request 
        def log_response(response):
            self.log_secure_response(response)
            return response
    
    def redact_sensitive_data(self, text):
        """Redact sensitive information from text"""
        if not text:
            return text
            
        # Redact email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]', text)
        
        # Redact passwords (in query params or form data)
        text = re.sub(r'password=[^&\s]+', 'password=[REDACTED]', text, flags=re.IGNORECASE)
        
        # Redact OTP codes
        text = re.sub(r'otp=\d+', 'otp=[REDACTED]', text, flags=re.IGNORECASE)
        
        # Redact tokens
        text = re.sub(r'token=[^&\s]+', 'token=[REDACTED]', text, flags=re.IGNORECASE)
        
        return text
    
    def log_secure_request(self):
        """Log request information with sensitive data redacted"""
        try:
            method = request.method
            path = request.path
            
            # Redact sensitive information from query parameters
            query_string = request.query_string.decode('utf-8') if request.query_string else ''
            safe_query = self.redact_sensitive_data(query_string)
            
            # Create safe URL
            if safe_query:
                safe_url = f"{path}?{safe_query}"
            else:
                safe_url = path
            
            # Only log non-sensitive endpoints
            if not any(sensitive in path.lower() for sensitive in ['password', 'otp', 'token']):
                print(f"{request.remote_addr} - {method} {safe_url}")
        
        except Exception as e:
            # Fail silently to avoid breaking the request
            pass
    
    def log_secure_response(self, response):
        """Log response information without sensitive data"""
        try:
            # Only log status codes, not response content
            if hasattr(response, 'status_code') and response.status_code >= 400:
                print(f"Response: {response.status_code}")
        except Exception as e:
            # Fail silently
            pass