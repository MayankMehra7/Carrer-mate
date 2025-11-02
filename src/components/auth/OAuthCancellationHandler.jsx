/**
 * OAuth Cancellation Handler Component
 * 
 * Handles OAuth flow cancellation scenarios with graceful fallback
 * Provides clear messaging and alternative authentication options
 * 
 * Requirements: 5.1, 5.2
 */

import React from 'react';
import {
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { spacing } from '../../styles/spacing';
import { colors, typography } from '../../styles/theme';

/**
 * OAuth Cancellation Message Component
 * Shows when user cancels OAuth flow
 */
export const OAuthCancellationMessage = ({
  provider,
  onRetry,
  onUseEmailAuth,
  onDismiss,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.messageContainer}>
        <Text style={styles.title} accessibilityRole="header">
          {provider} Sign-in Cancelled
        </Text>
        
        <Text style={styles.message}>
          You cancelled the {provider} sign-in process. You can try again or use email authentication instead.
        </Text>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={`Retry ${provider} sign-in`}
            accessibilityHint="Try the OAuth authentication again"
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Try {provider} Again
            </Text>
          </TouchableOpacity>
        )}
        
        {onUseEmailAuth && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onUseEmailAuth}
            accessibilityRole="button"
            accessibilityLabel="Use email authentication"
            accessibilityHint="Switch to email and password authentication"
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Use Email Instead
            </Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
            accessibilityHint="Close this message"
          >
            <Text style={styles.dismissText}>
              Dismiss
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * OAuth Fallback Options Component
 * Shows alternative authentication options when OAuth fails
 */
export const OAuthFallbackOptions = ({
  onUseEmail,
  onTryDifferentProvider,
  availableProviders = [],
  style,
  ...props
}) => {
  return (
    <View style={[styles.fallbackContainer, style]} {...props}>
      <Text style={styles.fallbackTitle}>
        Having trouble signing in?
      </Text>
      
      <Text style={styles.fallbackMessage}>
        Try one of these alternatives:
      </Text>
      
      <View style={styles.fallbackOptions}>
        {onUseEmail && (
          <TouchableOpacity
            style={styles.fallbackOption}
            onPress={onUseEmail}
            accessibilityRole="button"
            accessibilityLabel="Use email authentication"
          >
            <Text style={styles.fallbackOptionText}>
              📧 Sign in with Email
            </Text>
          </TouchableOpacity>
        )}
        
        {availableProviders.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={styles.fallbackOption}
            onPress={() => onTryDifferentProvider?.(provider)}
            accessibilityRole="button"
            accessibilityLabel={`Try ${provider} authentication`}
          >
            <Text style={styles.fallbackOptionText}>
              {provider === 'google' ? '🔍' : '⚡'} Try {provider}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Hook for handling OAuth cancellation
 */
export const useOAuthCancellation = () => {
  const [showCancellationMessage, setShowCancellationMessage] = React.useState(false);
  const [cancelledProvider, setCancelledProvider] = React.useState(null);

  const handleOAuthCancellation = (provider) => {
    setCancelledProvider(provider);
    setShowCancellationMessage(true);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      setShowCancellationMessage(false);
      setCancelledProvider(null);
    }, 10000);
  };

  const dismissCancellationMessage = () => {
    setShowCancellationMessage(false);
    setCancelledProvider(null);
  };

  const retryOAuth = (onRetry) => {
    dismissCancellationMessage();
    onRetry?.(cancelledProvider);
  };

  const useEmailAuth = (onUseEmail) => {
    dismissCancellationMessage();
    onUseEmail?.();
  };

  return {
    showCancellationMessage,
    cancelledProvider,
    handleOAuthCancellation,
    dismissCancellationMessage,
    retryOAuth,
    useEmailAuth,
  };
};

const styles = {
  container: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.base,
  },
  
  messageContainer: {
    marginBottom: spacing.lg,
  },
  
  title: {
    ...typography.styles.h4,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  
  message: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  actions: {
    gap: spacing.sm,
  },
  
  button: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  primaryButton: {
    backgroundColor: colors.primary,
  },
  
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  buttonText: {
    ...typography.styles.buttonText,
    fontSize: typography.fontSize.base,
  },
  
  primaryButtonText: {
    color: colors.white,
  },
  
  secondaryButtonText: {
    color: colors.primary,
  },
  
  dismissButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  
  dismissText: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
  
  fallbackContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.base,
    marginVertical: spacing.sm,
  },
  
  fallbackTitle: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  
  fallbackMessage: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  
  fallbackOptions: {
    gap: spacing.sm,
  },
  
  fallbackOption: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
  },
  
  fallbackOptionText: {
    ...typography.styles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
};

export default useOAuthCancellation;