/**
 * ModernInput Component
 * Reusable input component with modern styling, validation states, and accessibility
 * Requirements: 5.1, 5.2, 5.3, 6.3, 6.4
 */

import { forwardRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { authStyles } from '../../styles/authStyles';
import { colors } from '../../styles/theme';
import { getInputAccessibilityProps } from '../../utils/accessibility';

/**
 * Modern input component with validation states and accessibility
 */
export const ModernInput = forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  showSuccess = false,
  rightIcon,
  leftIcon,
  secureTextEntry = false,
  showPasswordToggle = false,
  required = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  autoCorrect = true,
  returnKeyType = 'default',
  onSubmitEditing,
  onFocus,
  onBlur,
  style,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  testID,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Determine input container style based on state
  const getInputContainerStyle = () => {
    const baseStyle = [authStyles.inputContainer];
    
    if (isFocused) {
      baseStyle.push(authStyles.inputFocused);
    }
    
    if (error) {
      baseStyle.push(authStyles.inputError);
    } else if (showSuccess && value) {
      baseStyle.push(authStyles.inputSuccess);
    }
    
    if (disabled) {
      baseStyle.push({ opacity: 0.6 });
    }
    
    return baseStyle;
  };
  
  // Determine if we should show the password toggle
  const shouldShowPasswordToggle = showPasswordToggle && secureTextEntry;
  
  // Determine the actual secureTextEntry value
  const actualSecureTextEntry = secureTextEntry && !showPassword;
  
  return (
    <View style={[authStyles.inputGroup, containerStyle]}>
      {/* Label */}
      {label && (
        <Text 
          style={[
            authStyles.inputLabel,
            required && { fontWeight: '600' },
            labelStyle,
          ]}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      
      {/* Input Container */}
      <View style={[getInputContainerStyle(), style]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={authStyles.inputIcon}>
            {leftIcon}
          </View>
        )}
        
        {/* Text Input */}
        <TextInput
          ref={ref}
          style={[
            authStyles.input,
            multiline && { 
              height: numberOfLines * 20,
              textAlignVertical: 'top',
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={actualSecureTextEntry}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          {...getInputAccessibilityProps({
            label,
            value,
            error,
            required,
            secureTextEntry: actualSecureTextEntry,
          })}
          {...props}
        />
        
        {/* Success Icon */}
        {showSuccess && value && !error && (
          <View style={authStyles.inputIcon}>
            <Icon name="check-circle" size={20} color={colors.success} />
          </View>
        )}
        
        {/* Password Toggle */}
        {shouldShowPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={authStyles.eyeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityHint="Double tap to toggle password visibility"
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.text.tertiary}
              style={showPassword && authStyles.eyeIconActive}
            />
          </TouchableOpacity>
        )}
        
        {/* Right Icon */}
        {rightIcon && !shouldShowPasswordToggle && (
          <View style={authStyles.inputIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {/* Error Message */}
      {error && (
        <Text 
          style={[authStyles.errorText, errorStyle]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${error}`}
        >
          {error}
        </Text>
      )}
      
      {/* Character Count (if maxLength is provided) */}
      {maxLength && value && (
        <Text 
          style={[
            authStyles.statusText,
            { 
              alignSelf: 'flex-end',
              color: value.length > maxLength * 0.9 ? colors.warning : colors.text.tertiary,
            },
          ]}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
});

ModernInput.displayName = 'ModernInput';

export default ModernInput;