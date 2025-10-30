"""
OAuth Error Types and Handling Utilities for Backend

This module defines OAuth-specific error constants, exceptions, and handling utilities
for consistent error management across the OAuth authentication system.
"""

from enum import Enum
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class OAuthErrorType(Enum):
    """OAuth error type enumeration"""
    # User interaction errors
    CANCELLED = "oauth_cancelled"
    USER_DENIED = "user_denied"
    
    # Network and connectivity errors
    NETWORK_ERROR = "network_error"
    TIMEOUT = "timeout"
    
    # Provider-specific errors
    PROVIDER_ERROR = "provider_error"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    INVALID_PROVIDER = "invalid_provider"
    
    # Token and validation errors
    INVALID_TOKEN = "invalid_token"
    TOKEN_EXPIRED = "token_expired"
    TOKEN_VALIDATION_FAILED = "token_validation_failed"
    
    # Account and linking errors
    ACCOUNT_CONFLICT = "account_conflict"
    LINKING_ERROR = "linking_error"
    UNLINKING_ERROR = "unlinking_error"
    ACCOUNT_NOT_FOUND = "account_not_found"
    
    # Configuration errors
    CONFIG_ERROR = "config_error"
    MISSING_CREDENTIALS = "missing_credentials"
    
    # Generic errors
    UNKNOWN_ERROR = "unknown_error"
    INTERNAL_ERROR = "internal_error"

# User-friendly error messages
OAUTH_ERROR_MESSAGES = {
    OAuthErrorType.CANCELLED: "Sign-in was cancelled. Please try again.",
    OAuthErrorType.USER_DENIED: "Access was denied. Please grant permission to continue.",
    
    OAuthErrorType.NETWORK_ERROR: "Network connection failed. Please check your internet connection and try again.",
    OAuthErrorType.TIMEOUT: "The request timed out. Please try again.",
    
    OAuthErrorType.PROVIDER_ERROR: "Authentication provider encountered an error. Please try again.",
    OAuthErrorType.PROVIDER_UNAVAILABLE: "Authentication service is temporarily unavailable. Please try again later.",
    OAuthErrorType.INVALID_PROVIDER: "Invalid authentication provider specified.",
    
    OAuthErrorType.INVALID_TOKEN: "Invalid authentication token. Please sign in again.",
    OAuthErrorType.TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
    OAuthErrorType.TOKEN_VALIDATION_FAILED: "Token validation failed. Please sign in again.",
    
    OAuthErrorType.ACCOUNT_CONFLICT: "An account with this email already exists. Would you like to link your accounts?",
    OAuthErrorType.LINKING_ERROR: "Failed to link your account. Please try again.",
    OAuthErrorType.UNLINKING_ERROR: "Failed to unlink your account. Please try again.",
    OAuthErrorType.ACCOUNT_NOT_FOUND: "Account not found. Please sign up first.",
    
    OAuthErrorType.CONFIG_ERROR: "Authentication is not properly configured. Please contact support.",
    OAuthErrorType.MISSING_CREDENTIALS: "Authentication credentials are missing. Please contact support.",
    
    OAuthErrorType.UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
    OAuthErrorType.INTERNAL_ERROR: "Internal server error. Please try again later."
}

class OAuthException(Exception):
    """Base OAuth exception class"""
    
    def __init__(self, error_type: OAuthErrorType, message: str = None, details: Dict[str, Any] = None, original_error: Exception = None):
        self.error_type = error_type
        self.message = message or OAUTH_ERROR_MESSAGES.get(error_type, OAUTH_ERROR_MESSAGES[OAuthErrorType.UNKNOWN_ERROR])
        self.details = details or {}
        self.original_error = original_error
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses"""
        return {
            "error": "oauth_error",
            "error_type": self.error_type.value,
            "message": self.message,
            "details": self.details
        }

class InvalidTokenException(OAuthException):
    """Exception for invalid OAuth tokens"""
    def __init__(self, provider: str = None, details: Dict[str, Any] = None):
        super().__init__(
            OAuthErrorType.INVALID_TOKEN,
            details={"provider": provider, **(details or {})}
        )

class ProviderUnavailableException(OAuthException):
    """Exception for unavailable OAuth providers"""
    def __init__(self, provider: str, details: Dict[str, Any] = None):
        super().__init__(
            OAuthErrorType.PROVIDER_UNAVAILABLE,
            details={"provider": provider, **(details or {})}
        )

class AccountConflictException(OAuthException):
    """Exception for account conflicts during OAuth"""
    def __init__(self, email: str, existing_providers: list, attempted_provider: str, details: Dict[str, Any] = None):
        conflict_details = {
            "email": email,
            "existing_providers": existing_providers,
            "attempted_provider": attempted_provider,
            "suggested_action": "link_account",
            **(details or {})
        }
        super().__init__(
            OAuthErrorType.ACCOUNT_CONFLICT,
            details=conflict_details
        )

class ConfigurationException(OAuthException):
    """Exception for OAuth configuration errors"""
    def __init__(self, missing_config: list, details: Dict[str, Any] = None):
        super().__init__(
            OAuthErrorType.CONFIG_ERROR,
            details={"missing_config": missing_config, **(details or {})}
        )

class OAuthErrorHandler:
    """OAuth error handling utilities"""
    
    @staticmethod
    def create_error_response(exception: OAuthException, status_code: int = 400) -> tuple:
        """Create a standardized error response for Flask"""
        error_dict = exception.to_dict()
        
        # Log error for debugging (without sensitive data)
        logger.warning(f"OAuth Error: {exception.error_type.value} - {exception.message}", 
                      extra={"provider": exception.details.get("provider"), 
                            "error_type": exception.error_type.value})
        
        return error_dict, status_code
    
    @staticmethod
    def handle_provider_error(provider: str, error_response: Dict[str, Any]) -> OAuthException:
        """Handle provider-specific errors and map to OAuth exceptions"""
        error_code = error_response.get("error", "")
        error_description = error_response.get("error_description", "")
        
        # Map provider-specific errors
        if provider == "google":
            return OAuthErrorHandler._handle_google_error(error_code, error_description, error_response)
        elif provider == "github":
            return OAuthErrorHandler._handle_github_error(error_code, error_description, error_response)
        else:
            return OAuthException(
                OAuthErrorType.INVALID_PROVIDER,
                details={"provider": provider, "error_response": error_response}
            )
    
    @staticmethod
    def _handle_google_error(error_code: str, error_description: str, error_response: Dict[str, Any]) -> OAuthException:
        """Handle Google-specific OAuth errors"""
        google_error_map = {
            "access_denied": OAuthErrorType.USER_DENIED,
            "invalid_client": OAuthErrorType.CONFIG_ERROR,
            "invalid_grant": OAuthErrorType.INVALID_TOKEN,
            "invalid_request": OAuthErrorType.PROVIDER_ERROR,
            "unauthorized_client": OAuthErrorType.CONFIG_ERROR,
            "unsupported_grant_type": OAuthErrorType.CONFIG_ERROR,
            "invalid_scope": OAuthErrorType.CONFIG_ERROR
        }
        
        error_type = google_error_map.get(error_code, OAuthErrorType.PROVIDER_ERROR)
        
        return OAuthException(
            error_type,
            message=error_description or OAUTH_ERROR_MESSAGES[error_type],
            details={"provider": "google", "error_code": error_code, "error_response": error_response}
        )
    
    @staticmethod
    def _handle_github_error(error_code: str, error_description: str, error_response: Dict[str, Any]) -> OAuthException:
        """Handle GitHub-specific OAuth errors"""
        github_error_map = {
            "access_denied": OAuthErrorType.USER_DENIED,
            "incorrect_client_credentials": OAuthErrorType.CONFIG_ERROR,
            "bad_verification_code": OAuthErrorType.INVALID_TOKEN,
            "unverified_email": OAuthErrorType.PROVIDER_ERROR,
            "redirect_uri_mismatch": OAuthErrorType.CONFIG_ERROR
        }
        
        error_type = github_error_map.get(error_code, OAuthErrorType.PROVIDER_ERROR)
        
        return OAuthException(
            error_type,
            message=error_description or OAUTH_ERROR_MESSAGES[error_type],
            details={"provider": "github", "error_code": error_code, "error_response": error_response}
        )
    
    @staticmethod
    def handle_network_error(provider: str, original_error: Exception) -> OAuthException:
        """Handle network-related errors during OAuth"""
        return OAuthException(
            OAuthErrorType.NETWORK_ERROR,
            details={"provider": provider},
            original_error=original_error
        )
    
    @staticmethod
    def handle_timeout_error(provider: str, original_error: Exception) -> OAuthException:
        """Handle timeout errors during OAuth"""
        return OAuthException(
            OAuthErrorType.TIMEOUT,
            details={"provider": provider},
            original_error=original_error
        )
    
    @staticmethod
    def validate_provider(provider: str) -> None:
        """Validate that the provider is supported"""
        supported_providers = ["google", "github"]
        if provider not in supported_providers:
            raise OAuthException(
                OAuthErrorType.INVALID_PROVIDER,
                details={"provider": provider, "supported_providers": supported_providers}
            )
    
    @staticmethod
    def check_account_conflict(email: str, existing_user: Dict[str, Any], attempted_provider: str) -> None:
        """Check for account conflicts and raise appropriate exception"""
        if existing_user:
            existing_providers = []
            
            # Check for email-based authentication
            if existing_user.get("password"):
                existing_providers.append("email")
            
            # Check for OAuth providers
            oauth_providers = existing_user.get("oauth_providers", {})
            existing_providers.extend(oauth_providers.keys())
            
            # If the attempted provider is not already linked, it's a conflict
            if attempted_provider not in existing_providers:
                raise AccountConflictException(
                    email=email,
                    existing_providers=existing_providers,
                    attempted_provider=attempted_provider
                )

# Decorator for handling OAuth errors in Flask routes
def handle_oauth_errors(f):
    """Decorator to handle OAuth errors in Flask routes"""
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except OAuthException as e:
            return OAuthErrorHandler.create_error_response(e)
        except Exception as e:
            # Handle unexpected errors
            logger.error(f"Unexpected error in OAuth route: {str(e)}", exc_info=True)
            oauth_error = OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                original_error=e
            )
            return OAuthErrorHandler.create_error_response(oauth_error, 500)
    
    wrapper.__name__ = f.__name__
    return wrapper