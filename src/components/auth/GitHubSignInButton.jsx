/**
 * GitHub Sign-In Button Component
 * 
 * React Native component for GitHub OAuth authentication
 * Implements OAuth authorization flow with expo-auth-session
 * Includes loading states, error handling, and accessibility features
 * 
 * Requirements: 2.1, 5.1
 */

import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { OAuthConfig, OAuthEndpoints } from '../../config/oauth';
import { spacing } from '../../styles/spacing';
import { colors } from '../../styles/theme';

// Simple style constants
const borderRadius = { md: 8 };
const shadows = { sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }, none: {} };
const typography = { 
  styles: { buttonText: { fontSize: 16, fontWeight: '500' } },
  fontSize: { base: 16 },
  fontWeight: { medium: '500', bold: '700' }
};

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

/**
 * GitHub Sign-In Button Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Callback when sign-in succeeds
 * @param {Function} props.onError - Callback when sign-in fails
 * @param {boolean} props.loading - External loading state
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Object} props.style - Additional styles for the button
 * @param {string} props.text - Custom button text
 * @returns {JSX.Element} GitHub sign-in button component
 */
export const GitHubSignInButton = ({
  onSuccess,
  onError,
  loading: externalLoading = false,
  disabled = false,
  style,
  text = 'Continue with GitHub',
  showProgress = false,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('initializing');
  
  const isLoading = externalLoading || internalLoading;
  const isDisabled = disabled || isLoading;

  // GitHub OAuth discovery configuration
  const discovery = {
    authorizationEndpoint: OAuthEndpoints.github.authUrl,
    tokenEndpoint: OAuthEndpoints.github.tokenUrl,
  };

  // Configure the auth request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: OAuthConfig.github.clientId,
      scopes: OAuthConfig.github.scopes,
      redirectUri: makeRedirectUri({
        scheme: 'aicarrermateapp',
        path: 'oauth',
      }),
      responseType: 'code',
      state: Math.random().toString(36).substring(2, 15), // CSRF protection
    },
    discovery
  );

  /**
   * Handle OAuth response
   */
  useEffect(() => {
    if (response?.type === 'success') {
      const { code, state } = response.params;
      
      if (code) {
        handleAuthSuccess(code, state);
      } else {
        handleAuthError('No authorization code received');
      }
    } else if (response?.type === 'error') {
      const errorMessage = response.params?.error_description || 
                          response.params?.error || 
                          'GitHub authorization failed';
      handleAuthError(errorMessage);
    } else if (response?.type === 'cancel') {
      // User cancelled - call error callback with cancellation info
      setInternalLoading(false);
      onError?.({
        type: 'oauth_cancelled',
        message: 'GitHub sign-in was cancelled',
        originalError: response,
      });
    }
  }, [response]);

  /**
   * Handle successful authorization code receipt
   */
  const handleAuthSuccess = async (code, state) => {
    try {
      setInternalLoading(true);
      setLoadingStage('validating');

      // Call success callback with authorization code
      onSuccess?.({
        code,
        state,
        provider: 'github',
      });

    } catch (error) {
      console.error('GitHub auth success handling error:', error);
      handleAuthError('Failed to process GitHub authorization');
    } finally {
      setInternalLoading(false);
    }
  };

  /**
   * Handle authentication errors
   */
  const handleAuthError = (errorMessage) => {
    console.error('GitHub Sign-In error:', errorMessage);
    
    setInternalLoading(false);

    // Show user-friendly error message (except for cancellation)
    if (!errorMessage.toLowerCase().includes('cancel')) {
      Alert.alert(
        'GitHub Sign-In Error',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    }

    // Call error callback with structured error info
    onError?.({
      type: errorMessage.toLowerCase().includes('cancel') ? 'oauth_cancelled' : 'provider_error',
      message: errorMessage,
      originalError: errorMessage,
    });
  };

  /**
   * Handle GitHub Sign-In button press
   */
  const handleGitHubSignIn = async () => {
    if (isDisabled) return;

    try {
      // Validate configuration
      if (!OAuthConfig.github.clientId) {
        throw new Error('GitHub OAuth Client ID not configured');
      }

      if (!request) {
        throw new Error('GitHub OAuth request not ready');
      }

      setInternalLoading(true);
      setLoadingStage('authenticating');

      // Start the OAuth flow
      await promptAsync();

    } catch (error) {
      console.error('GitHub Sign-In initiation error:', error);
      handleAuthError(error.message || 'Failed to start GitHub sign-in');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={handleGitHubSignIn}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Sign in with your GitHub account"
      accessibilityState={{
        disabled: isDisabled,
        busy: isLoading,
      }}
      {...props}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.white}
            style={styles.loadingIndicator}
            accessibilityLabel="Loading GitHub sign-in"
          />
        ) : (
          <View style={styles.iconContainer}>
            <GitHubIcon />
          </View>
        )}
        
        <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>
          {isLoading ? 'Signing in...' : text}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * GitHub Icon Component
 * Simple GitHub logo representation for the sign-in button
 */
const GitHubIcon = () => {
  return (
    <View style={styles.githubIcon}>
      <Text style={styles.githubIconText}>⚡</Text>
    </View>
  );
};

const styles = {
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray800,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    ...shadows.sm,
  },
  
  buttonDisabled: {
    backgroundColor: colors.gray300,
    borderColor: colors.gray400,
    ...shadows.none,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconContainer: {
    marginRight: spacing.sm,
  },
  
  githubIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  githubIconText: {
    color: colors.gray900,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  
  buttonText: {
    ...typography.styles.buttonText,
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  
  buttonTextDisabled: {
    color: colors.gray500,
  },
  
  loadingIndicator: {
    marginRight: spacing.sm,
  },
};

export default GitHubSignInButton;