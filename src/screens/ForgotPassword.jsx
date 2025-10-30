// src/screens/ForgotPassword.jsx
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { api } from "../api/api";
import { HeadingText } from "../components/common/HeadingText";
import styles from "./ForgotPassword.styles";

export default function ForgotPassword({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const onSend = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert("Error", "Please enter both your username and email");
      return;
    }

    const res = await api.sendForgot({ username, email });
    if (res.ok) {
      Alert.alert("OTP sent", "Check your email for the reset code.");
      navigation.navigate("ResetPassword", { email });
    } else {
      Alert.alert("Error", res.data?.error || res.data?.message || "Failed to send OTP");
    }
  };

  return (
    <View style={styles.container}>
      <HeadingText level="h1" style={styles.title}>
        Career Mate AI - Reset Password
      </HeadingText>
      
      <Text style={styles.label}>Username</Text>
      <TextInput 
        value={username} 
        onChangeText={setUsername} 
        style={styles.input}
        placeholder="Enter your username"
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
      />
      
      <Text style={styles.label}>Email</Text>
      <TextInput 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input}
        placeholder="Enter your email address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />
      <Text style={styles.helperText}>
        Both username and email are required for security verification
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Send Reset Code" onPress={onSend} />
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
