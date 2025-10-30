"""
Google OAuth Service Layer

This module provides Google OAuth authentication functionality including:
- Google token validation using google-auth library
- Google user profile data extraction
- Error handling for OAuth flows

Requirements: 1.1, 1.2, 3.1
"""

import logging
from typing import Dict, Optional, Tuple
from google.auth.transport import requests
from google.oauth2 import id_token
import os
import requests as http_requests
from .oauth_errors import (
    OAuthException, OAuthErrorType, InvalidTokenException, 
    ProviderUnavailableException, OAuthErrorHandler
)

logger = logging.getLogger(__name__)

class GoogleOAuthService:
    """Service class for handling Google OAuth authentication"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        if not self.client_id:
            logger.warning("GOOGLE_OAUTH_CLIENT_ID not found in environment variables")
    
    def validate_token(self, token: str) -> Dict:
        """
        Validate Google OAuth token and extract user profile data
        
        Args:
            token (str): Google OAuth ID token
            
        Returns:
            Dict: User profile data
            
        Raises:
            OAuthException: If token validation fails
        """
        try:
            if not self.client_id:
                raise OAuthException(
                    OAuthErrorType.CONFIG_ERROR,
                    details={"provider": "google", "missing_config": ["client_id"]}
                )
            
            # Verify the token with Google
            try:
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    requests.Request(), 
                    self.client_id
                )
            except ValueError as e:
                if "Token expired" in str(e):
                    raise OAuthException(OAuthErrorType.TOKEN_EXPIRED, details={"provider": "google"})
                else:
                    raise InvalidTokenException("google", {"validation_error": str(e)})
            except http_requests.exceptions.RequestException as e:
                raise OAuthErrorHandler.handle_network_error("google", e)
            except Exception as e:
                raise OAuthException(
                    OAuthErrorType.TOKEN_VALIDATION_FAILED,
                    details={"provider": "google", "error": str(e)}
                )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise InvalidTokenException("google", {"reason": "invalid_issuer", "issuer": idinfo['iss']})
            
            # Extract user profile data
            user_profile = {
                'id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False)
            }
            
            logger.info(f"Successfully validated Google token for user: {user_profile['email']}")
            return user_profile
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during Google token validation: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "google"},
                original_error=e
            )
    
    def extract_user_profile(self, token: str) -> Dict:
        """
        Extract user profile data from Google OAuth token
        
        Args:
            token (str): Google OAuth ID token
            
        Returns:
            Dict: User profile data
            
        Raises:
            OAuthException: If token validation fails
        """
        return self.validate_token(token)
    
    def sign_in(self, token: str) -> Dict:
        """
        Complete Google OAuth sign-in process
        
        Args:
            token (str): Google OAuth ID token
            
        Returns:
            Dict: User profile data
            
        Raises:
            OAuthException: If sign-in fails
        """
        try:
            user_profile = self.validate_token(token)
            
            # Ensure email is verified
            if not user_profile.get('email_verified', False):
                raise OAuthException(
                    OAuthErrorType.PROVIDER_ERROR,
                    message="Google account email is not verified. Please verify your email with Google.",
                    details={"provider": "google", "reason": "email_not_verified"}
                )
            
            logger.info(f"Google OAuth sign-in successful for: {user_profile['email']}")
            return user_profile
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Google OAuth sign-in error: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "google"},
                original_error=e
            )

# Global instance for easy import
google_oauth_service = GoogleOAuthService()