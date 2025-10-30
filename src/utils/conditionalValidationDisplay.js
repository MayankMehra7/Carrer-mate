/**
 * Conditional Validation Display Utilities
 * Implements logic for showing validation messages only when there are failures
 * "If there is any kind of failure with the password then show this else not needed"
 */

/**
 * Determines whether to show password validation messages
 * Core logic: Only show when there are actual failures
 * @param {Object} validation - Validation state from usePasswordValidation hook
 * @param {string} password - Current password value
 * @param {boolean} hasUserInteracted - Whether user has started typing
 * @returns {boolean} True if validation messages should be shown
 */
export const shouldShowPasswordValidation = (validation, password, hasUserInteracted) => {
  // Don't show anything if user hasn't started typing
  if (!hasUserInteracted || !password || password.length === 0) {
    return false;
  }

  // Don't show if password is completely valid (no failures)
  if (validation.isValid && validation.errors.length === 0) {
    return false;
  }

  // Show validation messages only when there are actual failures
  return validation.errors.length > 0 || !validation.isValid;
};

/**
 * Gets only the validation messages that need to be shown (failures only)
 * @param {Object} validation - Validation state from usePasswordValidation hook
 * @returns {Array} Array of error messages to display
 */
export const getValidationMessagesToShow = (validation) => {
  // Return empty array if no failures
  if (validation.isValid || validation.errors.length === 0) {
    return [];
  }

  // Return only the actual error messages (failures)
  return validation.errors;
};

/**
 * Determines which individual requirements to show based on failures
 * @param {Object} requirements - Requirements object from validation state
 * @returns {Array} Array of requirements that have failures
 */
export const getFailedRequirementsToShow = (requirements) => {
  const failedRequirements = [];

  // Only include requirements that are failing
  if (!requirements.length) {
    failedRequirements.push({
      key: 'length',
      label: 'At least 10 characters',
      status: 'failed'
    });
  }

  if (!requirements.uppercase) {
    failedRequirements.push({
      key: 'uppercase',
      label: 'At least one uppercase letter',
      status: 'failed'
    });
  }

  if (!requirements.lowercase) {
    failedRequirements.push({
      key: 'lowercase',
      label: 'At least one lowercase letter',
      status: 'failed'
    });
  }

  if (!requirements.number) {
    failedRequirements.push({
      key: 'number',
      label: 'At least one number',
      status: 'failed'
    });
  }

  if (!requirements.special) {
    failedRequirements.push({
      key: 'special',
      label: 'At least one special character',
      status: 'failed'
    });
  }

  if (!requirements.noPersonalInfo) {
    failedRequirements.push({
      key: 'noPersonalInfo',
      label: 'No personal information',
      status: 'failed'
    });
  }

  if (requirements.notCompromised === false) {
    failedRequirements.push({
      key: 'notCompromised',
      label: 'Not found in data breaches',
      status: 'failed'
    });
  }

  return failedRequirements;
};

/**
 * Creates a conditional validation display configuration
 * @param {Object} validation - Validation state
 * @param {string} password - Current password
 * @param {boolean} hasUserInteracted - User interaction state
 * @returns {Object} Configuration object for conditional display
 */
export const createConditionalValidationConfig = (validation, password, hasUserInteracted) => {
  const shouldShow = shouldShowPasswordValidation(validation, password, hasUserInteracted);
  
  return {
    shouldShow,
    messages: shouldShow ? getValidationMessagesToShow(validation) : [],
    failedRequirements: shouldShow ? getFailedRequirementsToShow(validation.requirements) : [],
    isCheckingHIBP: shouldShow && validation.isCheckingHIBP,
    hibpError: shouldShow ? validation.hibpError : null,
    showSuccessMessage: !shouldShow && password.length > 0 && validation.isValid
  };
};

/**
 * Hook for conditional password validation display
 * Encapsulates the conditional logic in a reusable hook
 * @param {string} password - Current password value
 * @param {string} username - Username for validation
 * @param {string} email - Email for validation
 * @param {boolean} hasUserInteracted - Whether user has interacted
 * @returns {Object} Conditional validation display state
 */
export const useConditionalPasswordValidation = (password, username, email, hasUserInteracted) => {
  const validation = usePasswordValidation(password, username, email);
  
  return createConditionalValidationConfig(validation, password, hasUserInteracted);
};

/**
 * Example usage patterns for conditional validation display
 */
export const ConditionalValidationExamples = {
  // Example 1: Simple conditional display
  simple: (validation, password, hasInteracted) => {
    if (!shouldShowPasswordValidation(validation, password, hasInteracted)) {
      return null; // Don't render anything
    }
    
    return {
      type: 'error',
      messages: getValidationMessagesToShow(validation)
    };
  },

  // Example 2: Detailed conditional display
  detailed: (validation, password, hasInteracted) => {
    const config = createConditionalValidationConfig(validation, password, hasInteracted);
    
    if (!config.shouldShow) {
      return config.showSuccessMessage ? { type: 'success' } : null;
    }
    
    return {
      type: 'validation',
      ...config
    };
  },

  // Example 3: Minimal failure-only display
  minimal: (validation, password, hasInteracted) => {
    // Only show if there are failures AND user has interacted
    if (!hasInteracted || validation.isValid || validation.errors.length === 0) {
      return null;
    }
    
    return {
      type: 'minimal',
      errorCount: validation.errors.length,
      firstError: validation.errors[0]
    };
  }
};

export default {
  shouldShowPasswordValidation,
  getValidationMessagesToShow,
  getFailedRequirementsToShow,
  createConditionalValidationConfig,
  useConditionalPasswordValidation,
  ConditionalValidationExamples
};