/**
 * Design System Theme
 * Modern authentication UI theme with clean, professional styling
 * Based on the CareerMate brand and contemporary mobile app design patterns
 */

import { spacing } from './spacing';

export const colors = {
  // Primary brand colors (blue theme from the image)
  primary: '#2563EB',        // Main blue
  primaryDark: '#1D4ED8',    // Darker blue for pressed states
  primaryLight: '#3B82F6',   // Lighter blue for hover states
  primarySoft: '#EFF6FF',    // Very light blue for backgrounds
  
  // Success, error, warning
  success: '#10B981',        // Green for success states
  successLight: '#D1FAE5',   // Light green background
  error: '#EF4444',          // Red for error states
  errorLight: '#FEE2E2',     // Light red background
  warning: '#F59E0B',        // Orange for warnings
  warningLight: '#FEF3C7',   // Light orange background
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale (modern, accessible)
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Gradients for splash screen and backgrounds
  gradients: {
    primary: ['#1e3c72', '#2a5298'],
    primarySoft: ['#EFF6FF', '#DBEAFE'],
    success: ['#D1FAE5', '#A7F3D0'],
    error: ['#FEE2E2', '#FECACA'],
  },
  
  // Semantic colors
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#E5E7EB',
    focus: '#2563EB',
    error: '#EF4444',
    success: '#10B981',
  },
};

export const typography = {
  // Font families
  fontFamily: {
    primary: 'System', // Uses system font for best performance
    mono: 'Courier New',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Predefined text styles
  styles: {
    // Headers
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 44,
      color: colors.text.primary,
    },
    h2: {
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 38,
      color: colors.text.primary,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      color: colors.text.primary,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      color: colors.text.primary,
    },
    
    // Body text
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: colors.text.primary,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: colors.text.secondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: colors.text.tertiary,
    },
    
    // Labels and UI text
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      color: colors.text.primary,
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      color: colors.text.secondary,
    },
    
    // Button text
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      color: colors.white,
    },
    buttonTextSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
      color: colors.white,
    },
    
    // Logo and branding
    logo: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      color: colors.primary,
    },
    logoLarge: {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 56,
      color: colors.primary,
    },
    
    // Subtitle and taglines
    subtitle: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 28,
      color: colors.text.secondary,
    },
    tagline: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: colors.text.inverse,
    },
  },
};



export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  none: 'none',
  sm: {
    // iOS/Android shadow properties
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    // Web shadow property
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  base: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
  
  // Colored shadows for focus states
  focus: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    boxShadow: '0 0 4px rgba(37, 99, 235, 0.15)',
  },
  error: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    boxShadow: '0 0 4px rgba(239, 68, 68, 0.15)',
  },
  success: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    boxShadow: '0 0 4px rgba(16, 185, 129, 0.15)',
  },
};

export const animations = {
  // Duration
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Easing curves
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Common animation configs
  fadeIn: {
    duration: 300,
    useNativeDriver: true,
  },
  slideUp: {
    duration: 400,
    useNativeDriver: true,
  },
  spring: {
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  },
  buttonPress: {
    duration: 150,
    useNativeDriver: true,
  },
};

export const layout = {
  // Screen dimensions helpers
  screenPadding: spacing.xl,
  containerMaxWidth: 400,
  
  // Touch targets (accessibility)
  minTouchTarget: 44,
  
  // Common layout values
  headerHeight: 60,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightLarge: 56,
  
  // Breakpoints for responsive design
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

// Component-specific theme objects
export const components = {
  // Button variants
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: colors.white,
      pressedBackgroundColor: colors.primaryDark,
      disabledBackgroundColor: colors.gray300,
      disabledColor: colors.gray500,
    },
    secondary: {
      backgroundColor: colors.white,
      borderColor: colors.gray300,
      color: colors.text.primary,
      pressedBackgroundColor: colors.gray50,
      disabledBackgroundColor: colors.gray100,
      disabledColor: colors.gray400,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: colors.primary,
      pressedBackgroundColor: colors.primarySoft,
      disabledBackgroundColor: 'transparent',
      disabledColor: colors.gray400,
    },
  },
  
  // Input variants
  input: {
    default: {
      backgroundColor: colors.white,
      borderColor: colors.border.default,
      color: colors.text.primary,
      placeholderColor: colors.text.tertiary,
      focusBorderColor: colors.border.focus,
      errorBorderColor: colors.border.error,
      successBorderColor: colors.border.success,
    },
  },
  
  // Card variants
  card: {
    default: {
      backgroundColor: colors.white,
      borderColor: colors.border.default,
      shadow: shadows.sm,
    },
    elevated: {
      backgroundColor: colors.white,
      borderColor: 'transparent',
      shadow: shadows.md,
    },
  },
};

// Accessibility helpers
export const accessibility = {
  // WCAG AA compliant color combinations
  colorCombinations: {
    primaryOnWhite: {
      color: colors.primary,
      backgroundColor: colors.white,
      contrastRatio: 4.5, // Meets WCAG AA
    },
    whiteOnPrimary: {
      color: colors.white,
      backgroundColor: colors.primary,
      contrastRatio: 4.5, // Meets WCAG AA
    },
    textOnWhite: {
      color: colors.text.primary,
      backgroundColor: colors.white,
      contrastRatio: 16.0, // Exceeds WCAG AAA
    },
  },
  
  // Minimum touch target sizes
  touchTarget: {
    minimum: 44,
    recommended: 48,
  },
};

// Export the complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  layout,
  components,
  accessibility,
};

export default theme;