/**
 * ConditionalPasswordValidation Component
 * Demonstrates conditional display of password validation messages
 * Only shows validation feedback when there are actual failures
 * Requirements: Show validation messages only when needed
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import { spacing } from '../../styles/spacing';
import { borderRadius, colors, typography } from '../../styles/theme';

/**
 * Conditional password validation display component
 * Shows validation messages ONLY when there are failures
 * @param {Object} props - Component props
 * @param {string} props.password - Current password value
 * @param {string} props.username - Username for personal info checking
 * @param {string} props.email - Email for personal info checking
 * @param {boolean} props.hasUserInteracted - Whether user has started typing
 * @returns {JSX.Element|null} Validation messages or null if no failures
 */
export const ConditionalPasswordValidation = ({ 
  password, 
  username = '', 
  email = '', 
  hasUserInteracted = false 
}) => {
  const validation = usePasswordValidation(password, username, email);

  // CORE LOGIC: Only show validation when there are actual failures
  const shouldShowValidation = (
    hasUserInteracted && // User has started typing
    password.length > 0 && // Password is not empty
    !validation.isValid && // Password has validation failures
    validation.errors.length > 0 // There are specific errors to show
  );

  // Return null if no validation needed (this hides the component completely)
  if (!shouldShowValidation) {
    return null;
  }

  // Only render validation messages when there are failures
  return (
    <View style={styles.conditionalValidationContainer}>
      <Text style={styles.validationTitle}>
        ⚠️ Password Requirements Not Met:
      </Text>
      
      {/* Show only the failed requirements */}
      {validation.errors.map((error, index) => (
        <Text key={index} style={styles.errorText}>
          • {error}
        </Text>
      ))}
      
      {/* Show HIBP checking status only if there's an issue */}
      {validation.isCheckingHIBP && (
        <Text style={styles.statusText}>
          🔍 Checking password security...
        </Text>
      )}
      
      {/* Show HIBP error only if there's a problem */}
      {validation.hibpError && (
        <Text style={styles.warningText}>
          ⚠️ Security check temporarily unavailable
        </Text>
      )}
    </View>
  );
};

/**
 * Example usage component showing the conditional behavior
 */
export const ConditionalValidationExample = () => {
  const [password, setPassword] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text.length > 0 && !hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <View style={styles.exampleContainer}>
      <Text style={styles.exampleTitle}>
        Conditional Password Validation Demo
      </Text>
      
      <Text style={styles.exampleDescription}>
        Validation messages only appear when there are actual failures.
        Try typing different passwords to see the conditional behavior.
      </Text>
      
      {/* This will only show validation when there are failures */}
      <ConditionalPasswordValidation
        password={password}
        hasUserInteracted={hasInteracted}
      />
      
      {/* Success message when password is valid */}
      {password.length > 0 && hasInteracted && (
        <ConditionalSuccessMessage password={password} />
      )}
    </View>
  );
};

/**
 * Success message component - only shows when password is completely valid
 */
const ConditionalSuccessMessage = ({ password }) => {
  const validation = usePasswordValidation(password);
  
  // Only show success when password is completely valid
  if (!validation.isValid) {
    return null;
  }
  
  return (
    <View style={styles.successContainer}>
      <Text style={styles.successText}>
        ✅ Perfect! Your password meets all security requirements.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  conditionalValidationContainer: {
    marginTop: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  
  validationTitle: {
    ...typography.styles.labelSmall,
    color: colors.error,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  
  errorText: {
    ...typography.styles.caption,
    color: colors.error,
    marginBottom: 2,
  },
  
  statusText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  
  warningText: {
    ...typography.styles.caption,
    color: colors.warning,
    fontStyle: 'italic',
  },
  
  successContainer: {
    marginTop: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  
  successText: {
    ...typography.styles.bodySmall,
    color: colors.success,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  
  exampleContainer: {
    padding: spacing.lg,
  },
  
  exampleTitle: {
    ...typography.styles.h4,
    marginBottom: spacing.base,
  },
  
  exampleDescription: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
});

export default ConditionalPasswordValidation;