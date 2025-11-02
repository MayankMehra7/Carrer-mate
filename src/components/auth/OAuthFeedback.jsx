/**
 * OAuth Feedback Components
 * 
 * Specialized feedback components for OAuth authentication events
 * Provides success messages, error handling, and user guidance
 * 
 * Requirements: 5.2, 5.4
 */

import {
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { spacing } from '../../styles/spacing';
import { colors, typography } from '../../styles/theme';
import { useToast } from '../common/Toast';

/**
 * OAuth Error Types and Messages
 */
export const OAuthErrorTypes = {
  CANCELLED: 'oauth_cancelled',
  NETWORK_ERROR: 'network_error',
  INVALID_TOKEN: 'invalid_token',
  PROVIDER_ERROR: 'provider_error',
  ACCOUNT_CONFLICT: 'account_conflict',
  LINKING_ERROR: 'linking_error',
  CONFIGURATION_ERROR: 'configuration_error',
  PLAY_SERVICES_ERROR: 'play_services_error',
  UNKNOWN_ERROR: 'unknown_error',
};

/**
 * OAuth Success Messages
 */
export const OAuthSuccessMessages = {
  GOOGLE_SUCCESS: 'Successfully signed in with Google!',
  GITHUB_SUCCESS: 'Successfully signed in with GitHub!',
  ACCOUNT_LINKED: 'Account successfully linked!',
  ACCOUNT_CREATED: 'Account created successfully!',
};

/**
 * OAuth Error Messages
 */
export const OAuthErrorMessages = {
  [OAuthErrorTypes.CANCELLED]: 'Sign-in was cancelled',
  [OAuthErrorTypes.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
  [OAuthErrorTypes.INVALID_TOKEN]: 'Authentication failed. Please try again.',
  [OAuthErrorTypes.PROVIDER_ERROR]: 'Provider authentication failed. Please try again.',
  [OAuthErrorTypes.ACCOUNT_CONFLICT]: 'An account with this email already exists. Please sign in with your existing method or link your accounts.',
  [OAuthErrorTypes.LINKING_ERROR]: 'Failed to link account. Please try again.',
  [OAuthErrorTypes.CONFIGURATION_ERROR]: 'Authentication service is not properly configured. Please contact support.',
  [OAuthErrorTypes.PLAY_SERVICES_ERROR]: 'Google Play Services is not available. Please update Google Play Services and try again.',
  [OAuthErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * OAuth Feedback Hook
 * Provides methods to show OAuth-specific feedback messages
 */
export const useOAuthFeedback = () => {
  const toast = useToast();

  const showOAuthSuccess = (provider, action = 'signed in') => {
    const message = `Successfully ${action} with ${provider}!`;
    toast.showSuccess(message, {
      duration: 3000,
    });
  };

  const showOAuthError = (provider, error, options = {}) => {
    let errorType = OAuthErrorTypes.UNKNOWN_ERROR;
    let errorMessage = OAuthErrorMessages[OAuthErrorTypes.UNKNOWN_ERROR];

    // Determine error type from error message/object
    if (typeof error === 'string') {
      if (error.toLowerCase().includes('cancel')) {
        errorType = OAuthErrorTypes.CANCELLED;
      } else if (error.toLowerCase().includes('network')) {
        errorType = OAuthErrorTypes.NETWORK_ERROR;
      } else if (error.toLowerCase().includes('token')) {
        errorType = OAuthErrorTypes.INVALID_TOKEN;
      } else if (error.toLowerCase().includes('play services')) {
        errorType = OAuthErrorTypes.PLAY_SERVICES_ERROR;
      } else if (error.toLowerCase().includes('config')) {
        errorType = OAuthErrorTypes.CONFIGURATION_ERROR;
      }
    } else if (error?.errorType) {
      errorType = error.errorType;
    }

    // Don't show toast for cancelled operations
    if (errorType === OAuthErrorTypes.CANCELLED) {
      return;
    }

    // Use custom message if provided
    if (error?.message) {
      errorMessage = error.message;
    } else if (OAuthErrorMessages[errorType]) {
      errorMessage = OAuthErrorMessages[errorType];
    }

    // Add provider context to generic messages
    if (!errorMessage.toLowerCase().includes(provider.toLowerCase())) {
      errorMessage = `${provider} ${errorMessage.toLowerCase()}`;
    }

    toast.showError(errorMessage, {
      duration: 6000,
      ...options,
    });
  };

  const showAccountConflict = (provider, conflictDetails) => {
    const message = conflictDetails?.message || 
      `An account with this email already exists. You can sign in with your existing method or link your ${provider} account.`;
    
    toast.showWarning(message, {
      duration: 8000,
    });
  };

  const showNetworkError = (provider) => {
    toast.showError(`Network error during ${provider} authentication. Please check your connection and try again.`, {
      duration: 5000,
    });
  };

  const showLinkingSuccess = (provider) => {
    toast.showSuccess(`${provider} account linked successfully!`, {
      duration: 3000,
    });
  };

  const showLinkingError = (provider, error) => {
    const message = error?.message || `Failed to link ${provider} account. Please try again.`;
    toast.showError(message, {
      duration: 5000,
    });
  };

  return {
    showOAuthSuccess,
    showOAuthError,
    showAccountConflict,
    showNetworkError,
    showLinkingSuccess,
    showLinkingError,
  };
};

/**
 * OAuth Status Message Component
 * Shows inline status messages for OAuth operations
 */
export const OAuthStatusMessage = ({
  type = 'info',
  message,
  provider,
  onRetry,
  onDismiss,
  style,
  ...props
}) => {
  const getStatusStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.successLight,
          borderColor: colors.success,
          textColor: colors.success,
        };
      case 'error':
        return {
          backgroundColor: colors.errorLight,
          borderColor: colors.error,
          textColor: colors.error,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningLight,
          borderColor: colors.warning,
          textColor: colors.warning,
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primary,
          textColor: colors.primary,
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View
      style={[
        styles.statusContainer,
        {
          backgroundColor: statusStyle.backgroundColor,
          borderColor: statusStyle.borderColor,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.statusMessage,
          { color: statusStyle.textColor },
        ]}
        accessibilityRole="alert"
      >
        {message}
      </Text>
      
      {(onRetry || onDismiss) && (
        <View style={styles.statusActions}>
          {onRetry && (
            <TouchableOpacity
              style={[styles.statusButton, { borderColor: statusStyle.textColor }]}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel={`Retry ${provider} authentication`}
            >
              <Text style={[styles.statusButtonText, { color: statusStyle.textColor }]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
          
          {onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss message"
            >
              <Text style={[styles.dismissButtonText, { color: statusStyle.textColor }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = {
  statusContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.base,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  statusMessage: {
    ...typography.styles.bodySmall,
    flex: 1,
    marginRight: spacing.sm,
  },
  
  statusActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  
  statusButtonText: {
    ...typography.styles.labelSmall,
    fontWeight: typography.fontWeight.medium,
  },
  
  dismissButton: {
    padding: spacing.xs,
  },
  
  dismissButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
};

export default useOAuthFeedback;