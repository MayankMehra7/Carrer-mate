// src/screens/OtpVerify.jsx
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { api } from "../api/api";
import { HeadingText } from "../components/common/HeadingText";
import styles from "./OtpVerify.styles";

export default function OtpVerify({ route, navigation }) {
  const emailFromRoute = route.params?.email || "";
  const [email, setEmail] = useState(emailFromRoute);
  const [otp, setOtp] = useState("");

  const onVerify = async () => {
    const res = await api.verifyOtp({ email, otp });
    if (res.ok) {
      Alert.alert("Verified", "Email verified. Please login.");
      navigation.navigate("Login");
    } else {
      Alert.alert("Error", res.data?.message || "Invalid OTP");
    }
  };

  return (
    <View style={styles.container}>
      <HeadingText level="h1" style={styles.title}>Career Mate AI</HeadingText>
      <Text style={styles.subtitle}>Verify your email address</Text>
      
      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email address" />
      <Text style={styles.label}>Verification Code</Text>
      <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" style={styles.input} placeholder="Enter 6-digit code" maxLength={6} />
      <View style={styles.buttonContainer}>
        <Button title="Verify Email" onPress={onVerify} />
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
