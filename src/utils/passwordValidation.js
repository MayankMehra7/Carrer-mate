/**
 * Password validation utility functions
 * Implements comprehensive password validation rules for CareerMate app
 */

/**
 * Validates password against all complexity requirements
 * @param {string} password - The password to validate
 * @param {string} username - User's username for personal info checking
 * @param {string} email - User's email for personal info checking
 * @returns {Object} Object containing validation results for each requirement
 */
export const validatePasswordRequirements = (password, username = '', email = '') => {
  const requirements = {
    // Requirement 1.1: At least 10 characters long
    length: password.length >= 10,
    
    // Requirement 1.2: At least one uppercase letter (A-Z)
    uppercase: /[A-Z]/.test(password),
    
    // Requirement 1.3: At least one lowercase letter (a-z)
    lowercase: /[a-z]/.test(password),
    
    // Requirement 1.4: At least one number (0-9)
    number: /[0-9]/.test(password),
    
    // Requirement 1.5: At least one special character from specified set
    special: /[~`!@#$%^&*()_=\-+/?><\\|{}[\].,]/.test(password),
    
    // Requirements 2.1-2.4: Personal information detection
    noPersonalInfo: true,
    
    // Requirement 3.1: HIBP check (initially null, will be set by HIBP integration)
    notCompromised: null
  };

  // Check for personal information (Requirements 2.1-2.4: Case-insensitive matching)
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    requirements.noPersonalInfo = false;
  }
  
  if (email) {
    const emailUsername = email.split('@')[0];
    // Check both email username and full email address
    if (password.toLowerCase().includes(emailUsername.toLowerCase()) ||
        password.toLowerCase().includes(email.toLowerCase())) {
      requirements.noPersonalInfo = false;
    }
  }

  return requirements;
};

/**
 * Checks if password meets minimum length requirement
 * @param {string} password - The password to check
 * @returns {boolean} True if password meets length requirement
 */
export const checkPasswordLength = (password) => {
  // Requirement 1.1: At least 10 characters long
  return password.length >= 10;
};

/**
 * Checks if password contains at least one uppercase letter
 * @param {string} password - The password to check
 * @returns {boolean} True if password contains uppercase letter
 */
export const checkUppercaseRequirement = (password) => {
  // Requirement 1.2: At least one uppercase letter (A-Z)
  return /[A-Z]/.test(password);
};

/**
 * Checks if password contains at least one lowercase letter
 * @param {string} password - The password to check
 * @returns {boolean} True if password contains lowercase letter
 */
export const checkLowercaseRequirement = (password) => {
  // Requirement 1.3: At least one lowercase letter (a-z)
  return /[a-z]/.test(password);
};

/**
 * Checks if password contains at least one number
 * @param {string} password - The password to check
 * @returns {boolean} True if password contains number
 */
export const checkNumberRequirement = (password) => {
  // Requirement 1.4: At least one number (0-9)
  return /[0-9]/.test(password);
};

/**
 * Checks if password contains at least one special character from specified set
 * @param {string} password - The password to check
 * @returns {boolean} True if password contains special character
 */
export const checkSpecialCharacterRequirement = (password) => {
  // Requirement 1.5: Special characters from set ~`!@#$%^&*()_=-+/?><>\|{}[].,
  return /[~`!@#$%^&*()_=\-+/?><\\|{}[\].,]/.test(password);
};

/**
 * Checks if password contains personal information
 * @param {string} password - The password to check
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @returns {boolean} True if password does NOT contain personal info
 */
export const checkPersonalInfoRequirement = (password, username = '', email = '') => {
  // Requirements 2.3, 2.4: Case-insensitive matching for personal information
  const lowerPassword = password.toLowerCase();
  
  // Requirement 2.1: Check if password contains username
  if (username && lowerPassword.includes(username.toLowerCase())) {
    return false;
  }
  
  // Requirement 2.2: Check if password contains email or email username
  if (email) {
    const emailUsername = email.split('@')[0];
    if (lowerPassword.includes(emailUsername.toLowerCase()) ||
        lowerPassword.includes(email.toLowerCase())) {
      return false;
    }
  }
  
  return true;
};

/**
 * Generates specific error messages for failed password requirements
 * @param {Object} requirements - Object containing validation results
 * @returns {Array} Array of error messages for failed requirements
 */
export const generateErrorMessages = (requirements) => {
  const errors = [];
  
  // Requirement 6.1: Specific error messages for each failed requirement
  if (!requirements.length) {
    errors.push('Password must be at least 10 characters long');
  }
  
  if (!requirements.uppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!requirements.lowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!requirements.number) {
    errors.push('Password must contain at least one number');
  }
  
  if (!requirements.special) {
    errors.push('Password must contain at least one special character');
  }
  
  if (!requirements.noPersonalInfo) {
    // Requirements 2.1, 2.2: Specific messages for personal info violations
    errors.push('Password must not contain your username or email address');
  }
  
  if (requirements.notCompromised === false) {
    // Requirement 3.2: Specific message for compromised passwords
    errors.push('This password is too common and has appeared in a data breach. Please choose a stronger one.');
  }
  
  return errors;
};

/**
 * Checks if password meets all complexity requirements (excluding HIBP check)
 * @param {string} password - The password to validate
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @returns {boolean} True if password meets all complexity requirements
 */
export const isPasswordComplexityValid = (password, username = '', email = '') => {
  const requirements = validatePasswordRequirements(password, username, email);
  
  // Check all requirements except notCompromised (handled separately by HIBP)
  return requirements.length &&
         requirements.uppercase &&
         requirements.lowercase &&
         requirements.number &&
         requirements.special &&
         requirements.noPersonalInfo;
};

/**
 * Gets a summary of password validation status
 * @param {Object} requirements - Object containing validation results
 * @returns {Object} Summary object with counts and overall status
 */
export const getValidationSummary = (requirements) => {
  const totalRequirements = 7; // length, uppercase, lowercase, number, special, noPersonalInfo, notCompromised
  let metRequirements = 0;
  
  // Count met requirements
  Object.entries(requirements).forEach(([key, value]) => {
    if (key === 'notCompromised') {
      // Only count as met if explicitly true (not null or false)
      if (value === true) metRequirements++;
    } else if (value === true) {
      metRequirements++;
    }
  });
  
  return {
    metRequirements,
    totalRequirements,
    isValid: metRequirements === totalRequirements,
    percentComplete: Math.round((metRequirements / totalRequirements) * 100)
  };
};

/**
 * Validates password and returns comprehensive validation result
 * @param {string} password - The password to validate
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @returns {Object} Comprehensive validation result
 */
export const validatePassword = (password, username = '', email = '') => {
  const requirements = validatePasswordRequirements(password, username, email);
  const errors = generateErrorMessages(requirements);
  const summary = getValidationSummary(requirements);
  
  return {
    requirements,
    errors,
    summary,
    isValid: summary.isValid && errors.length === 0
  };
};