// Authentication helper utilities

/**
 * Determines if the input string is likely an email address
 * @param {string} input - The input string to check
 * @returns {boolean} True if input appears to be an email
 */
export const isEmail = (input) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
};

/**
 * Determines if the input string is likely a username
 * @param {string} input - The input string to check
 * @returns {boolean} True if input appears to be a username
 */
export const isUsername = (input) => {
  // Username typically doesn't contain @ symbol and is not an email
  return !isEmail(input) && input.length > 0;
};

/**
 * Validates login identifier (email or username)
 * @param {string} identifier - The email or username to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateLoginIdentifier = (identifier) => {
  if (!identifier || identifier.trim().length === 0) {
    return {
      isValid: false,
      message: 'Email or username is required'
    };
  }

  const trimmedIdentifier = identifier.trim();

  if (isEmail(trimmedIdentifier)) {
    // Validate email format
    if (trimmedIdentifier.length < 5) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      };
    }
    return {
      isValid: true,
      type: 'email',
      message: 'Valid email format'
    };
  } else {
    // Validate username format
    if (trimmedIdentifier.length < 3) {
      return {
        isValid: false,
        message: 'Username must be at least 3 characters long'
      };
    }
    
    if (trimmedIdentifier.length > 30) {
      return {
        isValid: false,
        message: 'Username must be less than 30 characters'
      };
    }

    // Check for valid username characters (alphanumeric, underscore, hyphen)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmedIdentifier)) {
      return {
        isValid: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      };
    }

    return {
      isValid: true,
      type: 'username',
      message: 'Valid username format'
    };
  }
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with isValid, strength, and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      strength: 'none',
      message: 'Password is required'
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'Password must be at least 6 characters long'
    };
  }

  if (password.length < 8) {
    return {
      isValid: true,
      strength: 'weak',
      message: 'Password is weak - consider using at least 8 characters'
    };
  }

  // Check for strong password criteria
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (criteriaCount >= 3 && password.length >= 8) {
    return {
      isValid: true,
      strength: 'strong',
      message: 'Strong password'
    };
  } else if (criteriaCount >= 2) {
    return {
      isValid: true,
      strength: 'medium',
      message: 'Medium strength password'
    };
  } else {
    return {
      isValid: true,
      strength: 'weak',
      message: 'Weak password - consider adding uppercase, numbers, or special characters'
    };
  }
};

/**
 * Formats user display name from user object
 * @param {Object} user - User object with name, username, email
 * @returns {string} Formatted display name
 */
export const formatUserDisplayName = (user) => {
  if (!user) return 'User';
  
  if (user.name) {
    return user.name;
  } else if (user.username) {
    return `@${user.username}`;
  } else if (user.email) {
    return user.email;
  } else {
    return 'User';
  }
};