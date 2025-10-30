import { useContext, useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import { HeadingText } from "../components/common/HeadingText";
import { AuthContext } from "../context/AuthContext";
import styles from "./Login.styles";

export default function Login({ navigation }) {
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    const res = await login(identifier, password);
    if (!res.ok) Alert.alert("Login failed", res.message || "Try again");
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
        <Button title="Login" onPress={onLogin} />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Create Account"
          onPress={() => navigation.navigate("Signup")}
          color="#28a745"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Forgot Password?"
          onPress={() => navigation.navigate("ForgotPassword")}
          color="#6c757d"
        />
      </View>
    </View>
  );
}
