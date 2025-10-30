/**
 * SignupScreen Component
 * Modern, clean signup screen with comprehensive form validation
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { useNavigation } from '@react-navigation/native';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import { GitHubSignInButton } from '../../components/auth/GitHubSignInButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { useOAuthFeedback } from '../../components/auth/OAuthFeedback';
import { AuthContext } from '../../context/AuthContext';

import { ConditionalPasswordValidation } from '../../components/common/ConditionalPasswordValidation';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
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
 * Modern signup screen component with integrated password validation
 */
export const SignupScreen = () => {
  const navigation = useNavigation();
  const { loginWithOAuth } = useContext(AuthContext);
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
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Refs for focus management
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  
  // Password validation hook
  const passwordValidation = usePasswordValidation(
    formData.password,
    formData.name,
    formData.email
  );
  
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
    
    // Auto-focus name input
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 700);
  }, [slideAnim, fadeAnim]);
  
  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Name validation
  const validateName = (name) => {
    return name.trim().length >= 2;
  };
  
  // Real-time validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!passwordValidation.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
  
  // Handle signup submission
  const handleSignup = async () => {
    if (!validateForm()) {
      triggerShakeAnimation();
      announceForAccessibility('Please fix the form errors');
      return;
    }
    
    setIsLoading(true);
    announceFormSubmission(true);
    
    try {
      // API call to signup endpoint
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.name.toLowerCase().replace(/\s+/g, ''), // Generate username from name
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        announceFormSubmission(false, true);
        announceForAccessibility('Account created successfully');
        
        // Show success message and navigate to login
        Alert.alert(
          'Success!',
          'Account created successfully. Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        // Handle API errors
        const errorMessage = data.error || 'Signup failed';
        if (data.details && Array.isArray(data.details)) {
          // Handle validation errors from backend
          setErrors({ general: data.details.join('. ') });
        } else {
          setErrors({ general: errorMessage });
        }
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
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    announceForAccessibility(showPassword ? 'Password hidden' : 'Password visible');
  };
  
  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    announceForAccessibility(showConfirmPassword ? 'Confirm password hidden' : 'Confirm password visible');
  };

  // Handle OAuth authentication success
  const handleOAuthSuccess = async (provider, oauthData) => {
    setOauthLoading(true);
    setErrors({});
    
    try {
      const result = await loginWithOAuth(provider, oauthData);
      
      if (result.ok) {
        oauthFeedback.showOAuthSuccess(provider, 'signed up');
        announceForAccessibility(`${provider} sign-up successful, navigating to main app`);
        
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
    const errorMessage = error?.message || error || `${provider} sign-up failed`;
    setErrors({ general: errorMessage });
    triggerShakeAnimation();
  };

  // Handle retry OAuth from cancellation message
  const handleRetryOAuth = (provider) => {
    // Clear any existing errors
    setErrors({});
    
    // The OAuth buttons will handle the retry automatically when pressed
    announceForAccessibility(`Ready to retry ${provider} sign-up`);
  };

  // Handle fallback to email auth
  const handleUseEmailAuth = () => {
    // Clear any existing errors and focus on name input
    setErrors({});
    nameInputRef.current?.focus();
    announceForAccessibility('Switched to email registration. Please fill out the form.');
  };
  
  // Check if form is valid for submit button
  const isFormValid = (
    validateName(formData.name) &&
    validateEmail(formData.email) &&
    passwordValidation.isValid &&
    formData.password === formData.confirmPassword
  );
  
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
            {/* Back Button */}
            <TouchableOpacity
              style={authStyles.backButton}
              onPress={() => navigation.goBack()}
              {...getButtonAccessibilityProps({
                label: 'Go back',
                hint: 'Navigate back to login screen',
              })}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            
            {/* Header Section */}
            <View style={[authStyles.headerSection, layoutStyles.headerSection]}>
              <Text style={authStyles.logo}>CareerMate</Text>
              <Text style={authStyles.screenTitle}>Create your Account</Text>
            </View>
            
            {/* Form Section */}
            <View style={[authStyles.formSection, layoutStyles.formSection]}>
              {/* Name Input */}
              <View style={[authStyles.inputGroup, layoutStyles.inputGroup]}>
                <Text style={authStyles.inputLabel}>Full Name</Text>
                <View
                  style={[
                    authStyles.inputContainer,
                    errors.name && authStyles.inputError,
                    formData.name && validateName(formData.name) && authStyles.inputSuccess,
                  ]}
                >
                  <TextInput
                    ref={nameInputRef}
                    style={authStyles.input}
                    value={formData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    {...getInputAccessibilityProps({
                      label: 'Full Name',
                      value: formData.name,
                      error: errors.name,
                      required: true,
                    })}
                  />
                  {formData.name && validateName(formData.name) && (
                    <Icon name="check-circle" size={20} color={colors.success} />
                  )}
                </View>
                {errors.name && (
                  <Text style={authStyles.errorText}>{errors.name}</Text>
                )}
              </View>
              
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
                    placeholder="Create a strong password"
                    placeholderTextColor={colors.text.tertiary}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
                
                {/* Conditional Password Validation Display */}
                {formData.password.length > 0 && !passwordValidation.isValid && hasInteracted && (
                  <ConditionalPasswordValidation
                    password={formData.password}
                    username={formData.name}
                    email={formData.email}
                    hasUserInteracted={hasInteracted}
                  />
                )}
              </View>
              
              {/* Confirm Password Input */}
              <View style={[authStyles.inputGroup, layoutStyles.inputGroup]}>
                <Text style={authStyles.inputLabel}>Confirm Password</Text>
                <View
                  style={[
                    authStyles.inputContainer,
                    errors.confirmPassword && authStyles.inputError,
                    formData.confirmPassword && 
                    formData.password === formData.confirmPassword && 
                    authStyles.inputSuccess,
                  ]}
                >
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={authStyles.input}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.text.tertiary}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                    {...getInputAccessibilityProps({
                      label: 'Confirm Password',
                      value: formData.confirmPassword,
                      error: errors.confirmPassword,
                      required: true,
                      secureTextEntry: !showConfirmPassword,
                    })}
                  />
                  <TouchableOpacity
                    onPress={toggleConfirmPasswordVisibility}
                    style={authStyles.eyeButton}
                    {...getButtonAccessibilityProps({
                      label: showConfirmPassword ? 'Hide confirm password' : 'Show confirm password',
                      hint: 'Double tap to toggle confirm password visibility',
                    })}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.text.tertiary}
                      style={showConfirmPassword && authStyles.eyeIconActive}
                    />
                  </TouchableOpacity>
                  {formData.confirmPassword && 
                   formData.password === formData.confirmPassword && (
                    <Icon name="check-circle" size={20} color={colors.success} />
                  )}
                </View>
                {errors.confirmPassword && (
                  <Text style={authStyles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
              
              {/* General Error Message */}
              {errors.general && (
                <Text style={authStyles.generalError}>{errors.general}</Text>
              )}
              
              {/* Sign Up Button */}
              <TouchableOpacity
                style={[
                  authStyles.primaryButton,
                  layoutStyles.button,
                  (!isFormValid || isLoading || oauthLoading) && authStyles.primaryButtonDisabled,
                ]}
                onPress={handleSignup}
                disabled={!isFormValid || isLoading || oauthLoading}
                {...getButtonAccessibilityProps({
                  label: 'Sign Up',
                  hint: 'Double tap to create your account',
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
                    Sign Up
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
                  text="Sign up with Google"
                />
                
                <GitHubSignInButton
                  onSuccess={(data) => handleOAuthSuccess('github', data)}
                  onError={(error) => handleOAuthError('GitHub', error)}
                  loading={oauthLoading}
                  disabled={isLoading}
                  style={[authStyles.oauthButton, layoutStyles.button]}
                  text="Sign up with GitHub"
                />
              </View>
            </View>
            
            {/* Footer */}
            <View style={[authStyles.footer, layoutStyles.footer]}>
              <Text style={authStyles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                {...getLinkAccessibilityProps({
                  label: 'Sign in',
                  hint: 'Navigate to login screen',
                })}
              >
                <Text style={authStyles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;