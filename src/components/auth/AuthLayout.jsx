/**
 * AuthLayout Component
 * Base layout component for authentication screens
 * Provides consistent structure, logo positioning, and keyboard handling
 * Requirements: 1.1, 2.1, 3.1, 3.2, 3.3
 */

import React from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    View,
} from 'react-native';
import { authStyles, COLORS } from '../../styles/authStyles';

/**
 * Base authentication layout component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in content area
 * @param {string} props.title - Main title for the screen (e.g., "Login to your Account")
 * @param {string} props.subtitle - Optional subtitle text
 * @param {boolean} props.showLogo - Whether to show the app logo (default: true)
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} Authentication layout with consistent structure
 */
export const AuthLayout = ({
  children,
  title,
  subtitle,
  showLogo = true,
  style,
}) => {
  return (
    <SafeAreaView style={[authStyles.container, style]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Logo Section */}
          {showLogo && (
            <View style={authStyles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={authStyles.logo}
                accessibilityLabel="CareerMate Logo"
              />
            </View>
          )}

          {/* Title Section */}
          <View style={authStyles.titleContainer}>
            <Text style={authStyles.title}>{title}</Text>
            {subtitle && (
              <Text style={authStyles.subtitle}>{subtitle}</Text>
            )}
          </View>

          {/* Content Section */}
          <View style={authStyles.contentContainer}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/**
 * Simplified auth layout for screens that don't need the full structure
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.title - Screen title
 * @param {Object} props.style - Additional styles
 * @returns {JSX.Element} Minimal authentication layout
 */
export const SimpleAuthLayout = ({ children, title, style }) => {
  return (
    <SafeAreaView style={[authStyles.container, style]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      
      <View style={authStyles.contentContainer}>
        {title && (
          <View style={authStyles.titleContainer}>
            <Text style={authStyles.title}>{title}</Text>
          </View>
        )}
        {children}
      </View>
    </SafeAreaView>
  );
};

export default AuthLayout;