/**
 * PasswordInput Component - Enhanced UX with Performance Optimizations
 * Enhanced password input with validation, strength meter, smooth transitions, and improved feedback
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 6.3, 6.4, 6.5
 * Performance: Optimized re-renders with React.memo and useMemo
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import styles from './PasswordInput.styles';
import PasswordRequirements from './PasswordRequirements';
import PasswordStrengthMeter from './PasswordStrengthMeter';

/**
 * Enhanced password input component with comprehensive UX improvements
 * @param {Object} props - Component props
 * @param {string} props.value - Current password value
 * @param {Function} props.onChangeText - Callback when password changes
 * @param {string} props.username - Username for personal info checking (default: '')
 * @param {string} props.email - Email for personal info checking (default: '')
 * @param {Function} props.onValidationChange - Callback to notify parent of validation state
 * @param {Object} props.style - Additional styles for the container
 * @param {string} props.placeholder - Input placeholder text
 * @param {boolean} props.showRequirements - Whether to show requirements checklist (default: true)
 * @param {boolean} props.showStrengthMeter - Whether to show password strength meter (default: true)
 * @param {boolean} props.showErrors - Whether to show error messages (default: true)
 * @param {boolean} props.showTooltips - Whether to show helpful tooltips (default: true)
 * @param {boolean} props.autoFocus - Whether to auto-focus the input (default: false)
 * @param {...Object} props - Additional TextInput props
 * @returns {JSX.Element} Enhanced password input with comprehensive UX
 */
export const PasswordInput = ({ 
  value, 
  onChangeText, 
  username = '', 
  email = '', 
  style,
  onValidationChange,
  placeholder = 'Create a strong password',
  showRequirements = true,
  showStrengthMeter = true,
  showErrors = true,
  showTooltips = true,
  autoFocus = false,
  ...props 
}) => {
  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Animation references
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Requirement 4.1: Integrate password validation hook
  const validation = usePasswordValidation(value, username, email);

  // Requirement 4.5: Notify parent component of validation state for submit button control
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.isCheckingHIBP);
    }
  }, [validation.isValid, validation.isCheckingHIBP, onValidationChange]);

  // Animate border color based on focus and validation state
  useEffect(() => {
    let targetValue = 0; // Default
    if (isFocused) targetValue = 1; // Focused
    else if (value.length > 0 && validation.isValid) targetValue = 2; // Valid
    else if (value.length > 0 && !validation.isValid && hasInteracted) targetValue = 3; // Invalid

    Animated.timing(borderAnimation, {
      toValue: targetValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, validation.isValid, value.length, hasInteracted]);

  // Shake animation for validation errors
  const triggerShakeAnimation = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Trigger shake when validation fails after interaction
  useEffect(() => {
    if (hasInteracted && value.length > 0 && !validation.isValid && validation.errors.length > 0) {
      triggerShakeAnimation();
    }
  }, [validation.errors.length, hasInteracted]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (value.length > 0) {
      setHasInteracted(true);
    }
  }, [value.length]);

  const handleChangeText = useCallback((text) => {
    if (text.length > 0) {
      setHasInteracted(true);
    }
    onChangeText(text);
  }, [onChangeText]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Memoized computed values to prevent recalculation on every render
  const borderColor = useMemo(() => {
    return borderAnimation.interpolate({
      inputRange: [0, 1, 2, 3],
      outputRange: ['#ddd', '#007bff', '#28a745', '#dc3545'],
    });
  }, [borderAnimation]);

  const placeholderText = useMemo(() => {
    if (isFocused) {
      return 'Make it strong and unique...';
    }
    return placeholder;
  }, [isFocused, placeholder]);

  // Memoized validation state to prevent unnecessary prop drilling
  const validationProps = useMemo(() => ({
    validation,
    showTooltips,
    showProgress: hasInteracted
  }), [validation, showTooltips, hasInteracted]);

  // Memoized error display logic
  const shouldShowErrors = useMemo(() => {
    return showErrors && validation.errors.length > 0 && hasInteracted;
  }, [showErrors, validation.errors.length, hasInteracted]);

  // Memoized status text
  const statusText = useMemo(() => {
    if (value.length === 0) return null;
    
    if (validation.isCheckingHIBP) {
      return { text: '🔍 Checking security...', style: styles.statusText };
    } else if (validation.isValid) {
      return { text: '✅ Strong password!', style: styles.statusTextSuccess };
    } else if (hasInteracted) {
      const count = validation.errorCount;
      return { 
        text: `⚠️ ${count} requirement${count !== 1 ? 's' : ''} remaining`, 
        style: styles.statusTextError 
      };
    }
    return null;
  }, [value.length, validation.isCheckingHIBP, validation.isValid, validation.errorCount, hasInteracted]);

  return (
    <View style={[styles.container, style]}>
      {/* Enhanced password input with smooth transitions */}
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            transform: [{ translateX: shakeAnimation }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor,
            },
          ]}
        >
          <TextInput
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={!showPassword}
            style={styles.input}
            placeholder={placeholderText}
            placeholderTextColor="#6c757d"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            {...props}
          />
          
          {/* Enhanced visibility toggle with better UX */}
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={[
              styles.eyeIcon,
              showPassword && styles.eyeIconActive
            ]}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Input status indicator */}
        {statusText && (
          <View style={styles.statusContainer}>
            <Text style={statusText.style}>{statusText.text}</Text>
          </View>
        )}
      </Animated.View>
      
      {/* Password strength meter */}
      {showStrengthMeter && value.length > 0 && (
        <PasswordStrengthMeter 
          password={value} 
          validation={validation}
          showScore={hasInteracted}
        />
      )}
      
      {/* Enhanced requirements checklist */}
      {showRequirements && (
        <PasswordRequirements {...validationProps} />
      )}
      
      {/* Enhanced error messages with better UX */}
      {shouldShowErrors && (
        <Animated.View 
          style={styles.errorsContainer}
          entering="fadeIn"
          exiting="fadeOut"
        >
          <Text style={styles.errorTitle}>
            💡 To create a stronger password:
          </Text>
          {validation.errors.slice(0, 3).map((error, index) => (
            <Text key={index} style={styles.errorText}>
              • {error}
            </Text>
          ))}
          {validation.errors.length > 3 && (
            <Text style={styles.errorText}>
              • And {validation.errors.length - 3} more requirement{validation.errors.length - 3 !== 1 ? 's' : ''}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Helpful tips for new users */}
      {!hasInteracted && value.length === 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsText}>
            💡 Tip: Use a mix of letters, numbers, and symbols for the strongest password
          </Text>
        </View>
      )}
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PasswordInput, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.value === nextProps.value &&
    prevProps.username === nextProps.username &&
    prevProps.email === nextProps.email &&
    prevProps.showRequirements === nextProps.showRequirements &&
    prevProps.showStrengthMeter === nextProps.showStrengthMeter &&
    prevProps.showErrors === nextProps.showErrors &&
    prevProps.showTooltips === nextProps.showTooltips &&
    prevProps.autoFocus === nextProps.autoFocus &&
    prevProps.placeholder === nextProps.placeholder
  );
});