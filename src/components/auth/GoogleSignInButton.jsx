/**
 * Google Sign-In Button Component
 * 
 * React Native component for Google OAuth authentication
 * Implements loading states, error handling, and accessibility features
 * 
 * Requirements: 1.1, 5.1
 */

import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { OAuthConfig } from '../../config/oauth';
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
 * Google Sign-In Button Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Callback when sign-in succeeds
 * @param {Function} props.onError - Callback when sign-in fails
 * @param {boolean} props.loading - External loading state
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Object} props.style - Additional styles for the button
 * @param {string} props.text - Custom button text
 * @returns {JSX.Element} Google sign-in button component
 */
export const GoogleSignInButton = ({
  onSuccess,
  onError,
  loading: externalLoading = false,
  disabled = false,
  style,
  text = 'Continue with Google',
  showProgress = false,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('initializing');
  
  const isLoading = externalLoading || internalLoading;
  const isDisabled = disabled || isLoading;

  // Configure OAuth request for web and mobile
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: OAuthConfig.google.clientId,
      scopes: OAuthConfig.google.scopes,
      redirectUri: makeRedirectUri({
        scheme: 'aicarrermateapp',
        path: 'oauth',
      }),
      responseType: 'code',
      additionalParameters: {},
      extraParams: {
        access_type: 'offline',
      },
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    }
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthSuccess(code);
    } else if (response?.type === 'error') {
      handleAuthError(response.error);
    } else if (response?.type === 'cancel') {
      handleAuthCancel();
    }
  }, [response]);

  const handleAuthSuccess = async (code) => {
    try {
      setLoadingStage('validating');
      
      // Exchange code for tokens (this would typically be done on your backend)
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: OAuthConfig.google.clientId,
          client_secret: OAuthConfig.google.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: makeRedirectUri({
            scheme: 'aicarrermateapp',
            path: 'oauth',
          }),
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.access_token) {
        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });
        
        const userInfo = await userResponse.json();
        
        setLoadingStage('completing');
        onSuccess?.({
          accessToken: tokens.access_token,
          idToken: tokens.id_token,
          user: userInfo,
          tokens,
        });
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Google OAuth token exchange error:', error);
      onError?.({
        type: 'provider_error',
        message: 'Failed to complete Google sign-in',
        originalError: error,
      });
    } finally {
      setInternalLoading(false);
    }
  };

  const handleAuthError = (error) => {
    console.error('Google OAuth error:', error);
    onError?.({
      type: 'provider_error',
      message: error?.description || 'Google sign-in failed',
      originalError: error,
    });
    setInternalLoading(false);
  };

  const handleAuthCancel = () => {
    onError?.({
      type: 'oauth_cancelled',
      message: 'Google sign-in was cancelled',
    });
    setInternalLoading(false);
  };

  /**
   * Handle Google Sign-In process
   */
  const handleGoogleSignIn = async () => {
    if (isDisabled) return;

    setInternalLoading(true);
    setLoadingStage('authenticating');

    try {
      // Start the OAuth flow
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-In initiation error:', error);
      onError?.({
        type: 'provider_error',
        message: error.message || 'Failed to start Google sign-in',
        originalError: error,
      });
      setInternalLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={handleGoogleSignIn}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint="Sign in with your Google account"
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
            color={colors.text.secondary}
            style={styles.loadingIndicator}
            accessibilityLabel="Loading Google sign-in"
          />
        ) : (
          <View style={styles.iconContainer}>
            <GoogleIcon />
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
 * Google Icon Component
 * Simple Google logo representation for the sign-in button
 */
const GoogleIcon = () => {
  return (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );
};

const styles = {
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    ...shadows.sm,
  },
  
  buttonDisabled: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
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
  
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  googleIconText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  
  buttonText: {
    ...typography.styles.buttonText,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  
  loadingIndicator: {
    marginRight: spacing.sm,
  },
};

export default GoogleSignInButton;