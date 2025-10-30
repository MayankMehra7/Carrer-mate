import { useFonts } from 'expo-font';
import { Platform } from 'react-native';
import { FONT_ASSETS } from '../styles/fonts';

/**
 * Platform-aware hook for loading Raleway fonts
 * Supports both local fonts (mobile) and Google Fonts (web)
 * @returns {Object} Font loading state
 */
export const useAppFonts = () => {
  // Only load fonts on non-web platforms
  const [fontsLoaded, fontError] = useFonts(Platform.OS !== 'web' ? FONT_ASSETS : {});
  
  // On web, fonts are loaded via Google Fonts CSS, so consider them always loaded
  const isWebPlatform = Platform.OS === 'web';
  const actualFontsLoaded = isWebPlatform ? true : fontsLoaded;
  const actualFontError = isWebPlatform ? null : fontError;

  return {
    fontsLoaded: actualFontsLoaded,
    fontError: actualFontError,
    areFontsReady: () => actualFontsLoaded,
    getFontFamily: (weight = 'regular') => {
      if (isWebPlatform) {
        // Use Google Fonts for web
        return 'Raleway, sans-serif';
      } else if (actualFontsLoaded) {
        // Use local fonts for mobile
        const fontMap = {
          regular: 'Raleway-Regular',
          medium: 'Raleway-Medium',
          semiBold: 'Raleway-SemiBold',
          bold: 'Raleway-Bold'
        };
        return fontMap[weight] || fontMap.regular;
      }
      return 'System'; // Fallback to system font
    },
    getFontStatus: () => ({
      loaded: actualFontsLoaded,
      error: actualFontError,
      ready: actualFontsLoaded,
      platform: Platform.OS,
      usingGoogleFonts: isWebPlatform
    }),
    retryFontLoading: () => {
      if (isWebPlatform) {
        // For web, try to reload Google Fonts
        const existingLink = document.querySelector('link[href*="fonts.googleapis.com"]');
        if (existingLink) {
          existingLink.remove();
          const newLink = document.createElement('link');
          newLink.href = 'https://fonts.googleapis.com/css2?family=Raleway:wght@500&display=swap';
          newLink.rel = 'stylesheet';
          document.head.appendChild(newLink);
        }
      } else {
        console.log('Font retry requested for mobile platform');
      }
    },
    performHealthCheck: () => ({
      fontSystemHealthy: actualFontsLoaded,
      customFontsAvailable: actualFontsLoaded,
      platform: Platform.OS,
      googleFontsEnabled: isWebPlatform
    })
  };
};

export default useAppFonts;