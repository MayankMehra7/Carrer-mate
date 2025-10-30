/**
 * ModernButton Component
 * Styled button component with loading states and blue theme
 * Includes accessibility features and proper touch feedback
 * Requirements: 1.5, 2.4, 3.1, 5.3, 6.3
 */

import { useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    Text,
    TouchableOpacity,
    Vibration,
} from 'react-native';
import { authStyles, COLORS } from '../../styles/authStyles';

/**
 * Modern button component with enhanced UX
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Callback when button is pressed
 * @param {boolean} props.loading - Whether to show loading indicator
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.variant - Button variant (primary, secondary, outline)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {Object} props.style - Additional styles for the button
 * @param {Object} props.textStyle - Additional styles for the button text
 * @param {boolean} props.hapticFeedback - Whether to provide haptic feedback
 * @param {string} props.accessibilityLabel - Accessibility label
 * @param {string} props.accessibilityHint - Accessibility hint
 * @param {...Object} props - Additional TouchableOpacity props
 * @returns {JSX.Element} Modern styled button component
 */
export const ModernButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  // Handle press in animation
  const handlePressIn = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle press out animation
  const handlePressOut = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle button press
  const handlePress = () => {
    if (disabled || loading) return;

    // Provide haptic feedback on supported platforms
    if (hapticFeedback && Platform.OS === 'ios') {
      // Use light impact feedback
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger('impactLight');
    } else if (hapticFeedback && Platform.OS === 'android') {
      Vibration.vibrate(50);
    }

    onPress?.();
  };

  // Get button styles based on variant and state
  const getButtonStyles = () => {
    const baseStyles = [authStyles.button];

    // Add variant styles
    switch (variant) {
      case 'primary':
        baseStyles.push(authStyles.buttonPrimary);
        break;
      case 'secondary':
        baseStyles.push(authStyles.buttonSecondary);
        break;
      case 'outline':
        baseStyles.push(authStyles.buttonOutline);
        break;
      default:
        baseStyles.push(authStyles.buttonPrimary);
    }

    // Add size styles
    switch (size) {
      case 'small':
        baseStyles.push(authStyles.buttonSmall);
        break;
      case 'large':
        baseStyles.push(authStyles.buttonLarge);
        break;
      default:
        // Medium is default
        break;
    }

    // Add disabled styles
    if (disabled || loading) {
      baseStyles.push(authStyles.buttonDisabled);
    }

    return baseStyles;
  };

  // Get text styles based on variant and state
  const getTextStyles = () => {
    const baseStyles = [authStyles.buttonText];

    // Add variant text styles
    switch (variant) {
      case 'primary':
        baseStyles.push(authStyles.buttonTextPrimary);
        break;
      case 'secondary':
        baseStyles.push(authStyles.buttonTextSecondary);
        break;
      case 'outline':
        baseStyles.push(authStyles.buttonTextOutline);
        break;
      default:
        baseStyles.push(authStyles.buttonTextPrimary);
    }

    // Add size text styles
    switch (size) {
      case 'small':
        baseStyles.push(authStyles.buttonTextSmall);
        break;
      case 'large':
        baseStyles.push(authStyles.buttonTextLarge);
        break;
      default:
        // Medium is default
        break;
    }

    return baseStyles;
  };

  // Determine loading indicator color
  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.background;
      case 'secondary':
        return COLORS.primary;
      case 'outline':
        return COLORS.primary;
      default:
        return COLORS.background;
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnimation }],
        opacity: opacityAnimation,
      }}
    >
      <TouchableOpacity
        style={[...getButtonStyles(), style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            color={getLoadingColor()}
            size="small"
            accessibilityLabel="Loading"
          />
        ) : (
          <Text style={[...getTextStyles(), textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Link button component for navigation and secondary actions
 * @param {Object} props - Component props
 * @returns {JSX.Element} Link button component
 */
export const LinkButton = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[authStyles.linkButton, style]}
      activeOpacity={0.7}
      accessibilityRole="button"
      {...props}
    >
      <Text style={[authStyles.linkButtonText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Icon button component for actions with icons
 * @param {Object} props - Component props
 * @returns {JSX.Element} Icon button component
 */
export const IconButton = ({
  icon,
  onPress,
  disabled = false,
  size = 'medium',
  style,
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.timing(scaleAnimation, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnimation }],
      }}
    >
      <TouchableOpacity
        style={[authStyles.iconButton, authStyles[`iconButton${size.charAt(0).toUpperCase() + size.slice(1)}`], style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        {...props}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ModernButton;