import { Platform, Text } from 'react-native';
import { useAppFonts } from '../../hooks/useFonts';

/**
 * Text component that safely handles font loading failures
 * Automatically falls back to system fonts if custom fonts fail
 */
const FontSafeText = ({ style, children, fontWeight = 'regular', ...props }) => {
  const { getFontFamily, areFontsReady } = useAppFonts();

  // Get the appropriate font family (custom or fallback)
  const fontFamily = getFontFamily(fontWeight);

  // Create safe style object with fallback font
  const safeStyle = {
    ...style,
    fontFamily: fontFamily || Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif'
    })
  };

  return (
    <Text style={safeStyle} {...props}>
      {children}
    </Text>
  );
};

export default FontSafeText;