import { useContext, useState } from "react";
import { Alert, View, Text } from "react-native";
import { HeadingText } from "../components/common/HeadingText";
import { ComprehensiveOAuthButton } from "../components/oauth/ComprehensiveOAuthButton";
import StyledButton from "../components/common/StyledButton";
import StyledTextInput from "../components/common/StyledTextInput";
import { AuthContext } from "../context/AuthContext";
import styles from "./Login.styles";

export default function Login({ navigation }) {
  const { login } = useContext(AuthContext);
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    const res = await login(identifier, password);
    if (!res.ok) Alert.alert("Login failed", res.message || "Try again");
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <HeadingText level="h1" style={styles.title}>
        Career Mate AI
      </HeadingText>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <StyledTextInput
        label="Email or Username"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Enter your email or username"
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
      />

      <StyledTextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        rightIcon={showPassword ? "eye-off" : "eye"}
        onRightIconPress={() => setShowPassword(!showPassword)}
      />

      <StyledButton title="Login" onPress={onLogin} loading={loading} />

      {/* OAuth Section */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.oauthContainer}>
        <ComprehensiveOAuthButton
          provider="google"
          onSuccess={(result) => {
            console.log('Google OAuth successful!', result);
            // Navigation will happen automatically via AuthContext user state change
          }}
          onError={(error) => Alert.alert('OAuth Error', error.message || 'Google authentication failed')}
        />
        <View style={{ height: 10 }} />
        <ComprehensiveOAuthButton
          provider="github"
          onSuccess={(result) => {
            console.log('GitHub OAuth successful!', result);
            // Navigation will happen automatically via AuthContext user state change
          }}
          onError={(error) => Alert.alert('OAuth Error', error.message || 'GitHub authentication failed')}
        />
      </View>

      <StyledButton
        title="Create Account"
        onPress={() => navigation.navigate("Signup")}
        style={{ marginTop: 10, backgroundColor: '#28a745' }}
      />
      <StyledButton
        title="Forgot Password?"
        onPress={() => navigation.navigate("ForgotPassword")}
        style={{ marginTop: 10, backgroundColor: '#6c757d' }}
      />
    </View>
  );
}
