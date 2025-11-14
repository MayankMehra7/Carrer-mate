/**
 * Simple OAuth Button Component
 * A basic OAuth button that handles press events
 */

import { TouchableOpacity } from 'react-native';

const SimpleOAuthButton = ({ provider, onPress, disabled, style, children }) => {
  const handlePress = () => {
    if (!disabled && onPress) {
      onPress(provider);
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  );
};

export default SimpleOAuthButton;