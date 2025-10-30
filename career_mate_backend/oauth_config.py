"""
OAuth Configuration for Backend

This module contains OAuth provider configurations and settings for the backend API.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class OAuthConfig:
    """OAuth configuration class containing provider settings"""
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'aicarrermateapp://oauth')
    
    # GitHub OAuth Configuration
    GITHUB_CLIENT_ID = os.getenv('GITHUB_OAUTH_CLIENT_ID')
    GITHUB_CLIENT_SECRET = os.getenv('GITHUB_OAUTH_CLIENT_SECRET')
    GITHUB_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'aicarrermateapp://oauth')
    
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
    
    @classmethod
    def validate_config(cls):
        """Validate that all required OAuth configuration is present"""
        errors = []
        
        if not cls.GOOGLE_CLIENT_ID:
            errors.append('GOOGLE_OAUTH_CLIENT_ID environment variable is not set')
        
        if not cls.GOOGLE_CLIENT_SECRET:
            errors.append('GOOGLE_OAUTH_CLIENT_SECRET environment variable is not set')
            
        if not cls.GITHUB_CLIENT_ID:
            errors.append('GITHUB_OAUTH_CLIENT_ID environment variable is not set')
            
        if not cls.GITHUB_CLIENT_SECRET:
            errors.append('GITHUB_OAUTH_CLIENT_SECRET environment variable is not set')
        
        return errors
    
    @classmethod
    def is_configured(cls):
        """Check if OAuth is properly configured"""
        return len(cls.validate_config()) == 0