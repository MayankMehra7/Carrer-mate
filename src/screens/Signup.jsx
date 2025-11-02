// src/screens/Signup.jsx
import { useContext, useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";
import { api } from "../api/api";
import { HeadingText } from "../components/common/HeadingText";
import { PasswordInput } from "../components/common/PasswordInput";
import { ValidatedInput } from "../components/common/ValidatedInput";
import { AuthContext } from "../context/AuthContext";
import { useValidation } from "../hooks/useValidation";
import styles from "./Signup.styles";

export default function Signup({ navigation }) {
  const { loginWithOAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State for password validation - Requirements 4.5, 5.4
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordValidating, setIsPasswordValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Validation hooks for username and email
  const usernameValidation = useValidation('username', formData.username);
  const emailValidation = useValidation('email', formData.email);

  // Comprehensive form validation logic - Requirements 4.5, 5.3, 5.4
  const isFormValid = () => {
    const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
    const basicFieldsValid = formData.name.trim() && 
                            formData.username.trim() && 
                            formData.email.trim() && 
                            formData.password &&
                            formData.confirmPassword;
    
    return basicFieldsValid &&
           passwordsMatch &&
           isPasswordValid && // Requirement 4.5: Disable submit button until password requirements are satisfied
           !isPasswordValidating && // Requirement 5.4: Handle loading state during password validation
           !isSubmitting && // Prevent double submission
           usernameValidation.isValid !== false &&
           emailValidation.isValid !== false &&
           !usernameValidation.isValidating &&
           !emailValidation.isValidating;
  };

  // Password validation change handler - Requirements 4.5, 5.4
  const handlePasswordValidationChange = (isValid, isValidating = false) => {
    // Add defensive checks to ensure values are boolean
    setIsPasswordValid(Boolean(isValid));
    setIsPasswordValidating(Boolean(isValidating));
  };

  // Get form validation errors for user feedback - Requirement 6.5
  const getFormValidationErrors = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push("Full name is required");
    if (!formData.username.trim()) errors.push("Username is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.password) errors.push("Password is required");
    if (!formData.confirmPassword) errors.push("Password confirmation is required");
    
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }
    
    if (usernameValidation.isValid === false) {
      errors.push("Username is not available or invalid");
    }
    
    if (emailValidation.isValid === false) {
      errors.push("Email is not available or invalid");
    }
    
    if (!isPasswordValid && formData.password) {
      errors.push("Password does not meet security requirements");
    }
    
    return errors;
  };

  // Handle OAuth authentication success
  const handleOAuthSuccess = async (provider, oauthData) => {
    setOauthLoading(true);
    
    try {
      const result = await loginWithOAuth(provider, oauthData);
      
      if (result.ok) {
        console.log(`${provider} sign-up successful`);
        // Navigation handled by AuthContext
      } else {
        const errorMessage = result.message || `${provider} authentication failed`;
        Alert.alert("Authentication Error", errorMessage);
      }
    } catch (error) {
      Alert.alert("Network Error", `Network error during ${provider} authentication`);
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
      // User cancelled - no need to show error
      return;
    }
    
    // Set form error for non-cancellation errors
    const errorMessage = error?.message || error || `${provider} sign-up failed`;
    Alert.alert("Authentication Error", errorMessage);
  };

  const onSignup = async () => {
    // Requirement 5.3: Add form submission prevention logic based on password validation
    if (!isFormValid()) {
      const errors = getFormValidationErrors();
      const errorMessage = errors.length > 0 ? errors.join('\n• ') : "Please ensure all fields are filled correctly and password requirements are met.";
      Alert.alert("Form Invalid", `Please fix the following issues:\n• ${errorMessage}`);
      return;
    }
    
    // Requirement 5.4: Add loading state handling during form submission
    setIsSubmitting(true);
    
    try {
      const { name, username, email, password } = formData; // avoid sending confirmPassword
      const res = await api.signup({ name, username, email, password });
      
      if (res.ok) {
        Alert.alert("OTP sent", "Check your email for the verification code.");
        navigation.navigate("OtpVerify", { email: formData.email });
      } else {
        // Requirement 6.5: Include proper error handling for validation failures
        const errorMessage = res.data?.error || res.data?.message || "Signup failed";
        Alert.alert("Signup Error", errorMessage);
      }
    } catch (error) {
      // Requirement 6.5: Handle network and other errors gracefully
      console.error('Signup error:', error);
      Alert.alert("Network Error", "Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <HeadingText level="h1" style={styles.title}>Career Mate AI</HeadingText>
      <Text style={styles.subtitle}>Create your account</Text>
      
      <ValidatedInput
        label="Full Name"
        value={formData.name}
        onChangeText={(text) => setFormData({...formData, name: text})}
      />
      
      <ValidatedInput
        label="Username"
        value={formData.username}
        onChangeText={(text) => setFormData({...formData, username: text})}
        validationType="username"
        autoCapitalize="none"
      />
      
      <ValidatedInput
        label="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({...formData, email: text})}
        validationType="email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      {/* Requirements 2.1, 2.2, 2.3: Replace existing password field with enhanced validation input */}
      <PasswordInput
        value={formData.password || ''}
        onChangeText={(text) => setFormData({...formData, password: text || ''})}
        username={formData.username || ''} // Requirement 2.1: Pass username for personal info checking
        email={formData.email || ''} // Requirement 2.2: Pass email for personal info checking
        onValidationChange={handlePasswordValidationChange} // Requirement 4.5: Form submission prevention logic
        placeholder="Enter your password"
      />

      <ValidatedInput
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
        secureTextEntry
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          title={isSubmitting ? "Creating Account..." : "Create Account"}
          onPress={onSignup}
          disabled={!isFormValid() || isSubmitting || oauthLoading} // Requirements 4.5, 5.4: Disable submit button when validation fails or during submission
        />
      </View>

      {/* OAuth Section */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or sign up with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.oauthContainer}>
        <Text style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>
          OAuth buttons temporarily disabled for testing
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Already have an account? Login" 
          onPress={() => navigation.navigate("Login")} 
          color="#6c757d" 
          disabled={isSubmitting || oauthLoading}
        />
      </View>
    </ScrollView>
  );
}

