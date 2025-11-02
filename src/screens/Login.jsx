import { useContext, useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import SimpleOAuthTest from "../components/auth/SimpleOAuthTest";
import { HeadingText } from "../components/common/HeadingText";
import { AuthContext } from "../context/AuthContext";
import styles from "./Login.styles";

export default function Login({ navigation }) {
  const { login, loginWithOAuth } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const onLogin = async () => {
    const res = await login(identifier, password);
    if (!res.ok) Alert.alert("Login failed", res.message || "Try again");
  };

  // Handle OAuth authentication success
  const handleOAuthSuccess = async (provider, oauthData) => {
    setOauthLoading(true);
    
    try {
      const result = await loginWithOAuth(provider, oauthData);
      
      if (result.ok) {
        console.log(`${provider} sign-in successful`);
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
    const errorMessage = error?.message || error || `${provider} sign-in failed`;
    Alert.alert("Authentication Error", errorMessage);
  };

  return (
    <View style={styles.container}>
      <HeadingText level="h1" style={styles.title}>
        Career Mate AI
      </HeadingText>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <Text style={styles.label}>Email or Username</Text>
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        style={styles.input}
        placeholder="Enter your email or username"
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
      />
      <Text style={styles.helperText}>You can login with either your email address or username</Text>

      <Text style={styles.label}>Password</Text>
      <View style={styles.relativeContainer}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={[styles.input, styles.inputWithToggle]}
          autoComplete="password"
        />
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={onLogin} disabled={oauthLoading} />
      </View>

      {/* OAuth Section */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.oauthContainer}>
        <SimpleOAuthTest />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Create Account"
          onPress={() => navigation.navigate("Signup")}
          color="#28a745"
          disabled={oauthLoading}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Forgot Password?"
          onPress={() => navigation.navigate("ForgotPassword")}
          color="#6c757d"
          disabled={oauthLoading}
        />
      </View>
    </View>
  );
}
