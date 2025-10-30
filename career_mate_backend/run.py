# run.py
from flask import Flask
from flask_session import Session
from config import mail, MAIL_USERNAME, MAIL_PASSWORD
from config import MAIL_USERNAME as mail_user  # just for safety
import config
from routes import bp as api_bp
from routes_oauth_management import register_oauth_management_routes
from flask_mail import Mail
from secure_logger import SecureLogger
import os

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET", "change_me")
    
    # Disable default request logging to prevent sensitive data exposure
    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    
    # Custom request logging filter to mask sensitive data
    class SensitiveDataFilter(logging.Filter):
        def filter(self, record):
            if hasattr(record, 'getMessage'):
                message = record.getMessage()
                # Mask email addresses in logs
                import re
                message = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '***@***.***', message)
                record.msg = message
            return True
    
    # Apply filter to all loggers
    for logger_name in ['werkzeug', 'flask.app']:
        logger = logging.getLogger(logger_name)
        logger.addFilter(SensitiveDataFilter())
    # Flask-Mail config
    app.config.update(
        MAIL_SERVER="smtp.gmail.com",
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    )

    # Session (server-side storage using filesystem)
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PERMANENT"] = False
    Session(app)

    # init mail
    mail.init_app(app)
    
    # Initialize secure logging
    secure_logger = SecureLogger()
    secure_logger.init_app(app)

    # Enable CORS if frontend on different origin
    from flask_cors import CORS
    CORS(app, 
         supports_credentials=True,
         origins=["http://localhost:8081", "http://localhost:8082", "http://127.0.0.1:8081", "http://127.0.0.1:8082"],
         allow_headers=["Content-Type", "Authorization", "X-Session-Token"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # register routes
    app.register_blueprint(api_bp, url_prefix="/api")
    
    # register OAuth management routes
    register_oauth_management_routes(app)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
