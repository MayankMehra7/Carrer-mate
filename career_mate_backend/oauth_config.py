"""
OAuth Configuration for Backend

This module contains OAuth provider configurations and settings for the backend API.
"""

import os
import logging
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the directory of this file (career_mate_backend)
current_dir = Path(__file__).parent
env_path = current_dir / '.env'

# Load environment variables from the backend .env file
load_dotenv(env_path)

class OAuthConfig:
    """OAuth configuration class containing provider settings"""
    
    def __init__(self):
        """Initialize OAuth configuration with environment variable loading"""
        self._load_oauth_config()
    
    def _load_oauth_config(self):
        """Load OAuth configuration from environment variables with validation"""
        # Google OAuth Configuration
        self.GOOGLE_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        self.GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
        self.GOOGLE_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'aicarrermateapp://oauth')
        
        # GitHub OAuth Configuration
        self.GITHUB_CLIENT_ID = os.getenv('GITHUB_OAUTH_CLIENT_ID')
        self.GITHUB_CLIENT_SECRET = os.getenv('GITHUB_OAUTH_CLIENT_SECRET')
        self.GITHUB_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'aicarrermateapp://oauth')
        
        # Log configuration status
        self._log_configuration_status()
    
    def _log_configuration_status(self):
        """Log the OAuth configuration status for debugging"""
        google_status = self.get_google_status()
        github_status = self.get_github_status()
        
        if google_status['configured']:
            logger.info("Google OAuth: Configured successfully")
        else:
            logger.warning(f"Google OAuth: Not configured - Client ID: {google_status['client_id_set']}, Client Secret: {google_status['client_secret_set']}")
        
        if github_status['configured']:
            logger.info("GitHub OAuth: Configured successfully")
        else:
            logger.warning(f"GitHub OAuth: Not configured - Client ID: {github_status['client_id_set']}, Client Secret: {github_status['client_secret_set']}")
    
    # OAuth Scopes
    GOOGLE_SCOPES = ['openid', 'email', 'profile']
    GITHUB_SCOPES = ['user:email', 'read:user']
    
    # OAuth URLs
    GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
    GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
    
    GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
    GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
    GITHUB_API_URL = 'https://api.github.com'
    
    def validate_credentials_format(self, client_id, client_secret, provider_name):
        """Validate OAuth credential format"""
        errors = []
        
        if client_id:
            if provider_name == 'google' and not client_id.endswith('.apps.googleusercontent.com'):
                errors.append(f"{provider_name} client ID format appears invalid")
            elif provider_name == 'github' and not client_id.startswith('Ov'):
                errors.append(f"{provider_name} client ID format appears invalid")
        
        if client_secret:
            if provider_name == 'google' and not client_secret.startswith('GOCSPX-'):
                errors.append(f"{provider_name} client secret format appears invalid")
            elif provider_name == 'github' and len(client_secret) != 40:
                errors.append(f"{provider_name} client secret format appears invalid")
        
        return errors
    
    def validate_config(self):
        """Validate that all required OAuth configuration is present and properly formatted"""
        google_configured = self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET
        github_configured = self.GITHUB_CLIENT_ID and self.GITHUB_CLIENT_SECRET
        
        # Validate credential formats
        validation_errors = []
        if google_configured:
            validation_errors.extend(self.validate_credentials_format(
                self.GOOGLE_CLIENT_ID, self.GOOGLE_CLIENT_SECRET, 'google'
            ))
        if github_configured:
            validation_errors.extend(self.validate_credentials_format(
                self.GITHUB_CLIENT_ID, self.GITHUB_CLIENT_SECRET, 'github'
            ))
        
        if validation_errors:
            for error in validation_errors:
                logger.error(f"OAuth validation error: {error}")
        
        return (google_configured or github_configured) and len(validation_errors) == 0
    
    def is_configured(self):
        """Check if OAuth is properly configured"""
        return self.validate_config()
    
    def get_google_status(self):
        """Get Google OAuth configuration status"""
        return {
            "configured": bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET),
            "client_id_set": bool(self.GOOGLE_CLIENT_ID),
            "client_secret_set": bool(self.GOOGLE_CLIENT_SECRET),
        }
    
    def get_github_status(self):
        """Get GitHub OAuth configuration status"""
        return {
            "configured": bool(self.GITHUB_CLIENT_ID and self.GITHUB_CLIENT_SECRET),
            "client_id_set": bool(self.GITHUB_CLIENT_ID),
            "client_secret_set": bool(self.GITHUB_CLIENT_SECRET),
        }

    def get_provider_status(self):
        """Returns the configuration status of each OAuth provider."""
        return {
            "google": self.get_google_status(),
            "github": self.get_github_status()
        }
    
    def get_missing_credentials(self):
        """Get list of missing OAuth credentials"""
        missing = []
        
        if not self.GOOGLE_CLIENT_ID:
            missing.append("GOOGLE_OAUTH_CLIENT_ID")
        if not self.GOOGLE_CLIENT_SECRET:
            missing.append("GOOGLE_OAUTH_CLIENT_SECRET")
        if not self.GITHUB_CLIENT_ID:
            missing.append("GITHUB_OAUTH_CLIENT_ID")
        if not self.GITHUB_CLIENT_SECRET:
            missing.append("GITHUB_OAUTH_CLIENT_SECRET")
        
        return missing


# Create a singleton instance
oauth_config = OAuthConfig()