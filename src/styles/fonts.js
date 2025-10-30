import { Platform } from 'react-native';

// Google Fonts import for web
if (Platform.OS === 'web') {
  // Inject Google Fonts CSS import for web platform
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Raleway:wght@500&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// Font definitions with platform-specific handling
export const FONTS = {
  raleway: {
    regular: Platform.OS === 'web' ? 'Raleway, sans-serif' : 'Raleway-Regular',
    medium: Platform.OS === 'web' ? 'Raleway, sans-serif' : 'Raleway-Medium',
    semiBold: Platform.OS === 'web' ? 'Raleway, sans-serif' : 'Raleway-SemiBold',
    bold: Platform.OS === 'web' ? 'Raleway, sans-serif' : 'Raleway-Bold'
  }
};

// Font loading configuration for expo-font (mobile platforms)
export const FONT_ASSETS = Platform.OS !== 'web' ? {
  'Raleway-Regular': require('../../assets/fonts/Raleway-Regular.ttf'),
  'Raleway-Medium': require('../../assets/fonts/Raleway-Medium.ttf'),
  'Raleway-SemiBold': require('../../assets/fonts/Raleway-SemiBold.ttf'),
  'Raleway-Bold': require('../../assets/fonts/Raleway-Bold.ttf')
} : {};

// Helper function to get the correct font family
export const getFontFamily = (weight = 'regular') => {
  return FONTS.raleway[weight] || FONTS.raleway.regular;
};