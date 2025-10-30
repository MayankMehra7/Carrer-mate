"""
GitHub OAuth Service Layer

This module provides GitHub OAuth authentication functionality including:
- GitHub authorization code to access token exchange
- GitHub user profile data extraction using PyGithub
- Error handling for OAuth flows

Requirements: 2.1, 2.2, 2.3
"""

import logging
import requests
from typing import Dict, Optional, Tuple
from github import Github, GithubException
import os
from .oauth_errors import (
    OAuthException, OAuthErrorType, InvalidTokenException, 
    ProviderUnavailableException, OAuthErrorHandler
)

logger = logging.getLogger(__name__)

class GitHubOAuthService:
    """Service class for handling GitHub OAuth authentication"""
    
    def __init__(self):
        self.client_id = os.getenv('GITHUB_OAUTH_CLIENT_ID')
        self.client_secret = os.getenv('GITHUB_OAUTH_CLIENT_SECRET')
        self.token_url = 'https://github.com/login/oauth/access_token'
        
        if not self.client_id or not self.client_secret:
            logger.warning("GitHub OAuth credentials not found in environment variables")
    
    def exchange_code_for_token(self, code: str) -> str:
        """
        Exchange GitHub authorization code for access token
        
        Args:
            code (str): GitHub authorization code
            
        Returns:
            str: GitHub access token
            
        Raises:
            OAuthException: If token exchange fails
        """
        try:
            if not self.client_id or not self.client_secret:
                raise OAuthException(
                    OAuthErrorType.CONFIG_ERROR,
                    details={"provider": "github", "missing_config": ["client_id", "client_secret"]}
                )
            
            # Prepare token exchange request
            data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': code
            }
            
            headers = {
                'Accept': 'application/json',
                'User-Agent': 'CareerMate-App'
            }
            
            # Exchange code for token
            try:
                response = requests.post(self.token_url, data=data, headers=headers, timeout=10)
                response.raise_for_status()
            except requests.exceptions.Timeout as e:
                raise OAuthErrorHandler.handle_timeout_error("github", e)
            except requests.exceptions.RequestException as e:
                raise OAuthErrorHandler.handle_network_error("github", e)
            
            token_data = response.json()
            
            if 'error' in token_data:
                error_code = token_data.get('error', '')
                error_description = token_data.get('error_description', '')
                raise OAuthErrorHandler.handle_provider_error("github", token_data)
            
            access_token = token_data.get('access_token')
            if not access_token:
                raise OAuthException(
                    OAuthErrorType.PROVIDER_ERROR,
                    message="No access token received from GitHub",
                    details={"provider": "github", "response": token_data}
                )
            
            logger.info("Successfully exchanged GitHub code for access token")
            return access_token
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during GitHub token exchange: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "github"},
                original_error=e
            )
    
    def validate_token_and_get_profile(self, access_token: str) -> Dict:
        """
        Validate GitHub access token and extract user profile data using PyGithub
        
        Args:
            access_token (str): GitHub access token
            
        Returns:
            Dict: User profile data
            
        Raises:
            OAuthException: If token validation fails
        """
        try:
            # Create GitHub client with access token
            github_client = Github(access_token)
            
            # Get authenticated user
            try:
                user = github_client.get_user()
            except GithubException as e:
                if e.status == 401:
                    raise InvalidTokenException("github", {"reason": "unauthorized", "status": e.status})
                elif e.status == 403:
                    raise OAuthException(
                        OAuthErrorType.PROVIDER_ERROR,
                        message="GitHub API rate limit exceeded or access forbidden",
                        details={"provider": "github", "status": e.status}
                    )
                elif e.status >= 500:
                    raise ProviderUnavailableException("github", {"status": e.status, "message": str(e)})
                else:
                    raise OAuthException(
                        OAuthErrorType.PROVIDER_ERROR,
                        details={"provider": "github", "status": e.status, "error": str(e)}
                    )
            except requests.exceptions.RequestException as e:
                raise OAuthErrorHandler.handle_network_error("github", e)
            
            # Extract user profile data
            user_profile = {
                'id': user.id,
                'username': user.login,
                'email': user.email,
                'name': user.name or user.login,
                'avatar_url': user.avatar_url,
                'bio': user.bio,
                'company': user.company,
                'location': user.location,
                'public_repos': user.public_repos,
                'followers': user.followers,
                'following': user.following
            }
            
            # If primary email is not public, try to get it from user emails
            if not user_profile['email']:
                try:
                    emails = user.get_emails()
                    primary_email = next((email.email for email in emails if email.primary), None)
                    user_profile['email'] = primary_email
                except GithubException:
                    logger.warning("Could not fetch user emails - may need additional permissions")
                    # This is not a critical error, continue without email
            
            logger.info(f"Successfully validated GitHub token for user: {user_profile['username']}")
            return user_profile
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during GitHub profile extraction: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "github"},
                original_error=e
            )
    
    def sign_in_with_code(self, code: str) -> Dict:
        """
        Complete GitHub OAuth sign-in process using authorization code
        
        Args:
            code (str): GitHub authorization code
            
        Returns:
            Dict: User profile data with access token
            
        Raises:
            OAuthException: If sign-in fails
        """
        try:
            # Step 1: Exchange code for access token
            access_token = self.exchange_code_for_token(code)
            
            # Step 2: Validate token and get user profile
            user_profile = self.validate_token_and_get_profile(access_token)
            
            # Add access token to profile for session management
            user_profile['access_token'] = access_token
            
            logger.info(f"GitHub OAuth sign-in successful for: {user_profile['username']}")
            return user_profile
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"GitHub OAuth sign-in error: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "github"},
                original_error=e
            )
    
    def validate_token(self, access_token: str) -> Dict:
        """
        Validate GitHub access token (alias for validate_token_and_get_profile)
        
        Args:
            access_token (str): GitHub access token
            
        Returns:
            Dict: User profile data
            
        Raises:
            OAuthException: If token validation fails
        """
        return self.validate_token_and_get_profile(access_token)
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """
        Generate GitHub OAuth authorization URL
        
        Args:
            state (Optional[str]): Optional state parameter for CSRF protection
            
        Returns:
            str: GitHub authorization URL
        """
        if not self.client_id:
            logger.error("GitHub client ID not configured")
            return ""
        
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            'client_id': self.client_id,
            'scope': 'user:email read:user',
            'redirect_uri': os.getenv('OAUTH_REDIRECT_URI', 'aicarrermateapp://oauth')
        }
        
        if state:
            params['state'] = state
        
        # Build URL with parameters
        param_string = '&'.join([f"{key}={value}" for key, value in params.items()])
        return f"{base_url}?{param_string}"

# Global instance for easy import
github_oauth_service = GitHubOAuthService()