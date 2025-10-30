"""
OAuth Token Validation Service

This module provides secure token validation with OAuth providers including:
- Real-time token validation with provider APIs
- Token introspection and verification
- Provider-specific validation logic

Requirements: 3.1, 3.2, 3.3
"""

import logging
import requests
from typing import Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
import json
from .oauth_errors import (
    OAuthException, OAuthErrorType, InvalidTokenException,
    ProviderUnavailableException, OAuthErrorHandler
)
from .oauth_token_security import token_security_manager

logger = logging.getLogger(__name__)

class OAuthTokenValidator:
    """Service for validating OAuth tokens with providers"""
    
    def __init__(self):
        self.google_tokeninfo_url = "https://oauth2.googleapis.com/tokeninfo"
        self.github_api_url = "https://api.github.com"
        self.validation_cache = {}  # Simple in-memory cache
        self.cache_ttl = 300  # 5 minutes cache TTL
    
    def validate_google_token(self, access_token: str) -> Dict[str, Any]:
        """
        Validate Google OAuth access token with Google's tokeninfo endpoint
        
        Args:
            access_token (str): Google OAuth access token
            
        Returns:
            Dict: Token validation result with user info
            
        Raises:
            OAuthException: If validation fails
        """
        try:
            # Check cache first
            cache_key = f"google:{token_security_manager.hash_token(access_token, 'google')[:16]}"
            cached_result = self._get_cached_validation(cache_key)
            if cached_result:
                logger.debug("Using cached Google token validation")
                return cached_result
            
            # Validate with Google
            params = {'access_token': access_token}
            
            try:
                response = requests.get(
                    self.google_tokeninfo_url,
                    params=params,
                    timeout=10,
                    headers={'User-Agent': 'CareerMate-OAuth-Validator/1.0'}
                )
                response.raise_for_status()
            except requests.exceptions.Timeout as e:
                raise OAuthErrorHandler.handle_timeout_error("google", e)
            except requests.exceptions.RequestException as e:
                if response.status_code == 400:
                    raise InvalidTokenException("google", {"reason": "invalid_token"})
                elif response.status_code >= 500:
                    raise ProviderUnavailableException("google", {"status": response.status_code})
                else:
                    raise OAuthErrorHandler.handle_network_error("google", e)
            
            token_info = response.json()
            
            # Check for error in response
            if 'error' in token_info:
                error_description = token_info.get('error_description', 'Token validation failed')
                raise InvalidTokenException("google", {
                    "error": token_info['error'],
                    "description": error_description
                })
            
            # Validate required fields
            required_fields = ['sub', 'email', 'exp']
            for field in required_fields:
                if field not in token_info:
                    raise OAuthException(
                        OAuthErrorType.PROVIDER_ERROR,
                        message=f"Missing required field in token info: {field}",
                        details={"provider": "google", "missing_field": field}
                    )
            
            # Check token expiration
            exp_timestamp = int(token_info['exp'])
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            if datetime.utcnow() >= exp_datetime:
                raise OAuthException(
                    OAuthErrorType.TOKEN_EXPIRED,
                    details={"provider": "google", "expired_at": exp_datetime.isoformat()}
                )
            
            # Prepare validation result
            validation_result = {
                'valid': True,
                'user_id': token_info['sub'],
                'email': token_info['email'],
                'name': token_info.get('name', ''),
                'picture': token_info.get('picture', ''),
                'email_verified': token_info.get('email_verified', 'false').lower() == 'true',
                'expires_at': exp_datetime,
                'scopes': token_info.get('scope', '').split(),
                'validated_at': datetime.utcnow()
            }
            
            # Cache the result
            self._cache_validation(cache_key, validation_result)
            
            logger.info(f"Google token validated successfully for user: {validation_result['email']}")
            return validation_result
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during Google token validation: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "google"},
                original_error=e
            )
    
    def validate_github_token(self, access_token: str) -> Dict[str, Any]:
        """
        Validate GitHub OAuth access token with GitHub API
        
        Args:
            access_token (str): GitHub OAuth access token
            
        Returns:
            Dict: Token validation result with user info
            
        Raises:
            OAuthException: If validation fails
        """
        try:
            # Check cache first
            cache_key = f"github:{token_security_manager.hash_token(access_token, 'github')[:16]}"
            cached_result = self._get_cached_validation(cache_key)
            if cached_result:
                logger.debug("Using cached GitHub token validation")
                return cached_result
            
            # Validate with GitHub API
            headers = {
                'Authorization': f'token {access_token}',
                'User-Agent': 'CareerMate-OAuth-Validator/1.0',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            try:
                # Get user info
                user_response = requests.get(
                    f"{self.github_api_url}/user",
                    headers=headers,
                    timeout=10
                )
                user_response.raise_for_status()
                
                # Get token info
                token_response = requests.get(
                    f"{self.github_api_url}/applications/{self._get_github_client_id()}/token",
                    headers=headers,
                    timeout=10
                )
                # Token endpoint might not be accessible, continue without it
                
            except requests.exceptions.Timeout as e:
                raise OAuthErrorHandler.handle_timeout_error("github", e)
            except requests.exceptions.RequestException as e:
                if user_response.status_code == 401:
                    raise InvalidTokenException("github", {"reason": "unauthorized"})
                elif user_response.status_code == 403:
                    raise OAuthException(
                        OAuthErrorType.PROVIDER_ERROR,
                        message="GitHub API rate limit exceeded or access forbidden",
                        details={"provider": "github", "status": user_response.status_code}
                    )
                elif user_response.status_code >= 500:
                    raise ProviderUnavailableException("github", {"status": user_response.status_code})
                else:
                    raise OAuthErrorHandler.handle_network_error("github", e)
            
            user_info = user_response.json()
            
            # Check for error in response
            if 'message' in user_info and user_response.status_code >= 400:
                raise InvalidTokenException("github", {
                    "error": user_info.get('message', 'Token validation failed'),
                    "status": user_response.status_code
                })
            
            # Validate required fields
            required_fields = ['id', 'login']
            for field in required_fields:
                if field not in user_info:
                    raise OAuthException(
                        OAuthErrorType.PROVIDER_ERROR,
                        message=f"Missing required field in user info: {field}",
                        details={"provider": "github", "missing_field": field}
                    )
            
            # Get user emails if available
            email = user_info.get('email')
            if not email:
                try:
                    emails_response = requests.get(
                        f"{self.github_api_url}/user/emails",
                        headers=headers,
                        timeout=10
                    )
                    if emails_response.status_code == 200:
                        emails = emails_response.json()
                        primary_email = next((e['email'] for e in emails if e.get('primary')), None)
                        if primary_email:
                            email = primary_email
                except:
                    pass  # Continue without email if not accessible
            
            # Prepare validation result
            validation_result = {
                'valid': True,
                'user_id': user_info['id'],
                'username': user_info['login'],
                'email': email,
                'name': user_info.get('name') or user_info['login'],
                'avatar_url': user_info.get('avatar_url', ''),
                'bio': user_info.get('bio'),
                'company': user_info.get('company'),
                'location': user_info.get('location'),
                'public_repos': user_info.get('public_repos', 0),
                'followers': user_info.get('followers', 0),
                'following': user_info.get('following', 0),
                'validated_at': datetime.utcnow()
            }
            
            # Cache the result
            self._cache_validation(cache_key, validation_result)
            
            logger.info(f"GitHub token validated successfully for user: {validation_result['username']}")
            return validation_result
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during GitHub token validation: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": "github"},
                original_error=e
            )
    
    def validate_token(self, provider: str, access_token: str) -> Dict[str, Any]:
        """
        Validate OAuth token for any supported provider
        
        Args:
            provider (str): OAuth provider name
            access_token (str): OAuth access token
            
        Returns:
            Dict: Token validation result
            
        Raises:
            OAuthException: If validation fails
        """
        try:
            OAuthErrorHandler.validate_provider(provider)
            
            if provider == "google":
                return self.validate_google_token(access_token)
            elif provider == "github":
                return self.validate_github_token(access_token)
            else:
                raise OAuthException(
                    OAuthErrorType.INVALID_PROVIDER,
                    details={"provider": provider}
                )
                
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during token validation: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={"provider": provider},
                original_error=e
            )
    
    def introspect_token(self, provider: str, access_token: str) -> Dict[str, Any]:
        """
        Perform detailed token introspection
        
        Args:
            provider (str): OAuth provider name
            access_token (str): OAuth access token
            
        Returns:
            Dict: Detailed token information
        """
        try:
            validation_result = self.validate_token(provider, access_token)
            
            # Add introspection metadata
            introspection_result = {
                **validation_result,
                'introspected_at': datetime.utcnow(),
                'token_type': 'Bearer',
                'active': validation_result.get('valid', False)
            }
            
            # Add provider-specific metadata
            if provider == "google":
                introspection_result['issuer'] = 'https://accounts.google.com'
            elif provider == "github":
                introspection_result['issuer'] = 'https://github.com'
            
            return introspection_result
            
        except Exception as e:
            logger.error(f"Error during token introspection: {str(e)}")
            return {
                'active': False,
                'error': str(e),
                'introspected_at': datetime.utcnow()
            }
    
    def _get_cached_validation(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached validation result if still valid"""
        try:
            if cache_key in self.validation_cache:
                cached_data = self.validation_cache[cache_key]
                cached_at = cached_data.get('cached_at')
                
                if cached_at and (datetime.utcnow() - cached_at).seconds < self.cache_ttl:
                    return cached_data.get('result')
                else:
                    # Remove expired cache entry
                    del self.validation_cache[cache_key]
            
            return None
            
        except Exception as e:
            logger.error(f"Error accessing validation cache: {str(e)}")
            return None
    
    def _cache_validation(self, cache_key: str, result: Dict[str, Any]) -> None:
        """Cache validation result"""
        try:
            self.validation_cache[cache_key] = {
                'result': result,
                'cached_at': datetime.utcnow()
            }
            
            # Simple cache cleanup - remove old entries
            if len(self.validation_cache) > 1000:
                # Remove oldest 100 entries
                sorted_keys = sorted(
                    self.validation_cache.keys(),
                    key=lambda k: self.validation_cache[k].get('cached_at', datetime.min)
                )
                for key in sorted_keys[:100]:
                    del self.validation_cache[key]
                    
        except Exception as e:
            logger.error(f"Error caching validation result: {str(e)}")
    
    def _get_github_client_id(self) -> str:
        """Get GitHub client ID from environment"""
        import os
        return os.getenv('GITHUB_OAUTH_CLIENT_ID', '')
    
    def clear_cache(self) -> None:
        """Clear validation cache"""
        self.validation_cache.clear()
        logger.info("OAuth token validation cache cleared")

# Global instance for easy import
oauth_token_validator = OAuthTokenValidator()