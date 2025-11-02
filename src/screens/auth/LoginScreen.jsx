/**
 * LoginScreen Component
 * Simple, working login screen with OAuth support
 */

import { useNavigation } from '@react-navigation/native';
import { useContext, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    backgroundColor: '#007bff',
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

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, loginWithOAuth } = useContext(AuthContext);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Handle login submission
  const handleLogin = async () => {
    // Validate form
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.ok) {
        // Success - navigation handled by AuthContext
        console.log('Login successful');
      } else {
        setErrors({ general: result.message || 'Login failed' });
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
        console.log(`${provider} sign-in successful`);
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
    const errorMessage = error?.message || error || `${provider} sign-in failed`;
    setErrors({ general: errorMessage });
  };
  
  // Check if form is valid for submit button
  const isFormValid = validateEmail(formData.email) && formData.password.length > 0;
  
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
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
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
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>
          
          {/* General Error Message */}
          {errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}
          
          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || isLoading || oauthLoading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading || oauthLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* OAuth Section */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth Cancellation Message */}
          {showCancellationMessage && cancelledProvider && (
            <View style={styles.cancellationMessage}>
              <Text style={styles.cancellationText}>
                {cancelledProvider} sign-in was cancelled. You can try again or use email login.
              </Text>
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setShowCancellationMessage(false)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Simple OAuth Test */}
          <SimpleOAuthTest />
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;