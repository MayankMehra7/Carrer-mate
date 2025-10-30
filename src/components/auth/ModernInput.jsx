/**
 * ModernInput Component
 * Styled input component matching the modern design
 * Includes validation states, password toggle, and accessibility features
 * Requirements: 6.1, 6.2, 6.3, 6.4, 5.1, 5.2
 */

import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { authStyles, COLORS } from '../../styles/authStyles';

/**
 * Modern input component with enhanced UX
 * @param {Object} props - Component props
 * @param {string} props.label - Input label text
 * @param {string} props.value - Current input value
 * @param {Function} props.onChangeText - Callback when text changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.secureTextEntry - Whether to hide text (for passwords)
 * @param {string} props.keyboardType - Keyboard type (email-address, default, etc.)
 * @param {string} props.error - Error message to display
 * @param {boolean} props.showPasswordToggle - Whether to show password visibility toggle
 * @param {string} props.autoComplete - Auto-complete type for better UX
 * @param {boolean} props.required - Whether the field is required
 * @param {Function} props.onFocus - Callback when input gains focus
 * @param {Function} props.onBlur - Callback when input loses focus
 * @param {Object} props.style - Additional styles for the container
 * @param {...Object} props - Additional TextInput props
 * @returns {JSX.Element} Modern styled input component
 */
export const ModernInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  showPasswordToggle = false,
  autoComplete,
  required = false,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Animation values
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Handle focus state changes
  const handleFocus = (e) => {
    setIsFocused(true);
    setHasInteracted(true);
    
    // Animate border color
    Animated.timing(borderAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    
    // Animate border color back
    Animated.timing(borderAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    onBlur?.(e);
  };

  const handleChangeText = (text) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onChangeText(text);
  };

  // Shake animation for errors
  const triggerShakeAnimation = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Trigger shake when error appears
  useEffect(() => {
    if (error && hasInteracted) {
      triggerShakeAnimation();
    }
  }, [error, hasInteracted]);

  // Animated border color
  const animatedBorderColor = borderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.borderFocus],
  });

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine input wrapper style
  const getInputWrapperStyle = () => {
    const baseStyle = [authStyles.inputWrapper];
    
    if (isFocused) {
      baseStyle.push(authStyles.inputWrapperFocused);
    }
    
    if (error && hasInteracted) {
      baseStyle.push(authStyles.inputWrapperError);
    }
    
    return baseStyle;
  };

  return (
    <Animated.View 
      style={[
        authStyles.inputContainer, 
        style,
        {
          transform: [{ translateX: shakeAnimation }],
        }
      ]}
    >
      {/* Input Label */}
      {label && (
        <Text style={authStyles.inputLabel}>
          {label}
          {required && <Text style={{ color: COLORS.error }}> *</Text>}
        </Text>
      )}

      {/* Input Wrapper with Animated Border */}
      <Animated.View
        style={[
          ...getInputWrapperStyle(),
          {
            borderColor: error && hasInteracted ? COLORS.error : animatedBorderColor,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect={false}
          style={authStyles.input}
          accessibilityLabel={label}
          accessibilityHint={placeholder}
          accessibilityRequired={required}
          returnKeyType="next"
          blurOnSubmit={false}
          {...props}
        />

        {/* Password Toggle Button */}
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity
            style={authStyles.passwordToggle}
            onPress={togglePasswordVisibility}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={authStyles.passwordToggleText}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error Message */}
      {error && hasInteracted && (
        <Animated.View
          style={{
            opacity: borderAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1],
            }),
          }}
        >
          <Text style={authStyles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

/**
 * Simplified input component for basic use cases
 * @param {Object} props - Component props
 * @returns {JSX.Element} Simple input component
 */
export const SimpleInput = ({ label, error, style, ...props }) => {
  return (
    <View style={[authStyles.inputContainer, style]}>
      {label && <Text style={authStyles.inputLabel}>{label}</Text>}
      
      <View style={[
        authStyles.inputWrapper,
        error && authStyles.inputWrapperError
      ]}>
        <TextInput
          style={authStyles.input}
          placeholderTextColor={COLORS.textPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
      </View>
      
      {error && <Text style={authStyles.errorText}>{error}</Text>}
    </View>
  );
};

export default ModernInput;