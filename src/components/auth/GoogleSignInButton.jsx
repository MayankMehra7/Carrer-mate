/**
 * Google Sign-In Button Component
 * 
 * React Native component for Google OAuth authentication
 * Implements loading states, error handling, and accessibility features
 * 
 * Requirements: 1.1, 5.1
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { OAuthConfig } from '../../config/oauth';
import { borderRadius, colors, shadows, spacing, typography } from '../../styles/theme';

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

  // Configure Google Sign-In
  React.useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        if (!OAuthConfig.google.clientId) {
          console.warn('Google OAuth Client ID not configured');
          return;
        }

        await GoogleSignin.configure({
          webClientId: OAuthConfig.google.clientId,
          offlineAccess: true,
          hostedDomain: '',
          forceCodeForRefreshToken: true,
        });
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };

    configureGoogleSignIn();
  }, []);

  /**
   * Handle Google Sign-In process
   */
  const handleGoogleSignIn = async () => {
    if (isDisabled) return;

    setInternalLoading(true);
    setLoadingStage('initializing');

    try {
      // Check if Google Play Services are available
      setLoadingStage('authenticating');
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      setLoadingStage('validating');
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo?.idToken) {
        setLoadingStage('completing');
        // Call success callback with the ID token
        onSuccess?.({
          idToken: userInfo.idToken,
          user: userInfo.user,
          serverAuthCode: userInfo.serverAuthCode,
        });
      } else {
        throw new Error('No ID token received from Google');
      }

    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      let errorMessage = 'Google sign-in failed';
      
      // Handle specific error codes
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'oauth_cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'play_services_error';
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        errorMessage = 'Sign-in is required';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Don't show alert for cancellation - let parent handle it
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(
          'Sign-In Error',
          errorMessage,
          [{ text: 'OK', style: 'default' }]
        );
      }

      // Call error callback with structured error info
      onError?.({
        type: error.code === statusCodes.SIGN_IN_CANCELLED ? 'oauth_cancelled' :
              error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ? 'play_services_error' :
              'provider_error',
        message: errorMessage,
        originalError: error,
      });
    } finally {
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
          showProgress ? (
            <OAuthLoadingIndicator
              stage={loadingStage}
              provider="Google"
              showStage={false}
              size="small"
              color={colors.text.secondary}
              style={styles.loadingIndicator}
            />
          ) : (
            <ActivityIndicator
              size="small"
              color={colors.text.secondary}
              style={styles.loadingIndicator}
              accessibilityLabel="Loading Google sign-in"
            />
          )
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