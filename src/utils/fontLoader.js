// Font loading utilities for Raleway font
import { Platform } from 'react-native';

/**
 * Loads Google Fonts for web platform
 * @param {string} fontUrl - Google Fonts URL
 * @returns {Promise<boolean>} Promise that resolves when font is loaded
 */
export const loadGoogleFont = (fontUrl) => {
  if (Platform.OS !== 'web') {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) {
      resolve(true);
      return;
    }

    // Create and append font link
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    link.onload = () => resolve(true);
    link.onerror = () => reject(new Error('Failed to load font'));
    
    document.head.appendChild(link);
  });
};

/**
 * Preloads Raleway font for better performance
 * @returns {Promise<boolean>} Promise that resolves when font is preloaded
 */
export const preloadRalewayFont = () => {
  const ralewayUrl = 'https://fonts.googleapis.com/css2?family=Raleway:wght@500&display=swap';
  return loadGoogleFont(ralewayUrl);
};

/**
 * Checks if a font is available in the browser
 * @param {string} fontFamily - Font family name
 * @returns {boolean} True if font is available
 */
export const isFontAvailable = (fontFamily) => {
  if (Platform.OS !== 'web') {
    return true; // Assume fonts are available on mobile
  }

  // Create a test element to check font availability
  const testElement = document.createElement('div');
  testElement.style.fontFamily = fontFamily;
  testElement.style.fontSize = '12px';
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  testElement.innerHTML = 'Test';
  
  document.body.appendChild(testElement);
  const width = testElement.offsetWidth;
  document.body.removeChild(testElement);
  
  // Compare with fallback font
  const fallbackElement = document.createElement('div');
  fallbackElement.style.fontFamily = 'serif';
  fallbackElement.style.fontSize = '12px';
  fallbackElement.style.position = 'absolute';
  fallbackElement.style.visibility = 'hidden';
  fallbackElement.innerHTML = 'Test';
  
  document.body.appendChild(fallbackElement);
  const fallbackWidth = fallbackElement.offsetWidth;
  document.body.removeChild(fallbackElement);
  
  return width !== fallbackWidth;
};

/**
 * Gets the optimal font family string with fallbacks
 * @param {string} primaryFont - Primary font family
 * @returns {string} Font family string with fallbacks
 */
export const getFontFamilyWithFallbacks = (primaryFont = 'Raleway') => {
  const fallbacks = [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    'sans-serif'
  ];
  
  return `${primaryFont}, ${fallbacks.join(', ')}`;
};

/**
 * Initializes font loading for the app
 * @returns {Promise<Object>} Font loading results
 */
export const initializeFonts = async () => {
  const results = {
    ralewayLoaded: false,
    platform: Platform.OS,
    error: null
  };

  try {
    if (Platform.OS === 'web') {
      await preloadRalewayFont();
      results.ralewayLoaded = isFontAvailable('Raleway');
    } else {
      // For mobile platforms, fonts are handled by expo-font
      results.ralewayLoaded = true;
    }
  } catch (error) {
    results.error = error.message;
    console.warn('Font loading error:', error);
  }

  return results;
};