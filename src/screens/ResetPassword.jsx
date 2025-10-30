// src/screens/ResetPassword.jsx
import { useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import { api } from "../api/api";
import { HeadingText } from "../components/common/HeadingText";
import styles from "./ResetPassword.styles";

export default function ResetPassword({ route, navigation }) {
  const emailFromRoute = route.params?.email || "";
  const [email, setEmail] = useState(emailFromRoute);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const onReset = async () => {
    if (!passwordsMatch) return;
    const res = await api.resetPassword({ email, otp, new_password: newPassword });
    if (res.ok) {
      Alert.alert("Success", "Password reset. Please login.");
      navigation.navigate("Login");
    } else {
      Alert.alert("Error", res.data?.message || "Failed to reset");
    }
  };

  return (
    <View style={styles.container}>
      <HeadingText level="h1" style={styles.title}>
        Career Mate AI - Reset Password
      </HeadingText>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        editable={false}
        placeholder="Email address"
      />

      <Text style={styles.label}>Reset Code</Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        style={styles.input}
        keyboardType="number-pad"
        placeholder="Enter 6-digit code from email"
        maxLength={6}
      />

      <Text style={styles.label}>New Password</Text>
      <View style={styles.relativeContainer}>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          style={[styles.input, styles.inputWithToggle]}
          placeholder="Enter new password"
        />
        <Pressable
          onPress={() => setShowNewPassword((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {showNewPassword ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Confirm New Password</Text>
      <View style={styles.relativeContainer}>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          style={[styles.input, styles.inputWithToggle]}
          placeholder="Confirm new password"
        />
        <Pressable
          onPress={() => setShowConfirmPassword((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {showConfirmPassword ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>

      {newPassword && confirmPassword && !passwordsMatch && (
        <Text style={styles.errorText}>Passwords do not match</Text>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          title="Reset Password" 
          onPress={onReset} 
          disabled={!passwordsMatch || !otp || !newPassword}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="← Back to Login" 
          onPress={() => navigation.navigate("Login")}
          color="#6c757d"
        />
      </View>
    </View>
  );
}
