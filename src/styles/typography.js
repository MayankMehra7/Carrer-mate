import { getFontFamily } from './fonts';

// Heading styles with Raleway fonts
export const HEADING_STYLES = {
  h1: {
    fontSize: 28,
    fontWeight: '500',
    fontFamily: getFontFamily('bold'),
    lineHeight: 34,
    marginBottom: 16,
    color: '#000000'
  },
  h2: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: getFontFamily('semiBold'),
    lineHeight: 30,
    marginBottom: 14,
    color: '#000000'
  },
  h3: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: getFontFamily('semiBold'),
    lineHeight: 26,
    marginBottom: 12,
    color: '#000000'
  },
  h4: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: getFontFamily('medium'),
    lineHeight: 24,
    marginBottom: 10,
    color: '#000000'
  }
};

// Helper function to get heading styles
export const getHeadingStyle = (level) => {
  return HEADING_STYLES[level] || HEADING_STYLES.h1;
};