// src/components/common/ValidatedInput.jsx
import { Text, TextInput, View, Pressable, Platform } from 'react-native';
import { useRef, useState } from 'react';
import { useValidation } from '../../hooks/useValidation';
import { ValidationMessage } from './ValidationMessage';
import styles from './ValidatedInput.styles';

/**
 * Input component with integrated validation display
 * @param {string} label - Label text for the input
 * @param {string} value - Current input value
 * @param {function} onChangeText - Function to handle text changes
 * @param {string} validationType - Type of validation ('username' or 'email')
 * @param {object} style - Additional styles for the input
 * @param {object} inputProps - Additional props to pass to TextInput
 * @returns {JSX.Element} Validated input component
 */
export const ValidatedInput = ({
  label,
  value,
  onChangeText,
  validationType,
  style,
  ...inputProps
}) => {
  // Only use validation if validationType is provided
  const validation = validationType ? useValidation(validationType, value) : null;

  // Extract and ignore incoming secureTextEntry to prevent overriding our toggle
  const { secureTextEntry: incomingSecure, ...restInputProps } = inputProps;

  // Password visibility toggle (only active if secureTextEntry is passed)
  const hasSecure = !!incomingSecure;
  const [secure, setSecure] = useState(hasSecure);
  const inputRef = useRef(null);

  const toggleSecure = () => {
    setSecure((s) => !s);
    // Keep focus on the input after toggling (especially for web)
    requestAnimationFrame(() => inputRef.current?.focus?.());
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {hasSecure ? (
          secure ? (
            <TextInput
              key="secure"
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              style={[
                styles.input,
                validation && validation.isValid === false && styles.inputError,
                styles.inputWithToggle,
                style
              ]}
              autoComplete="password"
              {...restInputProps}
              secureTextEntry={true}
            />
          ) : (
            <TextInput
              key="plain"
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              style={[
                styles.input,
                validation && validation.isValid === false && styles.inputError,
                styles.inputWithToggle,
                style
              ]}
              autoComplete="off"
              {...restInputProps}
              secureTextEntry={false}
            />
          )
        ) : (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            style={[
              styles.input,
              validation && validation.isValid === false && styles.inputError,
              style
            ]}
            {...restInputProps}
            secureTextEntry={false}
          />
        )}
        {hasSecure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
            onPress={toggleSecure}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{secure ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {validation && <ValidationMessage validation={validation} />}
    </View>
  );
};

