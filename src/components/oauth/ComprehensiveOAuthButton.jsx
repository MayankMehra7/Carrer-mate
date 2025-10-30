/**
 * Comprehensive OAuth Button Component
 * 
 * This component provides a complete OAuth authentication experience with:
 * - Network-aware operations
 * - Error handling and retry logic
 * - Account conflict resolution
 * - Fallback UI for various scenarios
 */

import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNetworkAwareOAuth } from '../../hooks/useNetworkAwareOAuth';
import { OAuthErrorHandler, OAuthErrorTypes } from '../../utils/oauthErrors';
import { useAccountConflictResolution } from './AccountConflictDialog';
import {
    NetworkStatusIndicator,
    OAuthErrorFallback,
    RetryIndicator,
    WaitingForConnectivity
} from './OAuthFallbackUI';

export const ComprehensiveOAuthButton = ({
  provider,
  onSuccess,
  onError,
  style,
  textStyle,
  disabled = false,
  showNetworkStatus = true,
  children
}) => {
  const [authState, setAuthState] = useState({
    isLoading: false,
    error: null,
    isWaitingForNetwork: false
  });

  const { loginWithOAuth } = useAuth();
  const networkOAuth = useNetworkAwareOAuth();
  const { resolveAccountConflict, AccountConflictDialog } = useAccountConflictResolution();

  const getProviderDisplayName = () => {
    const names = { google: 'Google', github: 'GitHub' };
    return names[provider] || provider;
  };

  const getProviderIcon = () => {
    const icons = { google: '🔍', github: '🐙' };
    return icons[provider] || '🔐';
  };

  const handleOAuthFlow = useCallback(async (oauthData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Execute OAuth with network awareness
      const result = await networkOAuth.executeOAuthOperation(
        () => loginWithOAuth(provider, oauthData),
        provider,
        {
          showRetryFeedback: true,
          onRetryAttempt: (attempt, maxAttempts, error) => {
            console.log(`OAuth retry attempt ${attempt}/${maxAttempts}:`, error.message);
          },
          onOffline: () => {
            setAuthState(prev => ({ ...prev, isWaitingForNetwork: true }));
          },
          onProviderUnavailable: (provider, error) => {
            setAuthState(prev => ({ 
              ...prev, 
              error: OAuthErrorHandler.createError(error, provider) 
            }));
          }
        }
      );

      if (result.ok) {
        setAuthState({ isLoading: false, error: null, isWaitingForNetwork: false });
        onSuccess && onSuccess(result);
      } else {
        // Handle specific error types
        const error = OAuthErrorHandler.createError(result, provider);
        
        if (error.type === OAuthErrorTypes.ACCOUNT_CONFLICT) {
          // Handle account conflict
          try {
            const resolution = await resolveAccountConflict(error);
            
            if (resolution.action === 'linked') {
              setAuthState({ isLoading: false, error: null, isWaitingForNetwork: false });
              onSuccess && onSuccess({ ok: true, user: resolution.user });
            } else if (resolution.action === 'switch') {
              // User wants to use a different account - restart OAuth flow
              setAuthState({ isLoading: false, error: null, isWaitingForNetwork: false });
              // Could trigger provider-specific account switching here
            }
          } catch (conflictError) {
            setAuthState(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: OAuthErrorHandler.createError(conflictError, provider) 
            }));
          }
        } else {
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error 
          }));
        }
      }
    } catch (error) {
      const oauthError = OAuthErrorHandler.createError(error, provider);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isWaitingForNetwork: false,
        error: oauthError 
      }));
      
      onError && onError(oauthError);
    }
  }, [provider, loginWithOAuth, networkOAuth, resolveAccountConflict, onSuccess, onError]);

  const handlePress = useCallback(async () => {
    if (disabled || authState.isLoading) return;

    try {
      // Check network connectivity first
      if (!networkOAuth.isOnline) {
        setAuthState(prev => ({ ...prev, isWaitingForNetwork: true }));
        await networkOAuth.waitForConnectivity();
        setAuthState(prev => ({ ...prev, isWaitingForNetwork: false }));
      }

      // Check provider availability
      const availability = await networkOAuth.checkProviderAvailability([provider]);
      if (!availability[provider]?.available) {
        const error = OAuthErrorHandler.createError({
          type: OAuthErrorTypes.PROVIDER_UNAVAILABLE,
          message: `${getProviderDisplayName()} is currently unavailable`
        }, provider);
        
        setAuthState(prev => ({ ...prev, error }));
        return;
      }

      // Provider-specific OAuth initiation
      if (provider === 'google') {
        // For Google, we would typically use @react-native-google-signin/google-signin
        // This is a placeholder for the actual Google OAuth implementation
        const googleOAuthData = await initiateGoogleOAuth();
        await handleOAuthFlow(googleOAuthData);
      } else if (provider === 'github') {
        // For GitHub, we would typically use expo-auth-session
        // This is a placeholder for the actual GitHub OAuth implementation
        const githubOAuthData = await initiateGitHubOAuth();
        await handleOAuthFlow(githubOAuthData);
      }
    } catch (error) {
      const oauthError = OAuthErrorHandler.createError(error, provider);
      setAuthState(prev => ({ ...prev, error: oauthError }));
      onError && onError(oauthError);
    }
  }, [disabled, authState.isLoading, networkOAuth, provider, handleOAuthFlow, onError]);

  const handleRetry = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
    handlePress();
  }, [handlePress]);

  const handleErrorAction = useCallback((action) => {
    if (action === 'retry') {
      handleRetry();
    } else if (typeof action === 'function') {
      action();
    }
  }, [handleRetry]);

  // Placeholder OAuth initiation functions (would be replaced with actual implementations)
  const initiateGoogleOAuth = async () => {
    // This would use @react-native-google-signin/google-signin
    throw new Error('Google OAuth implementation needed');
  };

  const initiateGitHubOAuth = async () => {
    // This would use expo-auth-session
    throw new Error('GitHub OAuth implementation needed');
  };

  // Render waiting for connectivity state
  if (authState.isWaitingForNetwork) {
    return (
      <View style={[styles.container, style]}>
        <WaitingForConnectivity 
          onCancel={() => setAuthState(prev => ({ ...prev, isWaitingForNetwork: false }))}
        />
      </View>
    );
  }

  // Render error state
  if (authState.error) {
    return (
      <View style={[styles.container, style]}>
        <OAuthErrorFallback
          error={authState.error}
          onRetry={handleRetry}
          onCancel={() => setAuthState(prev => ({ ...prev, error: null }))}
          onAction={handleErrorAction}
        />
        <AccountConflictDialog />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Network status indicator */}
      {showNetworkStatus && (
        <NetworkStatusIndicator
          isOnline={networkOAuth.isOnline}
          isCheckingProviders={networkOAuth.isCheckingProviders}
          providerAvailability={networkOAuth.providerAvailability}
        />
      )}

      {/* Retry indicator */}
      <RetryIndicator
        isRetrying={networkOAuth.isRetrying}
        retryAttempt={networkOAuth.retryAttempt}
        maxRetries={networkOAuth.maxRetries}
        provider={provider}
        onCancel={() => setAuthState(prev => ({ ...prev, isLoading: false }))}
      />

      {/* Main OAuth button */}
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
          authState.isLoading && styles.buttonLoading
        ]}
        onPress={handlePress}
        disabled={disabled || authState.isLoading || !networkOAuth.isOnline}
      >
        {authState.isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>{getProviderIcon()}</Text>
            <Text style={[styles.buttonText, textStyle]}>
              {children || `Continue with ${getProviderDisplayName()}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Account conflict dialog */}
      <AccountConflictDialog />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  buttonLoading: {
    opacity: 0.8,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComprehensiveOAuthButton;