/**
 * ModernButton Component
 * Reusable button component with loading states, animations, and accessibility
 * Requirements: 7.5, 8.1, 8.2
 */

import React, { useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { authStyles } from '../../styles/authStyles';
import { colors } from '../../styles/theme';
import { getAccessibleTouchTarget, getButtonAccessibilityProps } from '../../utils/accessibility';

/**
 * Modern button component with multiple variants and states
 */
export const ModernButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  hapticFeedback = true,
  style,
  textStyle,
  loadingColor,
  testID,
  accessibilityLabel,
  accessibilityHint,
  children,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Handle press with animation and haptic feedback
  const handlePressIn = () => {
    if (disabled || loading) return;
    
    // Scale down animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
    
    // Haptic feedback
    if (hapticFeedback && Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  };
  
  const handlePressOut = () => {
    if (disabled || loading) return;
    
    // Scale back to normal
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePress = () => {
    if (disabled || loading) return;
    onPress?.();
  };
  
  // Get button styles based on variant and state
  const getButtonStyles = () => {
    const baseStyles = [authStyles.primaryButton];
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.push(authStyles.secondaryButton);
        break;
      case 'ghost':
        baseStyles.push({
          backgroundColor: 'transparent',
          borderWidth: 0,
          ...authStyles.secondaryButton,
        });
        break;
      default: // primary
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push({
          paddingVertical: 8,
          paddingHorizontal: 16,
          minHeight: 36,
        });
        break;
      case 'large':
        baseStyles.push({
          paddingVertical: 20,
          paddingHorizontal: 32,
          minHeight: 56,
        });
        break;
      default: // medium
        break;
    }
    
    // State styles
    if (disabled || loading) {
      baseStyles.push(authStyles.primaryButtonDisabled);
    }
    
    // Width styles
    if (!fullWidth) {
      baseStyles.push({ alignSelf: 'center' });
    }
    
    return baseStyles;
  };
  
  // Get text styles based on variant and state
  const getTextStyles = () => {
    const baseStyles = [authStyles.primaryButtonText];
    
    // Variant text styles
    switch (variant) {
      case 'secondary':
        baseStyles.push(authStyles.secondaryButtonText);
        break;
      case 'ghost':
        baseStyles.push({
          color: colors.primary,
        });
        break;
      default: // primary
        break;
    }
    
    // Size text styles
    switch (size) {
      case 'small':
        baseStyles.push({
          fontSize: 14,
          lineHeight: 20,
        });
        break;
      case 'large':
        baseStyles.push({
          fontSize: 18,
          lineHeight: 28,
        });
        break;
      default: // medium
        break;
    }
    
    // State text styles
    if (disabled || loading) {
      baseStyles.push(authStyles.primaryButtonTextDisabled);
    }
    
    return baseStyles;
  };
  
  // Get loading indicator color
  const getLoadingColor = () => {
    if (loadingColor) return loadingColor;
    
    switch (variant) {
      case 'secondary':
      case 'ghost':
        return colors.primary;
      default:
        return colors.white;
    }
  };
  
  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        style={[
          ...getButtonStyles(),
          getAccessibleTouchTarget().style,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        testID={testID}
        {...getButtonAccessibilityProps({
          label: accessibilityLabel || title,
          hint: accessibilityHint,
          disabled: disabled || loading,
          loading,
        })}
        {...props}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Left Icon */}
          {leftIcon && !loading && (
            <View style={{ marginRight: 8 }}>
              {leftIcon}
            </View>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <View style={{ marginRight: title ? 8 : 0 }}>
              <ActivityIndicator 
                size="small" 
                color={getLoadingColor()}
              />
            </View>
          )}
          
          {/* Button Text or Children */}
          {children || (
            <Text style={[...getTextStyles(), textStyle]}>
              {title}
            </Text>
          )}
          
          {/* Right Icon */}
          {rightIcon && !loading && (
            <View style={{ marginLeft: 8 }}>
              {rightIcon}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Specialized button variants for common use cases
 */

// Primary button (default)
export const PrimaryButton = (props) => (
  <ModernButton variant="primary" {...props} />
);

// Secondary button
export const SecondaryButton = (props) => (
  <ModernButton variant="secondary" {...props} />
);

// Ghost button (transparent)
export const GhostButton = (props) => (
  <ModernButton variant="ghost" {...props} />
);

// Small button
export const SmallButton = (props) => (
  <ModernButton size="small" {...props} />
);

// Large button
export const LargeButton = (props) => (
  <ModernButton size="large" {...props} />
);

// Link-style button
export const LinkButton = ({ title, onPress, style, textStyle, ...props }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      style,
    ]}
    {...getButtonAccessibilityProps({
      label: title,
      hint: 'Double tap to activate',
    })}
    {...props}
  >
    <Text
      style={[
        {
          color: colors.primary,
          fontSize: 16,
          fontWeight: '500',
          textDecorationLine: 'underline',
        },
        textStyle,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

// Icon button
export const IconButton = ({ 
  icon, 
  onPress, 
  size = 44, 
  backgroundColor = 'transparent',
  iconColor = colors.text.primary,
  style,
  ...props 
}) => (
  <TouchableOpacity
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      },
      style,
    ]}
    onPress={onPress}
    {...getButtonAccessibilityProps({
      label: 'Icon button',
    })}
    {...props}
  >
    {React.cloneElement(icon, { 
      size: size * 0.5, 
      color: iconColor,
    })}
  </TouchableOpacity>
);

export default ModernButton;