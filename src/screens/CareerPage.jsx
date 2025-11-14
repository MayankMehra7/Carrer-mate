// src/screens/CareerPage.jsx
import { useContext, useEffect, useState } from "react";
import { Button, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { HeadingText } from "../components/common/HeadingText";
import { FeatureFlagHelpers, FeatureFlags } from "../config/featureFlags";
import { AuthContext } from "../context/AuthContext";
import { featureFlagManager } from "../services/FeatureFlagManager";
import styles from "./CareerPage.styles";

export default function CareerPage({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  // Loading state
  const [isLoadingFlags, setIsLoadingFlags] = useState(true);
  
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
        console.log('[CareerPage] Loading feature flags...');
        
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

        console.log('[CareerPage] Loaded flags:', flags);
        console.log('[CareerPage] Flag values:', {
          resumeTemplatesEnabled: flags[FeatureFlags.RESUME_TEMPLATES_ENABLED],
          aiSuggestionsEnabled: flags[FeatureFlags.AI_SUGGESTIONS_ENABLED],
          resumeUploadEnabled: flags[FeatureFlags.RESUME_UPLOAD_ENABLED],
          coverLetterGeneration: flags[FeatureFlags.COVER_LETTER_GENERATION],
          jobDescriptionParsing: flags[FeatureFlags.JOB_DESCRIPTION_PARSING],
        });

        setFeatureFlags({
          resumeTemplatesEnabled: flags[FeatureFlags.RESUME_TEMPLATES_ENABLED],
          aiSuggestionsEnabled: flags[FeatureFlags.AI_SUGGESTIONS_ENABLED],
          resumeUploadEnabled: flags[FeatureFlags.RESUME_UPLOAD_ENABLED],
          coverLetterGeneration: flags[FeatureFlags.COVER_LETTER_GENERATION],
          jobDescriptionParsing: flags[FeatureFlags.JOB_DESCRIPTION_PARSING],
          liveEditDemo: flags[FeatureFlags.LIVE_EDIT_DEMO],
          debugMode: flags[FeatureFlags.DEBUG_MODE],
        });
        
        console.log('[CareerPage] Feature flags set successfully');
      } catch (error) {
        console.error('[CareerPage] Error loading feature flags:', error);
        console.error('[CareerPage] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Explicitly set default feature flags in catch block
        setFeatureFlags({
          resumeTemplatesEnabled: true,
          aiSuggestionsEnabled: true,
          resumeUploadEnabled: true,
          coverLetterGeneration: true,
          jobDescriptionParsing: true,
          liveEditDemo: false,
          debugMode: false,
        });
        
        console.log('[CareerPage] Default feature flags set after error');
      } finally {
        setIsLoadingFlags(false);
      }
    };

    loadFeatureFlags();
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      {/* Header with User Info */}
      <View style={styles.header}>
        <Text style={styles.userText}>{user?.name || user?.email || 'User'}</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={logout}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content with Sidebar */}
      <View style={styles.mainContent}>
        {/* Vertical Navigation Sidebar */}
        {!isLoadingFlags && (
          <View style={styles.sidebar}>
            <HeadingText level="h2" style={styles.sidebarTitle}>Career</HeadingText>
            
            {featureFlags.resumeTemplatesEnabled && (
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => navigation.navigate("ResumeTemplates")}
              >
                <Text style={styles.sidebarIcon}>📄</Text>
                <Text style={styles.sidebarText}>Resume Templates</Text>
              </TouchableOpacity>
            )}
            
            {(featureFlags.aiSuggestionsEnabled || featureFlags.resumeUploadEnabled) && (
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => navigation.navigate("ResumeEditor")}
              >
                <Text style={styles.sidebarIcon}>📝</Text>
                <Text style={styles.sidebarText}>Resume Builder</Text>
              </TouchableOpacity>
            )}
            
            {featureFlags.coverLetterGeneration && featureFlags.jobDescriptionParsing && (
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => navigation.navigate("JobDescriptionCover")}
              >
                <Text style={styles.sidebarIcon}>💼</Text>
                <Text style={styles.sidebarText}>Smart Cover Letters</Text>
              </TouchableOpacity>
            )}
            
            {featureFlags.coverLetterGeneration && (
              <TouchableOpacity 
                style={styles.sidebarItem}
                onPress={() => navigation.navigate("CoverPreview", { resume_text: "" })}
              >
                <Text style={styles.sidebarIcon}>✍️</Text>
                <Text style={styles.sidebarText}>Custom Cover Letters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Center Content */}
        <View style={styles.centerContent}>
          {isLoadingFlags ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading features...</Text>
        </View>
      ) : (
        <View style={styles.welcomeContainer}>
          <HeadingText level="h1" style={styles.welcomeTitle}>Welcome to Career Mate AI</HeadingText>
          <Text style={styles.welcomeSubtitle}>Your AI-powered career assistant</Text>
          
          <View style={styles.quickActions}>
            <HeadingText level="h2" style={styles.sectionTitle}>Quick Actions</HeadingText>
            
            <View style={styles.actionButtons}>
              {featureFlags.resumeUploadEnabled && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("ResumeUpload")}
                >
                  <Text style={styles.actionButtonIcon}>📤</Text>
                  <Text style={styles.actionButtonText}>Upload Resume</Text>
                </TouchableOpacity>
              )}
              
              {featureFlags.aiSuggestionsEnabled && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("ResumeUpload")}
                >
                  <Text style={styles.actionButtonIcon}>🤖</Text>
                  <Text style={styles.actionButtonText}>Get AI Feedback</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("ResumePreview")}
              >
                <Text style={styles.actionButtonIcon}>👁️</Text>
                <Text style={styles.actionButtonText}>Preview Resume</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("UserProfile")}
              >
                <Text style={styles.actionButtonIcon}>👤</Text>
                <Text style={styles.actionButtonText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

