/**
 * Enhanced Password Validation Messages
 * Provides user-friendly, contextual messages for password validation
 * Requirements: 4.1, 4.2, 4.3, 6.2, 6.4
 */

/**
 * Enhanced error messages with contextual help
 */
export const PasswordMessages = {
  // Length requirement messages
  length: {
    error: 'Password must be at least 10 characters long',
    hint: 'Longer passwords are much harder to crack. Aim for 12+ characters for extra security.',
    progress: (current) => `${current}/10 characters (${Math.max(0, 10 - current)} more needed)`,
    success: 'Great length! Your password is long enough to be secure.'
  },

  // Uppercase requirement messages
  uppercase: {
    error: 'Password must contain at least one uppercase letter (A-Z)',
    hint: 'Add capital letters like A, B, C to make your password stronger.',
    examples: ['Password123!', 'MySecure2024!', 'StrongPass#1'],
    success: 'Perfect! Uppercase letters add complexity.'
  },

  // Lowercase requirement messages
  lowercase: {
    error: 'Password must contain at least one lowercase letter (a-z)',
    hint: 'Include small letters like a, b, c for better password variety.',
    examples: ['Password123!', 'mySecure2024!', 'strongPass#1'],
    success: 'Excellent! Lowercase letters improve security.'
  },

  // Number requirement messages
  number: {
    error: 'Password must contain at least one number (0-9)',
    hint: 'Numbers like 1, 2, 3 make passwords significantly more secure.',
    examples: ['Password123!', 'MySecure2024!', 'StrongPass1!'],
    success: 'Nice! Numbers greatly increase password strength.'
  },

  // Special character requirement messages
  special: {
    error: 'Password must contain at least one special character',
    hint: 'Use symbols like !@#$%^&* to dramatically strengthen your password.',
    examples: ['Password123!', 'MySecure@2024', 'Strong#Pass1'],
    allowedChars: '~`!@#$%^&*()_=-+/?><>\\|{}[].,',
    success: 'Fantastic! Special characters make passwords very strong.'
  },

  // Personal information requirement messages
  noPersonalInfo: {
    error: 'Password must not contain your username or email address',
    hint: 'Avoid using personal information that others might know about you.',
    suggestions: [
      'Use unrelated words or phrases',
      'Combine random words with numbers',
      'Create a memorable sentence and use initials'
    ],
    success: 'Perfect! Your password doesn\'t contain personal information.'
  },

  // HIBP (breach check) requirement messages
  notCompromised: {
    error: 'This password has appeared in a data breach. Please choose a stronger one.',
    hint: 'This password was found in known security breaches and could be easily guessed.',
    suggestions: [
      'Try adding more characters or symbols',
      'Use a completely different password',
      'Combine multiple unrelated words'
    ],
    checking: 'Checking if this password has been compromised...',
    unavailable: 'Security check temporarily unavailable - your password will still be validated',
    success: 'Excellent! This password hasn\'t been found in any known breaches.'
  },

  // Overall validation messages
  overall: {
    allMet: '🎉 Outstanding! Your password meets all security requirements and is very strong.',
    mostMet: '👍 Almost there! Just a few more requirements to meet.',
    someMet: '📈 Good progress! Keep adding the missing requirements.',
    noneMet: '🔒 Let\'s create a secure password together. Start with the basics above.',
    
    // Progress messages
    progress: {
      0: 'Let\'s start building a secure password',
      1: 'Good start! Keep adding requirements',
      2: 'Making progress! You\'re on the right track',
      3: 'Great work! Almost halfway there',
      4: 'Excellent! You\'re doing really well',
      5: 'Outstanding! Just one more requirement',
      6: 'Perfect! Your password is fully secure'
    }
  },

  // Contextual tips based on current state
  tips: {
    gettingStarted: [
      'Start with a phrase or sentence you can remember',
      'Replace some letters with numbers (e.g., "a" → "@", "o" → "0")',
      'Add special characters at the beginning or end'
    ],
    
    almostThere: [
      'You\'re so close! Just add the missing requirements',
      'Consider making your password even longer for extra security',
      'Double-check that you haven\'t used personal information'
    ],
    
    strongPassword: [
      'Your password is secure! Consider using a password manager',
      'Remember to use unique passwords for different accounts',
      'Update your passwords regularly for best security'
    ],

    // Specific improvement suggestions
    improvements: {
      tooShort: 'Try adding a few more characters - even one more makes a big difference!',
      needsVariety: 'Mix different types of characters for better security',
      tooSimple: 'Avoid common patterns like "123" or "abc"',
      tooPersonal: 'Use something unrelated to your personal information',
      tooCommon: 'This password is too predictable - try something more unique'
    }
  },

  // Encouraging messages for different scenarios
  encouragement: {
    firstTime: 'Creating a strong password is easier than you think!',
    improving: 'You\'re making great improvements to your password security!',
    almostDone: 'Just one more step and you\'ll have an excellent password!',
    completed: 'Congratulations! You\'ve created a very secure password.',
    
    // Motivational security facts
    securityFacts: [
      'A 12-character password takes centuries to crack!',
      'Adding special characters increases security by 1000x',
      'Strong passwords are your first line of defense online',
      'You\'re taking an important step to protect your account'
    ]
  },

  // Error recovery messages
  recovery: {
    networkError: 'Connection issue detected. Your password validation continues without external checks.',
    serviceUnavailable: 'Security service temporarily down. Your password is still being validated locally.',
    timeout: 'Check took too long. Don\'t worry - your password validation continues.',
    retryAvailable: 'You can try the security check again if you\'d like.',
    fallbackActive: 'Using backup validation to keep you moving forward.'
  }
};

/**
 * Gets contextual message based on validation state
 * @param {string} requirement - The requirement type
 * @param {boolean} isMet - Whether requirement is met
 * @param {Object} context - Additional context (current value, etc.)
 * @returns {Object} Message object with text, type, and additional info
 */
export const getRequirementMessage = (requirement, isMet, context = {}) => {
  const messages = PasswordMessages[requirement];
  if (!messages) return { text: '', type: 'info' };

  if (isMet) {
    return {
      text: messages.success,
      type: 'success',
      icon: '✅'
    };
  }

  // Special handling for length with progress
  if (requirement === 'length' && context.currentLength) {
    return {
      text: messages.progress(context.currentLength),
      type: 'info',
      hint: messages.hint,
      icon: '📏'
    };
  }

  // Special handling for HIBP checking state
  if (requirement === 'notCompromised' && context.isChecking) {
    return {
      text: messages.checking,
      type: 'info',
      icon: '🔍'
    };
  }

  return {
    text: messages.error,
    type: 'error',
    hint: messages.hint,
    examples: messages.examples,
    suggestions: messages.suggestions,
    icon: '❌'
  };
};

/**
 * Gets overall validation message based on progress
 * @param {number} metCount - Number of requirements met
 * @param {number} totalCount - Total number of requirements
 * @param {boolean} isValid - Whether password is fully valid
 * @returns {Object} Overall message object
 */
export const getOverallMessage = (metCount, totalCount, isValid) => {
  const progress = PasswordMessages.overall.progress;
  
  if (isValid) {
    return {
      text: PasswordMessages.overall.allMet,
      type: 'success',
      icon: '🎉'
    };
  }

  const progressText = progress[metCount] || progress[0];
  let overallText;

  if (metCount === 0) {
    overallText = PasswordMessages.overall.noneMet;
  } else if (metCount < totalCount / 2) {
    overallText = PasswordMessages.overall.someMet;
  } else {
    overallText = PasswordMessages.overall.mostMet;
  }

  return {
    text: overallText,
    progressText,
    type: metCount > totalCount / 2 ? 'warning' : 'info',
    icon: metCount > totalCount / 2 ? '👍' : '📈'
  };
};

/**
 * Gets contextual tips based on current password state
 * @param {Object} validation - Current validation state
 * @returns {Array} Array of relevant tips
 */
export const getContextualTips = (validation) => {
  const { metRequirementsCount, totalRequirementsCount, isValid } = validation;
  
  if (isValid) {
    return PasswordMessages.tips.strongPassword;
  }
  
  if (metRequirementsCount === 0) {
    return PasswordMessages.tips.gettingStarted;
  }
  
  if (metRequirementsCount >= totalRequirementsCount - 1) {
    return PasswordMessages.tips.almostThere;
  }
  
  // Return specific improvement suggestions
  const tips = [];
  const requirements = validation.requirements;
  
  if (!requirements.length) {
    tips.push(PasswordMessages.tips.improvements.tooShort);
  }
  
  if (!requirements.uppercase || !requirements.lowercase || !requirements.number || !requirements.special) {
    tips.push(PasswordMessages.tips.improvements.needsVariety);
  }
  
  if (!requirements.noPersonalInfo) {
    tips.push(PasswordMessages.tips.improvements.tooPersonal);
  }
  
  if (requirements.notCompromised === false) {
    tips.push(PasswordMessages.tips.improvements.tooCommon);
  }
  
  return tips.slice(0, 2); // Return max 2 tips
};

/**
 * Gets encouraging message based on progress
 * @param {Object} validation - Current validation state
 * @returns {Object} Encouragement message
 */
export const getEncouragementMessage = (validation) => {
  const { metRequirementsCount, totalRequirementsCount, isValid } = validation;
  const encouragement = PasswordMessages.encouragement;
  
  if (isValid) {
    return {
      text: encouragement.completed,
      fact: encouragement.securityFacts[Math.floor(Math.random() * encouragement.securityFacts.length)]
    };
  }
  
  if (metRequirementsCount === 0) {
    return { text: encouragement.firstTime };
  }
  
  if (metRequirementsCount >= totalRequirementsCount - 1) {
    return { text: encouragement.almostDone };
  }
  
  return { text: encouragement.improving };
};

/**
 * Gets error recovery message for failed operations
 * @param {string} errorType - Type of error that occurred
 * @param {boolean} canRetry - Whether retry is available
 * @returns {Object} Recovery message
 */
export const getRecoveryMessage = (errorType, canRetry = false) => {
  const recovery = PasswordMessages.recovery;
  let message;
  
  switch (errorType) {
    case 'NETWORK_ERROR':
      message = recovery.networkError;
      break;
    case 'API_ERROR':
      message = recovery.serviceUnavailable;
      break;
    case 'TIMEOUT_ERROR':
      message = recovery.timeout;
      break;
    default:
      message = recovery.fallbackActive;
  }
  
  return {
    text: message,
    canRetry,
    retryText: canRetry ? recovery.retryAvailable : null,
    type: 'info',
    icon: '🔄'
  };
};

export default PasswordMessages;