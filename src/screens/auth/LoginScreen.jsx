/**
 * LoginScreen Component
 * Modern, clean login screen with email/password authentication
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import { useNavigation } from '@react-navigation/native';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import { GitHubSignInButton } from '../../components/auth/GitHubSignInButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { useOAuthFeedback } from '../../components/auth/OAuthFeedback';
import { AuthContext } from '../../context/AuthContext';

import { authStyles } from '../../styles/authStyles';
import { colors } from '../../styles/theme';
import {
    announceForAccessibility,
    announceFormSubmission,
    getButtonAccessibilityProps,
    getInputAccessibilityProps,
    getLinkAccessibilityProps,
} from '../../utils/accessibility';
import { getAuthLayoutStyles } from '../../utils/responsive';

/**
 * Modern login screen component
 */
export const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, loginWithOAuth } = useContext(AuthContext);
  const oauthFeedback = useOAuthFeedback();
  const {
    showCancellationMessage,
    cancelledProvider,
    handleOAuthCancellation,
    dismissCancellationMessage,
    retryOAuth,
    useEmailAuth,
  } = useOAuthCancellation();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Refs for focus management
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  // Get responsive layout styles
  const layoutStyles = getAuthLayoutStyles();
  
  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-focus email input
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 700);
  }, [slideAnim, fadeAnim]);
  
  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Real-time validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasInteracted(true);
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Shake animation for errors
  const triggerShakeAnimation = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };
  
  // Handle login submission
  const handleLogin = async () => {
    if (!validateForm()) {
      triggerShakeAnimation();
      announceForAccessibility('Please fix the form errors');
      return;
    }
    
    setIsLoading(true);
    announceFormSubmission(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.ok) {
        // Success
        announceFormSubmission(false, true);
        announceForAccessibility('Login successful, navigating to main app');
        
        // Store remember me preference if needed
        if (rememberMe) {
          // Store in secure storage
          console.log('Remember me enabled');
        }
        
        // Navigate to main app
        navigation.replace('Main');
      } else {
        // Handle API errors
        const errorMessage = result.message || 'Login failed';
        setErrors({ general: errorMessage });
        announceFormSubmission(false, false, errorMessage);
        triggerShakeAnimation();
      }
    } catch (error) {
      // Handle network errors
      const errorMessage = 'Network error. Please check your connection.';
      setErrors({ general: errorMessage });
      announceFormSubmission(false, false, errorMessage);
      triggerShakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth authentication success
  const handleOAuthSuccess = async (provider, oauthData) => {
    setOauthLoading(true);
    setErrors({});
    
    try {
      const result = await loginWithOAuth(provider, oauthData);
      
      if (result.ok) {
        oauthFeedback.showOAuthSuccess(provider, 'signed in');
        announceForAccessibility(`${provider} sign-in successful, navigating to main app`);
        
        // Small delay to show success message before navigation
        setTimeout(() => {
          navigation.replace('Main');
        }, 1000);
      } else {
        // Handle specific error types with appropriate feedback
        if (result.errorType === 'account_conflict') {
          oauthFeedback.showAccountConflict(provider, result.details);
        } else {
          oauthFeedback.showOAuthError(provider, result);
        }
        
        // Also set form error for inline display
        const errorMessage = result.message || `${provider} authentication failed`;
        setErrors({ general: errorMessage });
        triggerShakeAnimation();
      }
    } catch (error) {
      oauthFeedback.showNetworkError(provider);
      setErrors({ general: `Network error during ${provider} authentication` });
      triggerShakeAnimation();
    } finally {
      setOauthLoading(false);
    }
  };

  // Handle OAuth authentication errors
  const handleOAuthError = (provider, error) => {
    console.error(`${provider} OAuth error:`, error);
    setOauthLoading(false);
    
    // Handle cancellation separately
    if (error?.type === 'oauth_cancelled' || 
        (typeof error === 'string' && (error.includes('cancelled') || error.includes('cancel')))) {
      handleOAuthCancellation(provider);
      return;
    }
    
    // Show appropriate feedback based on error type
    oauthFeedback.showOAuthError(provider, error);
    
    // Set form error for non-cancellation errors
    const errorMessage = error?.message || error || `${provider} sign-in failed`;
    setErrors({ general: errorMessage });
    triggerShakeAnimation();
  };

  // Handle retry OAuth from cancellation message
  const handleRetryOAuth = (provider) => {
    // Clear any existing errors
    setErrors({});
    
    // The OAuth buttons will handle the retry automatically when pressed
    // This is just to focus user attention back to the buttons
    announceForAccessibility(`Ready to retry ${provider} sign-in`);
  };

  // Handle fallback to email auth
  const handleUseEmailAuth = () => {
    // Clear any existing errors and focus on email input
    setErrors({});
    emailInputRef.current?.focus();
    announceForAccessibility('Switched to email authentication. Please enter your email.');
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    announceForAccessibility(showPassword ? 'Password hidden' : 'Password visible');
  };
  
  // Toggle remember me
  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
    announceForAccessibility(rememberMe ? 'Remember me disabled' : 'Remember me enabled');
  };
  
  // Check if form is valid for submit button
  const isFormValid = validateEmail(formData.email) && formData.password.length >= 6;
  
  return (
    <SafeAreaView style={authStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              layoutStyles.container,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            {/* Header Section */}
            <View style={[authStyles.headerSection, layoutStyles.headerSection]}>
              <Text style={authStyles.logo}>CareerMate</Text>
              <Text style={authStyles.screenTitle}>Login to your Account</Text>
            </View>
            
            {/* Form Section */}
            <View style={[authStyles.formSection, layoutStyles.formSection]}>
              {/* Email Input */}
              <View style={[authStyles.inputGroup, layoutStyles.inputGroup]}>
                <Text style={authStyles.inputLabel}>Email</Text>
                <View
                  style={[
                    authStyles.inputContainer,
                    errors.email && authStyles.inputError,
                    formData.email && validateEmail(formData.email) && authStyles.inputSuccess,
                  ]}
                >
                  <TextInput
                    ref={emailInputRef}
                    style={authStyles.input}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    {...getInputAccessibilityProps({
                      label: 'Email',
                      value: formData.email,
                      error: errors.email,
                      required: true,
                    })}
                  />
                  {formData.email && validateEmail(formData.email) && (
                    <Icon name="check-circle" size={20} color={colors.success} />
                  )}
                </View>
                {errors.email && (
                  <Text style={authStyles.errorText}>{errors.email}</Text>
                )}
              </View>
              
              {/* Password Input */}
              <View style={[authStyles.inputGroup, layoutStyles.inputGroup]}>
                <Text style={authStyles.inputLabel}>Password</Text>
                <View
                  style={[
                    authStyles.inputContainer,
                    errors.password && authStyles.inputError,
                  ]}
                >
                  <TextInput
                    ref={passwordInputRef}
                    style={authStyles.input}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text.tertiary}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    {...getInputAccessibilityProps({
                      label: 'Password',
                      value: formData.password,
                      error: errors.password,
                      required: true,
                      secureTextEntry: !showPassword,
                    })}
                  />
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={authStyles.eyeButton}
                    {...getButtonAccessibilityProps({
                      label: showPassword ? 'Hide password' : 'Show password',
                      hint: 'Double tap to toggle password visibility',
                    })}
                  >
                    <Icon
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.text.tertiary}
                      style={showPassword && authStyles.eyeIconActive}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={authStyles.errorText}>{errors.password}</Text>
                )}
              </View>
              
              {/* Remember Me Checkbox */}
              <TouchableOpacity
                style={authStyles.checkboxContainer}
                onPress={toggleRememberMe}
                {...getButtonAccessibilityProps({
                  label: `Remember me, ${rememberMe ? 'checked' : 'unchecked'}`,
                  hint: 'Double tap to toggle remember me',
                })}
              >
                <View
                  style={[
                    authStyles.checkbox,
                    rememberMe && authStyles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Icon name="check" size={14} color={colors.white} />
                  )}
                </View>
                <Text style={authStyles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
              
              {/* General Error Message */}
              {errors.general && (
                <Text style={authStyles.generalError}>{errors.general}</Text>
              )}
              
              {/* Sign In Button */}
              <TouchableOpacity
                style={[
                  authStyles.primaryButton,
                  layoutStyles.button,
                  (!isFormValid || isLoading || oauthLoading) && authStyles.primaryButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading || oauthLoading}
                {...getButtonAccessibilityProps({
                  label: 'Sign In',
                  hint: 'Double tap to sign in to your account',
                  disabled: !isFormValid || isLoading || oauthLoading,
                  loading: isLoading,
                })}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text
                    style={[
                      authStyles.primaryButtonText,
                      (!isFormValid || isLoading || oauthLoading) && authStyles.primaryButtonTextDisabled,
                    ]}
                  >
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* OAuth Divider */}
              <View style={authStyles.dividerContainer}>
                <View style={authStyles.dividerLine} />
                <Text style={authStyles.dividerText}>or continue with</Text>
                <View style={authStyles.dividerLine} />
              </View>

              {/* OAuth Cancellation Message */}
              {showCancellationMessage && cancelledProvider && (
                <OAuthCancellationMessage
                  provider={cancelledProvider}
                  onRetry={() => retryOAuth(handleRetryOAuth)}
                  onUseEmailAuth={() => useEmailAuth(handleUseEmailAuth)}
                  onDismiss={dismissCancellationMessage}
                />
              )}

              {/* OAuth Buttons */}
              <View style={authStyles.oauthContainer}>
                <GoogleSignInButton
                  onSuccess={(data) => handleOAuthSuccess('google', data)}
                  onError={(error) => handleOAuthError('Google', error)}
                  loading={oauthLoading}
                  disabled={isLoading}
                  style={[authStyles.oauthButton, layoutStyles.button]}
                />
                
                <GitHubSignInButton
                  onSuccess={(data) => handleOAuthSuccess('github', data)}
                  onError={(error) => handleOAuthError('GitHub', error)}
                  loading={oauthLoading}
                  disabled={isLoading}
                  style={[authStyles.oauthButton, layoutStyles.button]}
                />
              </View>
            </View>
            
            {/* Footer */}
            <View style={[authStyles.footer, layoutStyles.footer]}>
              <Text style={authStyles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signup')}
                {...getLinkAccessibilityProps({
                  label: 'Sign up',
                  hint: 'Navigate to create account screen',
                })}
              >
                <Text style={authStyles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;