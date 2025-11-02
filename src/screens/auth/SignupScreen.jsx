/**
 * SignupScreen Component
 * Simple, working signup screen with OAuth support
 */

import { useNavigation } from '@react-navigation/native';
import { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../api/api';
import { GitHubSignInButton } from '../../components/auth/GitHubSignInButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { AuthContext } from '../../context/AuthContext';

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dddddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666666',
    fontSize: 14,
  },
  oauthContainer: {
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  footerLink: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancellationMessage: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  cancellationText: {
    color: '#333333',
    fontSize: 14,
    marginBottom: 10,
  },
  dismissButton: {
    alignSelf: 'flex-start',
  },
  dismissText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
};

export const SignupScreen = () => {
  const navigation = useNavigation();
  const { loginWithOAuth } = useContext(AuthContext);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCancellationMessage, setShowCancellationMessage] = useState(false);
  const [cancelledProvider, setCancelledProvider] = useState(null);
  
  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Name validation
  const validateName = (name) => {
    return name.trim().length >= 2;
  };
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Handle signup submission
  const handleSignup = async () => {
    // Validate form
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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const { name, email, password } = formData;
      const result = await api.signup({ name, username: name.toLowerCase().replace(/\s+/g, ''), email, password });
      
      if (result.ok) {
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
        const errorMessage = result.data?.error || result.data?.message || 'Signup failed';
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection.' });
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
        console.log(`${provider} sign-up successful`);
        // Navigation handled by AuthContext
      } else {
        const errorMessage = result.message || `${provider} authentication failed`;
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      setErrors({ general: `Network error during ${provider} authentication` });
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
      setCancelledProvider(provider);
      setShowCancellationMessage(true);
      return;
    }
    
    // Set form error for non-cancellation errors
    const errorMessage = error?.message || error || `${provider} sign-up failed`;
    setErrors({ general: errorMessage });
  };
  
  // Check if form is valid for submit button
  const isFormValid = (
    validateName(formData.name) &&
    validateEmail(formData.email) &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.title}>CareerMate</Text>
          <Text style={styles.subtitle}>Create your account</Text>
          
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoComplete="name"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>
          
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>
          
          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              placeholder="Create a strong password"
              secureTextEntry
              autoComplete="new-password"
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>
          
          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>
          
          {/* General Error Message */}
          {errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}
          
          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || isLoading || oauthLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={!isFormValid || isLoading || oauthLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* OAuth Section */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth Cancellation Message */}
          {showCancellationMessage && cancelledProvider && (
            <View style={styles.cancellationMessage}>
              <Text style={styles.cancellationText}>
                {cancelledProvider} sign-up was cancelled. You can try again or use email registration.
              </Text>
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setShowCancellationMessage(false)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OAuth Buttons */}
          <View style={styles.oauthContainer}>
            <GoogleSignInButton
              onSuccess={(data) => handleOAuthSuccess('google', data)}
              onError={(error) => handleOAuthError('Google', error)}
              loading={oauthLoading}
              disabled={isLoading}
              text="Sign up with Google"
            />
            
            <GitHubSignInButton
              onSuccess={(data) => handleOAuthSuccess('github', data)}
              onError={(error) => handleOAuthError('GitHub', error)}
              loading={oauthLoading}
              disabled={isLoading}
              text="Sign up with GitHub"
            />
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;