import { Text } from 'react-native';
import { useAppFonts } from '../../hooks/useFonts';
import { getHeadingStyle } from '../../styles/typography';

/**
 * HeadingText Component with Raleway font support
 * Supports both Google Fonts (web) and local fonts (mobile)
 */
export const HeadingText = ({ 
  level = 'h2', 
  children, 
  style = {}, 
  color = '#000000',
  ...props 
}) => {
  const { getFontFamily, areFontsReady } = useAppFonts();
  
  // Get base style for the heading level
  const baseStyle = getHeadingStyle(level);
  
  // Determine font weight for font family selection
  const getFontWeight = (level) => {
    switch (level) {
      case 'h1': return 'bold';
      case 'h2': 
      case 'h3': return 'semiBold';
      case 'h4': return 'medium';
      default: return 'regular';
    }
  };
  
  // Create final style with proper font family
  const headingStyle = {
    ...baseStyle,
    fontFamily: areFontsReady() ? getFontFamily(getFontWeight(level)) : 'System',
    color,
    ...style
  };
  
  return (
    <Text style={headingStyle} {...props}>
      {children}
    </Text>
  );
};

export default HeadingText;