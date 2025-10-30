/**
 * Responsive Design Utilities
 * Helpers for creating responsive layouts and handling different screen sizes
 */

import { Dimensions, PixelRatio } from 'react-native';
import { layout } from '../styles/theme';

// Get current screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Check if device is a tablet
export const isTablet = () => {
  const { width, height } = getScreenDimensions();
  const aspectRatio = height / width;
  return Math.min(width, height) >= 600 && aspectRatio < 1.6;
};

// Check screen size categories
export const getScreenSize = () => {
  const { width } = getScreenDimensions();
  
  if (width < layout.breakpoints.sm) return 'small';
  if (width < layout.breakpoints.md) return 'medium';
  if (width < layout.breakpoints.lg) return 'large';
  return 'xlarge';
};

// Get responsive value based on screen size
export const getResponsiveValue = (values) => {
  const screenSize = getScreenSize();
  
  if (typeof values === 'object') {
    return values[screenSize] || values.default || values.medium;
  }
  
  return values;
};

// Scale size based on screen density
export const scaleSize = (size) => {
  const scale = PixelRatio.get();
  return size * scale;
};

// Get responsive padding/margin
export const getResponsiveSpacing = (baseSpacing) => {
  const screenSize = getScreenSize();
  
  const multipliers = {
    small: 0.8,
    medium: 1,
    large: 1.2,
    xlarge: 1.4,
  };
  
  return baseSpacing * (multipliers[screenSize] || 1);
};

// Get responsive font size
export const getResponsiveFontSize = (baseFontSize) => {
  const screenSize = getScreenSize();
  
  const multipliers = {
    small: 0.9,
    medium: 1,
    large: 1.1,
    xlarge: 1.2,
  };
  
  return baseFontSize * (multipliers[screenSize] || 1);
};

// Check if screen is in landscape mode
export const isLandscape = () => {
  const { width, height } = getScreenDimensions();
  return width > height;
};

// Get safe area insets (for devices with notches)
export const getSafeAreaInsets = () => {
  // This would typically use react-native-safe-area-context
  // For now, return default values
  return {
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  };
};

// Responsive style creator
export const createResponsiveStyle = (styleConfig) => {
  const screenSize = getScreenSize();
  const { width } = getScreenDimensions();
  
  let style = { ...styleConfig.default };
  
  // Apply screen size specific styles
  if (styleConfig[screenSize]) {
    style = { ...style, ...styleConfig[screenSize] };
  }
  
  // Apply width-based styles
  if (styleConfig.widthBased) {
    Object.keys(styleConfig.widthBased).forEach(breakpoint => {
      if (width >= parseInt(breakpoint)) {
        style = { ...style, ...styleConfig.widthBased[breakpoint] };
      }
    });
  }
  
  return style;
};

// Hook for responsive values (would be used with React hooks)
export const useResponsiveValue = (values) => {
  return getResponsiveValue(values);
};

// Hook for screen dimensions (would be used with React hooks)
export const useScreenDimensions = () => {
  return getScreenDimensions();
};

// Accessibility helpers
export const getAccessibleTouchTarget = (minSize = 44) => {
  return {
    minWidth: minSize,
    minHeight: minSize,
  };
};

// Calculate optimal container width
export const getOptimalContainerWidth = () => {
  const { width } = getScreenDimensions();
  const maxWidth = layout.containerMaxWidth;
  
  if (width <= layout.breakpoints.sm) {
    return width - (layout.screenPadding * 2);
  }
  
  return Math.min(width * 0.9, maxWidth);
};

// Get responsive input height
export const getResponsiveInputHeight = () => {
  const screenSize = getScreenSize();
  
  const heights = {
    small: 44,
    medium: 48,
    large: 52,
    xlarge: 56,
  };
  
  return heights[screenSize] || 48;
};

// Get responsive button height
export const getResponsiveButtonHeight = () => {
  const screenSize = getScreenSize();
  
  const heights = {
    small: 44,
    medium: 48,
    large: 52,
    xlarge: 56,
  };
  
  return heights[screenSize] || 48;
};

// Responsive layout helpers
export const getAuthLayoutStyles = () => {
  const { width, height } = getScreenDimensions();
  const screenSize = getScreenSize();
  const isSmall = screenSize === 'small';
  const isLarge = screenSize === 'large' || screenSize === 'xlarge';
  
  return {
    container: {
      paddingHorizontal: isSmall ? 16 : 24,
      maxWidth: isLarge ? layout.containerMaxWidth : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    
    headerSection: {
      marginBottom: isSmall ? 32 : 48,
      paddingTop: isSmall ? 20 : 40,
    },
    
    formSection: {
      marginBottom: isSmall ? 24 : 32,
    },
    
    inputGroup: {
      marginBottom: isSmall ? 16 : 20,
    },
    
    button: {
      height: getResponsiveButtonHeight(),
      marginTop: isSmall ? 16 : 20,
    },
    
    footer: {
      paddingVertical: isSmall ? 20 : 24,
      marginTop: isSmall ? 20 : 32,
    },
  };
};

// Export all utilities
export default {
  getScreenDimensions,
  isTablet,
  getScreenSize,
  getResponsiveValue,
  scaleSize,
  getResponsiveSpacing,
  getResponsiveFontSize,
  isLandscape,
  getSafeAreaInsets,
  createResponsiveStyle,
  useResponsiveValue,
  useScreenDimensions,
  getAccessibleTouchTarget,
  getOptimalContainerWidth,
  getResponsiveInputHeight,
  getResponsiveButtonHeight,
  getAuthLayoutStyles,
};