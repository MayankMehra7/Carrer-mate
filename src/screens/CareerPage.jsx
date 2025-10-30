// src/screens/CareerPage.jsx
import { useContext } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { HeadingText } from "../components/common/HeadingText";
import { AuthContext } from "../context/AuthContext";
import styles from "./CareerPage.styles";

export default function CareerPage({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <HeadingText level="h1" style={styles.welcomeText}>Welcome to Career Mate AI</HeadingText>
        <Text style={styles.userText}>{user?.name || user?.email}</Text>
        <Button
          title="👤 View Profile"
          onPress={() => navigation.navigate("UserProfile")}
          color="#6c757d"
        />
      </View>

      <View style={styles.featuresContainer}>
        <HeadingText level="h2" style={styles.sectionTitle}>🚀 AI-Powered Career Tools</HeadingText>

        <View style={styles.featureCard}>
          <HeadingText level="h3" style={styles.featureTitle}>📄 Resume Templates</HeadingText>
          <Text style={styles.featureDescription}>Browse professional LaTeX resume templates</Text>
          <Button
            title="🎨 Browse Templates"
            onPress={() => navigation.navigate("ResumeTemplates")}
            color="#6f42c1"
          />
        </View>

        <View style={styles.featureCard}>
          <HeadingText level="h3" style={styles.featureTitle}>📄 Resume Builder & Analysis</HeadingText>
          <Text style={styles.featureDescription}>Build, edit, and get AI-powered feedback on your resume</Text>
          <View style={styles.buttonRow}>
            <Button title="📝 Build Resume" onPress={() => navigation.navigate("ResumeEditor")} />
            <View style={styles.buttonSpacing} />
            <Button title="👁️ Live Preview" onPress={() => navigation.navigate("ResumePreview")} color="#007AFF" />
          </View>
          <View style={styles.buttonSpacing} />
          <Button title="📤 Upload & Analyze" onPress={() => navigation.navigate("ResumeUpload")} color="#28a745" />
        </View>

        {/* Live Edit Demo - Temporarily disabled */}
        {/* <LiveEditDemo /> */}

        <View style={styles.featureCard}>
          <HeadingText level="h3" style={styles.featureTitle}>💼 Smart Cover Letters</HeadingText>
          <Text style={styles.featureDescription}>Generate personalized cover letters from job descriptions using your stored resume</Text>
          <Button
            title="Generate Cover Letter from JD"
            onPress={() => navigation.navigate("JobDescriptionCover")}
            color="#007AFF"
          />
        </View>

        <View style={styles.featureCard}>
          <HeadingText level="h3" style={styles.featureTitle}>✍️ Custom Cover Letters</HeadingText>
          <Text style={styles.featureDescription}>Create cover letters with manual resume input</Text>
          <Button
            title="Create Custom Cover Letter"
            onPress={() => navigation.navigate("CoverPreview", { resume_text: "" })}
            color="#28a745"
          />
        </View>
      </View>

      <View style={styles.logoutContainer}>
        <Button title="🚪 Logout" onPress={() => logout()} color="#dc3545" />
      </View>
    </ScrollView>
  );
}

