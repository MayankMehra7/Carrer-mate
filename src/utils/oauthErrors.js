/**
 * OAuth Error Types and Handling Utilities
 * 
 * This module defines OAuth-specific error constants, types, and handling utilities
 * for consistent error management across the OAuth authentication system.
 */

// OAuth Error Types
export const OAuthErrorTypes = {
  // User interaction errors
  CANCELLED: 'oauth_cancelled',
  USER_DENIED: 'user_denied',
  
  // Network and connectivity errors
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  OFFLINE: 'offline',
  
  // Provider-specific errors
  PROVIDER_ERROR: 'provider_error',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  INVALID_PROVIDER: 'invalid_provider',
  
  // Token and validation errors
  INVALID_TOKEN: 'invalid_token',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_VALIDATION_FAILED: 'token_validation_failed',
  
  // Account and linking errors
  ACCOUNT_CONFLICT: 'account_conflict',
  LINKING_ERROR: 'linking_error',
  UNLINKING_ERROR: 'unlinking_error',
  ACCOUNT_NOT_FOUND: 'account_not_found',
  
  // Configuration errors
  CONFIG_ERROR: 'config_error',
  MISSING_CREDENTIALS: 'missing_credentials',
  
  // Generic errors
  UNKNOWN_ERROR: 'unknown_error',
  INTERNAL_ERROR: 'internal_error'
};

// User-friendly error messages
export const OAuthErrorMessages = {
  [OAuthErrorTypes.CANCELLED]: 'Sign-in was cancelled. Please try again.',
  [OAuthErrorTypes.USER_DENIED]: 'Access was denied. Please grant permission to continue.',
  
  [OAuthErrorTypes.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection and try again.',
  [OAuthErrorTypes.TIMEOUT]: 'The request timed out. Please try again.',
  [OAuthErrorTypes.OFFLINE]: 'You appear to be offline. Please check your internet connection.',
  
  [OAuthErrorTypes.PROVIDER_ERROR]: 'Authentication provider encountered an error. Please try again.',
  [OAuthErrorTypes.PROVIDER_UNAVAILABLE]: 'Authentication service is temporarily unavailable. Please try again later.',
  [OAuthErrorTypes.INVALID_PROVIDER]: 'Invalid authentication provider specified.',
  
  [OAuthErrorTypes.INVALID_TOKEN]: 'Invalid authentication token. Please sign in again.',
  [OAuthErrorTypes.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [OAuthErrorTypes.TOKEN_VALIDATION_FAILED]: 'Token validation failed. Please sign in again.',
  
  [OAuthErrorTypes.ACCOUNT_CONFLICT]: 'An account with this email already exists. Would you like to link your accounts?',
  [OAuthErrorTypes.LINKING_ERROR]: 'Failed to link your account. Please try again.',
  [OAuthErrorTypes.UNLINKING_ERROR]: 'Failed to unlink your account. Please try again.',
  [OAuthErrorTypes.ACCOUNT_NOT_FOUND]: 'Account not found. Please sign up first.',
  
  [OAuthErrorTypes.CONFIG_ERROR]: 'Authentication is not properly configured. Please contact support.',
  [OAuthErrorTypes.MISSING_CREDENTIALS]: 'Authentication credentials are missing. Please contact support.',
  
  [OAuthErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [OAuthErrorTypes.INTERNAL_ERROR]: 'Internal server error. Please try again later.'
};

// OAuth Error Class
export class OAuthError extends Error {
  constructor(type, message, details = null, originalError = null) {
    super(message || OAuthErrorMessages[type] || OAuthErrorMessages[OAuthErrorTypes.UNKNOWN_ERROR]);
    this.name = 'OAuthError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      originalError: this.originalError ? {
        message: this.originalError.message,
        name: this.originalError.name
      } : null
    };
  }
}

// Error handling utilities
export const OAuthErrorHandler = {
  /**
   * Create a standardized OAuth error from various error sources
   */
  createError(errorInput, provider = null) {
    // Handle string errors
    if (typeof errorInput === 'string') {
      return new OAuthError(OAuthErrorTypes.UNKNOWN_ERROR, errorInput);
    }

    // Handle Error objects
    if (errorInput instanceof Error) {
      // Check for specific error patterns
      if (errorInput.message.includes('cancelled') || errorInput.message.includes('canceled')) {
        return new OAuthError(OAuthErrorTypes.CANCELLED, null, { provider }, errorInput);
      }
      
      if (errorInput.message.includes('network') || errorInput.message.includes('Network')) {
        return new OAuthError(OAuthErrorTypes.NETWORK_ERROR, null, { provider }, errorInput);
      }
      
      if (errorInput.message.includes('timeout') || errorInput.message.includes('Timeout')) {
        return new OAuthError(OAuthErrorTypes.TIMEOUT, null, { provider }, errorInput);
      }
      
      return new OAuthError(OAuthErrorTypes.UNKNOWN_ERROR, errorInput.message, { provider }, errorInput);
    }

    // Handle API response errors
    if (errorInput && typeof errorInput === 'object') {
      const errorType = errorInput.error_type || errorInput.type || OAuthErrorTypes.UNKNOWN_ERROR;
      const message = errorInput.message || errorInput.error;
      const details = errorInput.details || { provider };
      
      return new OAuthError(errorType, message, details);
    }

    return new OAuthError(OAuthErrorTypes.UNKNOWN_ERROR, 'Unknown error occurred', { provider });
  },

  /**
   * Handle OAuth errors with appropriate user feedback
   */
  handleError(error, onRetry = null, onCancel = null) {
    const oauthError = error instanceof OAuthError ? error : this.createError(error);
    
    // Log error for debugging (without sensitive data)
    console.warn('OAuth Error:', {
      type: oauthError.type,
      message: oauthError.message,
      provider: oauthError.details?.provider,
      timestamp: oauthError.timestamp
    });

    // Return error handling result
    return {
      error: oauthError,
      shouldRetry: this.shouldAllowRetry(oauthError.type),
      shouldShowDialog: this.shouldShowDialog(oauthError.type),
      userMessage: oauthError.message,
      actions: this.getErrorActions(oauthError.type, onRetry, onCancel)
    };
  },

  /**
   * Determine if retry should be allowed for this error type
   */
  shouldAllowRetry(errorType) {
    const retryableErrors = [
      OAuthErrorTypes.NETWORK_ERROR,
      OAuthErrorTypes.TIMEOUT,
      OAuthErrorTypes.PROVIDER_ERROR,
      OAuthErrorTypes.PROVIDER_UNAVAILABLE,
      OAuthErrorTypes.UNKNOWN_ERROR
    ];
    
    return retryableErrors.includes(errorType);
  },

  /**
   * Determine if a dialog should be shown for this error type
   */
  shouldShowDialog(errorType) {
    const dialogErrors = [
      OAuthErrorTypes.ACCOUNT_CONFLICT,
      OAuthErrorTypes.LINKING_ERROR,
      OAuthErrorTypes.UNLINKING_ERROR,
      OAuthErrorTypes.CONFIG_ERROR,
      OAuthErrorTypes.MISSING_CREDENTIALS
    ];
    
    return dialogErrors.includes(errorType);
  },

  /**
   * Get available actions for an error type
   */
  getErrorActions(errorType, onRetry, onCancel) {
    const actions = [];

    switch (errorType) {
      case OAuthErrorTypes.NETWORK_ERROR:
      case OAuthErrorTypes.TIMEOUT:
      case OAuthErrorTypes.PROVIDER_ERROR:
      case OAuthErrorTypes.PROVIDER_UNAVAILABLE:
        if (onRetry) {
          actions.push({ label: 'Retry', action: onRetry, type: 'primary' });
        }
        if (onCancel) {
          actions.push({ label: 'Cancel', action: onCancel, type: 'secondary' });
        }
        break;

      case OAuthErrorTypes.ACCOUNT_CONFLICT:
        actions.push({ label: 'Link Accounts', action: 'link', type: 'primary' });
        actions.push({ label: 'Use Different Account', action: 'switch', type: 'secondary' });
        if (onCancel) {
          actions.push({ label: 'Cancel', action: onCancel, type: 'tertiary' });
        }
        break;

      case OAuthErrorTypes.CANCELLED:
      case OAuthErrorTypes.USER_DENIED:
        // No actions needed for user-initiated cancellations
        break;

      default:
        if (onCancel) {
          actions.push({ label: 'OK', action: onCancel, type: 'primary' });
        }
        break;
    }

    return actions;
  },

  /**
   * Map provider-specific errors to OAuth error types
   */
  mapProviderError(providerError, provider) {
    const errorMap = {
      google: {
        'popup_closed_by_user': OAuthErrorTypes.CANCELLED,
        'access_denied': OAuthErrorTypes.USER_DENIED,
        'invalid_client': OAuthErrorTypes.CONFIG_ERROR,
        'invalid_grant': OAuthErrorTypes.INVALID_TOKEN,
        'network_error': OAuthErrorTypes.NETWORK_ERROR
      },
      github: {
        'access_denied': OAuthErrorTypes.USER_DENIED,
        'incorrect_client_credentials': OAuthErrorTypes.CONFIG_ERROR,
        'bad_verification_code': OAuthErrorTypes.INVALID_TOKEN,
        'network_error': OAuthErrorTypes.NETWORK_ERROR
      }
    };

    const providerMap = errorMap[provider] || {};
    const errorCode = providerError.error || providerError.code || providerError.type;
    
    return providerMap[errorCode] || OAuthErrorTypes.PROVIDER_ERROR;
  }
};

// Export default error handler instance
export default OAuthErrorHandler;