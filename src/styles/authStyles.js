/**
 * Authentication Styles
 * Styles specifically for login, signup, and splash screens
 * Based on the modern design system theme
 */

import { Dimensions, StyleSheet } from 'react-native';
import { spacing } from './spacing';
import { borderRadius, colors, layout, shadows, typography } from './theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const authStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  keyboardAvoidingView: {
    flex: 1,
  },
  
  scrollContainer: {
    flexGrow: 1,
  },
  
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    minHeight: screenHeight - 100, // Account for status bar and keyboard
  },
  
  // Splash screen styles
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  
  splashGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoText: {
    ...typography.styles.logoLarge,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  
  tagline: {
    ...typography.styles.tagline,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Header section (logo + title)
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  
  logo: {
    ...typography.styles.logo,
    marginBottom: spacing.sm,
  },
  
  screenTitle: {
    ...typography.styles.subtitle,
    textAlign: 'center',
  },
  
  // Back button for signup
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.xl,
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  
  // Form section
  formSection: {
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  
  // Input group styles
  inputGroup: {
    marginBottom: spacing.lg,
  },
  
  inputLabel: {
    ...typography.styles.label,
    marginBottom: spacing.sm,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: layout.inputHeight,
  },
  
  inputFocused: {
    borderColor: colors.border.focus,
    ...shadows.focus,
  },
  
  inputSuccess: {
    borderColor: colors.border.success,
    ...shadows.success,
  },
  
  inputError: {
    borderColor: colors.border.error,
    ...shadows.error,
  },
  
  input: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    paddingVertical: 0, // Remove default padding
  },
  
  inputIcon: {
    marginLeft: spacing.sm,
  },
  
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  
  eyeIcon: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  
  eyeIconActive: {
    color: colors.primary,
  },
  
  // Success/error indicators
  successIcon: {
    fontSize: 20,
    color: colors.success,
  },
  
  errorIcon: {
    fontSize: 20,
    color: colors.error,
  },
  
  // Error text
  errorText: {
    ...typography.styles.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  
  generalError: {
    ...typography.styles.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  
  // Success text
  successText: {
    ...typography.styles.bodySmall,
    color: colors.success,
    textAlign: 'center',
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonHeight,
    ...shadows.sm,
  },
  
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  
  primaryButtonDisabled: {
    backgroundColor: colors.gray300,
    ...shadows.none,
  },
  
  primaryButtonText: {
    ...typography.styles.buttonText,
    color: colors.white,
  },
  
  primaryButtonTextDisabled: {
    color: colors.gray500,
  },
  
  // Secondary button (for future use)
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonHeight,
  },
  
  secondaryButtonText: {
    ...typography.styles.buttonText,
    color: colors.text.primary,
  },
  
  // Loading indicator
  loadingIndicator: {
    marginHorizontal: spacing.sm,
  },
  
  // Remember me checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.base,
  },
  
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  checkboxLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  
  // Footer section
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: 'auto', // Push to bottom
  },
  
  footerText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  
  footerLink: {
    ...typography.styles.bodySmall,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Status messages
  statusContainer: {
    marginTop: spacing.xs,
    alignItems: 'flex-start',
  },
  
  statusText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  
  statusTextSuccess: {
    ...typography.styles.caption,
    color: colors.success,
  },
  
  statusTextError: {
    ...typography.styles.caption,
    color: colors.error,
  },
  
  // Tips and help text
  tipsContainer: {
    marginTop: spacing.lg,
    padding: spacing.base,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  
  tipsText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  
  // Conditional validation display
  conditionalValidationContainer: {
    marginTop: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  
  validationTitle: {
    ...typography.styles.labelSmall,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  
  // OAuth styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  
  dividerText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing.base,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
  },
  
  oauthContainer: {
    gap: spacing.base,
  },
  
  oauthButton: {
    marginBottom: spacing.sm,
  },

  // Animation containers
  animatedContainer: {
    flex: 1,
  },
  
  slideContainer: {
    flex: 1,
  },
  
  fadeContainer: {
    flex: 1,
  },
  
  // Responsive adjustments
  smallScreen: {
    paddingHorizontal: spacing.base,
  },
  
  largeScreen: {
    maxWidth: layout.containerMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
});

// Responsive style helpers
export const getResponsiveStyles = (screenWidth) => {
  const isSmallScreen = screenWidth < layout.breakpoints.sm;
  const isLargeScreen = screenWidth > layout.breakpoints.md;
  
  return {
    container: [
      authStyles.container,
      isSmallScreen && authStyles.smallScreen,
      isLargeScreen && authStyles.largeScreen,
    ],
    contentContainer: [
      authStyles.contentContainer,
      isSmallScreen && { paddingHorizontal: 16 }, // spacing.base value
    ],
  };
};

// Animation presets for auth screens
export const authAnimations = {
  slideUp: {
    from: { opacity: 0, translateY: 50 },
    to: { opacity: 1, translateY: 0 },
    duration: 400,
  },
  
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 300,
  },
  
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: 300,
  },
  
  shake: {
    from: { translateX: 0 },
    to: { translateX: 10 },
    duration: 50,
    iterations: 4,
    direction: 'alternate',
  },
};

export default authStyles;