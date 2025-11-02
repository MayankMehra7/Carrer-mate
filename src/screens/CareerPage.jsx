// src/screens/CareerPage.jsx
import { useContext, useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { HeadingText } from "../components/common/HeadingText";
import { FeatureFlagHelpers, FeatureFlags } from "../config/featureFlags";
import { AuthContext } from "../context/AuthContext";
import { featureFlagManager } from "../services/FeatureFlagManager";
import styles from "./CareerPage.styles";

export default function CareerPage({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  // Feature flag state
  const [featureFlags, setFeatureFlags] = useState({
    resumeTemplatesEnabled: true,
    aiSuggestionsEnabled: true,
    resumeUploadEnabled: true,
    coverLetterGeneration: true,
    jobDescriptionParsing: true,
    liveEditDemo: false,
    debugMode: false,
  });

  // Load feature flags on component mount
  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        // Load all relevant feature flags (Requirements: 3.1, 3.2, 3.3, 3.4)
        const flags = await FeatureFlagHelpers.getMultipleFlags([
          FeatureFlags.RESUME_TEMPLATES_ENABLED,
          FeatureFlags.AI_SUGGESTIONS_ENABLED,
          FeatureFlags.RESUME_UPLOAD_ENABLED,
          FeatureFlags.COVER_LETTER_GENERATION,
          FeatureFlags.JOB_DESCRIPTION_PARSING,
          FeatureFlags.LIVE_EDIT_DEMO,
          FeatureFlags.DEBUG_MODE,
        ]);

        setFeatureFlags({
          resumeTemplatesEnabled: flags[FeatureFlags.RESUME_TEMPLATES_ENABLED],
          aiSuggestionsEnabled: flags[FeatureFlags.AI_SUGGESTIONS_ENABLED],
          resumeUploadEnabled: flags[FeatureFlags.RESUME_UPLOAD_ENABLED],
          coverLetterGeneration: flags[FeatureFlags.COVER_LETTER_GENERATION],
          jobDescriptionParsing: flags[FeatureFlags.JOB_DESCRIPTION_PARSING],
          liveEditDemo: flags[FeatureFlags.LIVE_EDIT_DEMO],
          debugMode: flags[FeatureFlags.DEBUG_MODE],
        });
      } catch (error) {
        console.error('Error loading feature flags for CareerPage:', error);
        // Keep default values if feature flag loading fails
      }
    };

    loadFeatureFlags();
  }, []);

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

        {/* Resume Templates - Conditionally rendered based on feature flag */}
        {featureFlags.resumeTemplatesEnabled && (
          <View style={styles.featureCard}>
            <HeadingText level="h3" style={styles.featureTitle}>📄 Resume Templates</HeadingText>
            <Text style={styles.featureDescription}>Browse professional LaTeX resume templates</Text>
            <Button
              title="🎨 Browse Templates"
              onPress={() => navigation.navigate("ResumeTemplates")}
              color="#6f42c1"
            />
          </View>
        )}

        {/* Resume Builder & Analysis - Conditionally rendered based on feature flags */}
        {(featureFlags.aiSuggestionsEnabled || featureFlags.resumeUploadEnabled) && (
          <View style={styles.featureCard}>
            <HeadingText level="h3" style={styles.featureTitle}>📄 Resume Builder & Analysis</HeadingText>
            <Text style={styles.featureDescription}>
              Build, edit{featureFlags.aiSuggestionsEnabled ? ', and get AI-powered feedback on' : ' your'} resume
            </Text>
            <View style={styles.buttonRow}>
              <Button title="📝 Build Resume" onPress={() => navigation.navigate("ResumeEditor")} />
              <View style={styles.buttonSpacing} />
              <Button title="👁️ Live Preview" onPress={() => navigation.navigate("ResumePreview")} color="#007AFF" />
            </View>
            {featureFlags.resumeUploadEnabled && (
              <>
                <View style={styles.buttonSpacing} />
                <Button title="📤 Upload & Analyze" onPress={() => navigation.navigate("ResumeUpload")} color="#28a745" />
              </>
            )}
          </View>
        )}

        {/* Live Edit Demo - Conditionally rendered based on feature flag */}
        {featureFlags.liveEditDemo && (
          <View style={styles.featureCard}>
            <HeadingText level="h3" style={styles.featureTitle}>🔧 Live Edit Demo</HeadingText>
            <Text style={styles.featureDescription}>Try our experimental live editing features</Text>
            <Button
              title="🚀 Try Live Demo"
              onPress={() => {/* Navigate to live demo */}}
              color="#ff6b35"
            />
          </View>
        )}

        {/* Smart Cover Letters - Conditionally rendered based on feature flags */}
        {featureFlags.coverLetterGeneration && featureFlags.jobDescriptionParsing && (
          <View style={styles.featureCard}>
            <HeadingText level="h3" style={styles.featureTitle}>💼 Smart Cover Letters</HeadingText>
            <Text style={styles.featureDescription}>Generate personalized cover letters from job descriptions using your stored resume</Text>
            <Button
              title="Generate Cover Letter from JD"
              onPress={() => navigation.navigate("JobDescriptionCover")}
              color="#007AFF"
            />
          </View>
        )}

        {/* Custom Cover Letters - Conditionally rendered based on feature flag */}
        {featureFlags.coverLetterGeneration && (
          <View style={styles.featureCard}>
            <HeadingText level="h3" style={styles.featureTitle}>✍️ Custom Cover Letters</HeadingText>
            <Text style={styles.featureDescription}>Create cover letters with manual resume input</Text>
            <Button
              title="Create Custom Cover Letter"
              onPress={() => navigation.navigate("CoverPreview", { resume_text: "" })}
              color="#28a745"
            />
          </View>
        )}

        {/* Debug Information - Only show in debug mode */}
        {featureFlags.debugMode && (
          <View style={[styles.featureCard, { backgroundColor: '#f8f9fa', borderColor: '#6c757d' }]}>
            <HeadingText level="h3" style={[styles.featureTitle, { color: '#6c757d' }]}>🐛 Debug Info</HeadingText>
            <Text style={styles.featureDescription}>Feature flag status and app diagnostics</Text>
            <Button
              title="View Debug Info"
              onPress={() => {
                const stats = featureFlagManager.getStats();
                console.log('Feature Flag Stats:', stats);
                alert(`Feature Flags: ${stats.serviceHealthy ? 'Healthy' : 'Degraded'}\nCache Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
              }}
              color="#6c757d"
            />
          </View>
        )}
      </View>

      <View style={styles.logoutContainer}>
        <Button title="🚪 Logout" onPress={() => logout()} color="#dc3545" />
      </View>
    </ScrollView>
  );
}

