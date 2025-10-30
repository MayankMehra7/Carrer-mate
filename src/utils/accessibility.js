/**
 * Accessibility Utilities
 * Helpers for creating accessible UI components that meet WCAG AA standards
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { colors, layout } from '../styles/theme';

// Check if screen reader is enabled
export const isScreenReaderEnabled = async () => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.warn('Error checking screen reader status:', error);
    return false;
  }
};

// Check if reduce motion is enabled
export const isReduceMotionEnabled = async () => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.warn('Error checking reduce motion status:', error);
    return false;
  }
};

// Announce message to screen reader
export const announceForAccessibility = (message) => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else if (Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, {
      queue: false,
    });
  }
};

// Get accessible touch target props
export const getAccessibleTouchTarget = (minSize = layout.minTouchTarget) => ({
  style: {
    minWidth: minSize,
    minHeight: minSize,
  },
  accessible: true,
  accessibilityRole: 'button',
});

// Input accessibility props
export const getInputAccessibilityProps = ({
  label,
  value,
  error,
  required = false,
  secureTextEntry = false,
}) => {
  const props = {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: label,
    accessibilityValue: {
      text: secureTextEntry ? 'Password field' : value || '',
    },
  };

  // Add required state
  if (required) {
    props.accessibilityLabel = `${label}, required`;
    props.accessibilityRequired = true;
  }

  // Add error state
  if (error) {
    props.accessibilityLabel = `${props.accessibilityLabel}, ${error}`;
    props.accessibilityInvalid = true;
  }

  // Add hint for password fields
  if (secureTextEntry) {
    props.accessibilityHint = 'Double tap to show or hide password';
  }

  return props;
};

// Button accessibility props
export const getButtonAccessibilityProps = ({
  label,
  hint,
  disabled = false,
  loading = false,
}) => {
  const props = {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
  };

  if (hint) {
    props.accessibilityHint = hint;
  }

  if (disabled) {
    props.accessibilityState = { disabled: true };
    props.accessibilityLabel = `${label}, disabled`;
  }

  if (loading) {
    props.accessibilityState = { busy: true };
    props.accessibilityLabel = `${label}, loading`;
  }

  return props;
};

// Checkbox accessibility props
export const getCheckboxAccessibilityProps = ({
  label,
  checked = false,
  disabled = false,
}) => ({
  accessible: true,
  accessibilityRole: 'checkbox',
  accessibilityLabel: label,
  accessibilityState: {
    checked,
    disabled,
  },
  accessibilityHint: 'Double tap to toggle',
});

// Link accessibility props
export const getLinkAccessibilityProps = ({ label, hint }) => ({
  accessible: true,
  accessibilityRole: 'link',
  accessibilityLabel: label,
  accessibilityHint: hint || 'Double tap to navigate',
});

// Header accessibility props
export const getHeaderAccessibilityProps = (level = 1) => ({
  accessible: true,
  accessibilityRole: 'header',
  accessibilityLevel: level,
});

// Error message accessibility props
export const getErrorAccessibilityProps = (message) => ({
  accessible: true,
  accessibilityRole: 'alert',
  accessibilityLabel: `Error: ${message}`,
  accessibilityLiveRegion: 'assertive',
});

// Success message accessibility props
export const getSuccessAccessibilityProps = (message) => ({
  accessible: true,
  accessibilityRole: 'text',
  accessibilityLabel: `Success: ${message}`,
  accessibilityLiveRegion: 'polite',
});

// Loading indicator accessibility props
export const getLoadingAccessibilityProps = (message = 'Loading') => ({
  accessible: true,
  accessibilityRole: 'progressbar',
  accessibilityLabel: message,
  accessibilityState: { busy: true },
});

// Form validation accessibility helpers
export const announceValidationError = (fieldName, error) => {
  const message = `${fieldName} has an error: ${error}`;
  announceForAccessibility(message);
};

export const announceValidationSuccess = (fieldName) => {
  const message = `${fieldName} is valid`;
  announceForAccessibility(message);
};

export const announceFormSubmission = (isLoading, success = false, error = null) => {
  if (isLoading) {
    announceForAccessibility('Submitting form, please wait');
  } else if (success) {
    announceForAccessibility('Form submitted successfully');
  } else if (error) {
    announceForAccessibility(`Form submission failed: ${error}`);
  }
};

// Color contrast helpers (for WCAG AA compliance)
export const getContrastRatio = (color1, color2) => {
  // Simplified contrast ratio calculation
  // In a real app, you'd use a proper color contrast library
  const getLuminance = (color) => {
    // Convert hex to RGB and calculate luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAGAA = (foreground, background) => {
  return getContrastRatio(foreground, background) >= 4.5;
};

export const meetsWCAGAAA = (foreground, background) => {
  return getContrastRatio(foreground, background) >= 7.0;
};

// Accessible color combinations
export const getAccessibleColors = () => ({
  // Text on backgrounds
  primaryText: {
    color: colors.text.primary,
    backgroundColor: colors.white,
    contrastRatio: getContrastRatio(colors.text.primary, colors.white),
    meetsAA: meetsWCAGAA(colors.text.primary, colors.white),
  },
  
  secondaryText: {
    color: colors.text.secondary,
    backgroundColor: colors.white,
    contrastRatio: getContrastRatio(colors.text.secondary, colors.white),
    meetsAA: meetsWCAGAA(colors.text.secondary, colors.white),
  },
  
  // Button combinations
  primaryButton: {
    color: colors.white,
    backgroundColor: colors.primary,
    contrastRatio: getContrastRatio(colors.white, colors.primary),
    meetsAA: meetsWCAGAA(colors.white, colors.primary),
  },
  
  // Error combinations
  errorText: {
    color: colors.error,
    backgroundColor: colors.white,
    contrastRatio: getContrastRatio(colors.error, colors.white),
    meetsAA: meetsWCAGAA(colors.error, colors.white),
  },
  
  // Success combinations
  successText: {
    color: colors.success,
    backgroundColor: colors.white,
    contrastRatio: getContrastRatio(colors.success, colors.white),
    meetsAA: meetsWCAGAA(colors.success, colors.white),
  },
});

// Focus management helpers
export const setAccessibilityFocus = (ref) => {
  if (ref && ref.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
};

// Keyboard navigation helpers
export const getKeyboardNavigationProps = () => ({
  // Enable focus on Android
  focusable: true,
  // Enable keyboard navigation
  accessible: true,
});

// Screen reader navigation helpers
export const getScreenReaderNavigationProps = (isFirst = false, isLast = false) => {
  const props = {};
  
  if (isFirst) {
    props.accessibilityElementsHidden = false;
    props.importantForAccessibility = 'yes';
  }
  
  if (isLast) {
    props.accessibilityTraits = ['button', 'last'];
  }
  
  return props;
};

// Form accessibility helpers
export const getFormAccessibilityProps = (formName) => ({
  accessible: true,
  accessibilityRole: 'form',
  accessibilityLabel: `${formName} form`,
});

export const getFieldsetAccessibilityProps = (legend) => ({
  accessible: true,
  accessibilityRole: 'group',
  accessibilityLabel: legend,
});

// Export all accessibility utilities
export default {
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  announceForAccessibility,
  getAccessibleTouchTarget,
  getInputAccessibilityProps,
  getButtonAccessibilityProps,
  getCheckboxAccessibilityProps,
  getLinkAccessibilityProps,
  getHeaderAccessibilityProps,
  getErrorAccessibilityProps,
  getSuccessAccessibilityProps,
  getLoadingAccessibilityProps,
  announceValidationError,
  announceValidationSuccess,
  announceFormSubmission,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getAccessibleColors,
  setAccessibilityFocus,
  getKeyboardNavigationProps,
  getScreenReaderNavigationProps,
  getFormAccessibilityProps,
  getFieldsetAccessibilityProps,
};