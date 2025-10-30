// src/components/common/ValidationMessage.jsx
import { Text, View } from 'react-native';
import styles from './ValidationMessage.styles';

/**
 * Component for displaying validation messages with consistent styling
 * @param {object} validation - Validation state object from useValidation hook
 * @returns {JSX.Element} Validation message component
 */
export const ValidationMessage = ({ validation }) => {
  if (validation.isValidating) {
    return (
      <View style={styles.validationContainer}>
        <Text style={styles.validatingText}>Checking availability...</Text>
      </View>
    );
  }

  if (validation.errorMessage) {
    return (
      <View style={styles.validationContainer}>
        <Text style={styles.errorText}>{validation.errorMessage}</Text>
      </View>
    );
  }

  // Return empty container to maintain consistent spacing
  return <View style={styles.validationContainer} />;
};

