/**
 * Font utility functions for consistent font handling across the app
 */

import { Platform } from 'react-native';
import { getFontFamilyWithFallback } from '../styles/fonts';

/**
 * Get the best available font for the current platform and loading state
 * @param {Object} options - Font selection options
 * @param {string} options.weight - Font weight (regular, medium, semiBold, bold)
 * @param {boolean} options.fontsLoaded - Whether custom fonts are loaded
 * @param {boolean} options.hasError - Whether there was a font loading error
 * @param {string} options.fallbackStrategy - Fallback strategy ('platform', 'system', 'serif')
 * @returns {Object} Font selection result
 */
export const selectBestFont = ({ 
  weight = 'regular', 
  fontsLoaded = false, 
  hasError = false,
  fallbackStrategy = 'platform'
}) => {
  const fontInfo = getFontFamilyWithFallback({
    weight,
    fontsLoaded,
    hasError
  });

  // Apply fallback strategy if using fallback fonts
  if (fontInfo.isFallback && fallbackStrategy !== 'platform') {
    let strategicFallback;
    
    switch (fallbackStrategy) {
      case 'system':
        strategicFallback = Platform.select({
          ios: 'System',
          android: 'Roboto',
          default: 'system-ui'
        });
        break;
      case 'serif':
        strategicFallback = Platform.select({
          ios: 'Times New Roman',
          android: 'serif',
          default: 'Times New Roman'
        });
        break;
      default:
        strategicFallback = fontInfo.fontFamily;
    }

    return {
      ...fontInfo,
      fontFamily: strategicFallback,
      fallbackStrategy
    };
  }

  return {
    ...fontInfo,
    fallbackStrategy: fontInfo.isFallback ? 'platform' : 'custom'
  };
};

/**
 * Check if a font family is available on the current platform
 * @param {string} fontFamily - Font family name to check
 * @returns {boolean} Whether the font is likely available
 */
export const isFontAvailable = (fontFamily) => {
  // Basic platform-specific font availability check
  const platformFonts = {
    ios: ['System', 'Helvetica', 'Times New Roman', 'Courier'],
    android: ['Roboto', 'sans-serif', 'serif', 'monospace'],
    web: ['system-ui', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New']
  };

  const currentPlatform = Platform.OS;
  const availableFonts = platformFonts[currentPlatform] || platformFonts.web;
  
  return availableFonts.some(font => 
    fontFamily.toLowerCase().includes(font.toLowerCase())
  );
};

/**
 * Get font loading recommendations based on platform and performance
 * @returns {Object} Font loading recommendations
 */
export const getFontLoadingRecommendations = () => {
  const platform = Platform.OS;
  
  return {
    platform,
    recommendations: {
      preload: platform !== 'web', // Preload on native platforms
      cache: true, // Always enable caching
      fallbackDelay: platform === 'web' ? 100 : 0, // Delay fallback on web
      retryAttempts: 2, // Number of retry attempts
      timeout: platform === 'web' ? 3000 : 5000 // Loading timeout
    }
  };
};

/**
 * Create a font style object with intelligent fallback
 * @param {Object} options - Style options
 * @returns {Object} Font style object
 */
export const createFontStyle = ({
  weight = 'regular',
  size = 16,
  color = '#000000',
  fontsLoaded = false,
  hasError = false,
  lineHeight,
  ...additionalStyles
}) => {
  const fontInfo = selectBestFont({ weight, fontsLoaded, hasError });
  
  return {
    fontFamily: fontInfo.fontFamily,
    fontSize: size,
    color,
    ...(lineHeight && { lineHeight }),
    ...additionalStyles
  };
};