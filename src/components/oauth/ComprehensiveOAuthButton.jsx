/**
 * Comprehensive OAuth Button Component
 * 
 * This component provides a complete OAuth authentication experience with:
 * - Network-aware operations
 * - Error handling and retry logic
 * - Account conflict resolution
 * - Fallback UI for various scenarios
 */

import { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRequest } from 'expo-auth-session';
import { AuthContext } from '../../context/AuthContext';
import { useNetworkAwareOAuth } from '../../hooks/useNetworkAwareOAuth';
import { getOAuthConfigForCurrentPlatform, OAuthEndpoints } from '../../config/oauth';
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

  const { loginWithOAuth } = useContext(AuthContext);
  const networkOAuth = useNetworkAwareOAuth();
  const { resolveAccountConflict, AccountConflictDialog } = useAccountConflictResolution();

  const oauthConfig = getOAuthConfigForCurrentPlatform(provider);
  const endpoints = OAuthEndpoints[provider];

  // Handle missing OAuth configuration gracefully
  if (!oauthConfig || !oauthConfig.clientId) {
    console.warn(`OAuth configuration missing for ${provider}`);
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.buttonText}>
          {provider} OAuth not configured
        </Text>
      </View>
    );
  }

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: oauthConfig.clientId,
      scopes: oauthConfig.scopes,
      redirectUri: oauthConfig.redirectUri,
    },
    {
      authorizationEndpoint: endpoints.authUrl,
      tokenEndpoint: endpoints.tokenUrl,
    }
  );

  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        handleOAuthFlow(response.params);
      } else if (response.type === 'error') {
        const error = OAuthErrorHandler.createError(response, provider);
        setAuthState(prev => ({ ...prev, error }));
        onError && onError(error);
      }
    }
  }, [response]);

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

      // Format OAuth data for backend
      // Google expects 'token' (access_token), GitHub expects 'code'
      let formattedData = {};
      if (provider === 'google') {
        // For Google, use access_token if available, otherwise use code
        formattedData = {
          token: oauthData.access_token || oauthData.code || oauthData.token,
          code: oauthData.code // Include code as fallback
        };
      } else if (provider === 'github') {
        // For GitHub, use code
        formattedData = {
          code: oauthData.code || oauthData.access_token,
          state: oauthData.state
        };
      } else {
        formattedData = oauthData;
      }

      // Execute OAuth with network awareness
      const result = await networkOAuth.executeOAuthOperation(
        () => loginWithOAuth(provider, formattedData),
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
    await promptAsync();
  }, [disabled, authState.isLoading, promptAsync]);

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