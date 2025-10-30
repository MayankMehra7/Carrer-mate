/**
 * Comprehensive Error Handling Utility
 * Provides centralized error handling, logging, and user-friendly error messages
 * Requirements: 3.4, 3.5, 5.4, 6.5
 */

/**
 * Error severity levels for proper categorization
 */
export const ErrorSeverity = {
  LOW: 'LOW',           // Minor issues, graceful degradation
  MEDIUM: 'MEDIUM',     // Functionality impacted but workarounds available
  HIGH: 'HIGH',         // Major functionality broken
  CRITICAL: 'CRITICAL'  // System unusable
};

/**
 * Error categories for better organization
 */
export const ErrorCategory = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  API: 'API',
  USER_INPUT: 'USER_INPUT',
  SYSTEM: 'SYSTEM',
  SECURITY: 'SECURITY'
};

/**
 * Enhanced error class with additional context
 */
export class ValidationError extends Error {
  constructor(message, category = ErrorCategory.VALIDATION, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'ValidationError';
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.userMessage = this.generateUserMessage();
  }

  /**
   * Generates user-friendly error message based on error type
   * @returns {string} User-friendly error message
   */
  generateUserMessage() {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorCategory.API:
        return 'Service temporarily unavailable. Please try again in a moment.';
      case ErrorCategory.VALIDATION:
        return this.message; // Validation messages are already user-friendly
      case ErrorCategory.SECURITY:
        return 'Security check failed. Please try a different password.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Error handler for password validation system
 */
export class PasswordValidationErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
  }

  /**
   * Handles HIBP API errors with appropriate fallback behavior
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @returns {Object} Error handling result with fallback decision
   */
  handleHIBPError(error, context = 'HIBP_CHECK') {
    const errorInfo = {
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      shouldFallback: true,
      userMessage: 'Password security check temporarily unavailable',
      logMessage: error.message,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.API
    };

    // Categorize error based on type and message
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorInfo.category = ErrorCategory.NETWORK;
      errorInfo.userMessage = 'Password check timed out - continuing with validation';
      errorInfo.severity = ErrorSeverity.LOW;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorInfo.category = ErrorCategory.NETWORK;
      errorInfo.userMessage = 'Network connection issue - password check skipped';
      errorInfo.severity = ErrorSeverity.MEDIUM;
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorInfo.category = ErrorCategory.API;
      errorInfo.userMessage = 'Too many requests - password check temporarily disabled';
      errorInfo.severity = ErrorSeverity.MEDIUM;
    } else if (error.message.includes('503') || error.message.includes('unavailable')) {
      errorInfo.category = ErrorCategory.API;
      errorInfo.userMessage = 'Password security service temporarily unavailable';
      errorInfo.severity = ErrorSeverity.MEDIUM;
    }

    // Log error without exposing sensitive information (Requirement 5.4)
    this.logError(errorInfo);

    // Requirement 3.4: Always allow graceful fallback for HIBP errors
    return {
      shouldFallback: true,
      userMessage: errorInfo.userMessage,
      errorType: errorInfo.category,
      severity: errorInfo.severity,
      canRetry: this.canRetry(context)
    };
  }

  /**
   * Handles network timeout errors with retry logic
   * @param {Error} error - The timeout error
   * @param {string} context - Context where timeout occurred
   * @returns {Object} Timeout handling result
   */
  handleNetworkTimeout(error, context = 'NETWORK_REQUEST') {
    const retryKey = `${context}_${Date.now()}`;
    const currentRetries = this.retryAttempts.get(context) || 0;

    const errorInfo = {
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      retryAttempt: currentRetries + 1,
      maxRetries: this.maxRetries,
      canRetry: currentRetries < this.maxRetries,
      userMessage: 'Request timed out. Please check your connection.',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.NETWORK
    };

    // Update retry count
    this.retryAttempts.set(context, currentRetries + 1);

    // Clear retry count after successful operation (handled externally)
    setTimeout(() => {
      if (this.retryAttempts.get(context) === currentRetries + 1) {
        this.retryAttempts.delete(context);
      }
    }, 60000); // Clear after 1 minute

    this.logError(errorInfo);

    return {
      canRetry: errorInfo.canRetry,
      retryAttempt: errorInfo.retryAttempt,
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      shouldFallback: !errorInfo.canRetry // Fallback if no more retries
    };
  }

  /**
   * Handles validation errors with user-friendly messages
   * @param {Error} error - The validation error
   * @param {string} field - Field that failed validation
   * @returns {Object} Validation error handling result
   */
  handleValidationError(error, field = 'password') {
    const errorInfo = {
      originalError: error,
      field,
      timestamp: new Date().toISOString(),
      userMessage: error.message || 'Validation failed',
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION
    };

    // Don't log validation errors as they're expected user feedback
    // Only log if it's an unexpected validation error
    if (!error.message || error.message.includes('unexpected')) {
      this.logError(errorInfo);
    }

    return {
      userMessage: errorInfo.userMessage,
      field: errorInfo.field,
      severity: errorInfo.severity,
      isValidationError: true
    };
  }

  /**
   * Handles system errors with appropriate logging and fallback
   * @param {Error} error - The system error
   * @param {string} context - Context where error occurred
   * @returns {Object} System error handling result
   */
  handleSystemError(error, context = 'SYSTEM') {
    const errorInfo = {
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM
    };

    this.logError(errorInfo);

    return {
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      shouldReportToUser: true,
      shouldFallback: true
    };
  }

  /**
   * Logs error information for debugging and monitoring
   * @param {Object} errorInfo - Error information to log
   */
  logError(errorInfo) {
    // Add to error log
    this.errorLog.push(errorInfo);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console logging based on severity
    const logMessage = `[${errorInfo.category}] ${errorInfo.context}: ${errorInfo.logMessage || errorInfo.originalError?.message}`;
    
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(logMessage, errorInfo);
        break;
      case ErrorSeverity.HIGH:
        console.error(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage);
        break;
      case ErrorSeverity.LOW:
      default:
        console.info(logMessage);
        break;
    }
  }

  /**
   * Checks if retry is allowed for a given context
   * @param {string} context - Context to check retry for
   * @returns {boolean} True if retry is allowed
   */
  canRetry(context) {
    const currentRetries = this.retryAttempts.get(context) || 0;
    return currentRetries < this.maxRetries;
  }

  /**
   * Resets retry count for a context (call after successful operation)
   * @param {string} context - Context to reset
   */
  resetRetryCount(context) {
    this.retryAttempts.delete(context);
  }

  /**
   * Gets error statistics for monitoring
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: this.errorLog.slice(-10),
      activeRetries: this.retryAttempts.size
    };

    // Count errors by category and severity
    this.errorLog.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clears error log and retry counts
   */
  clearErrorLog() {
    this.errorLog = [];
    this.retryAttempts.clear();
  }
}

/**
 * Singleton instance for global error handling
 */
export const passwordValidationErrorHandler = new PasswordValidationErrorHandler();

/**
 * Utility functions for common error handling scenarios
 */

/**
 * Wraps async functions with comprehensive error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error handling
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (asyncFn, context = 'ASYNC_OPERATION') => {
  return async (...args) => {
    try {
      const result = await asyncFn(...args);
      // Reset retry count on success
      passwordValidationErrorHandler.resetRetryCount(context);
      return result;
    } catch (error) {
      // Handle different types of errors
      if (error.message.includes('HIBP') || error.message.includes('pwned')) {
        return passwordValidationErrorHandler.handleHIBPError(error, context);
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return passwordValidationErrorHandler.handleNetworkTimeout(error, context);
      } else if (error.name === 'ValidationError') {
        return passwordValidationErrorHandler.handleValidationError(error, context);
      } else {
        return passwordValidationErrorHandler.handleSystemError(error, context);
      }
    }
  };
};

/**
 * Creates a fallback function that provides default behavior when operations fail
 * @param {Function} primaryFn - Primary function to try
 * @param {Function} fallbackFn - Fallback function if primary fails
 * @param {string} context - Context for error handling
 * @returns {Function} Function with fallback behavior
 */
export const withFallback = (primaryFn, fallbackFn, context = 'FALLBACK_OPERATION') => {
  return async (...args) => {
    try {
      return await primaryFn(...args);
    } catch (error) {
      console.warn(`Primary operation failed, using fallback (${context}):`, error.message);
      
      try {
        return await fallbackFn(...args);
      } catch (fallbackError) {
        console.error(`Fallback also failed (${context}):`, fallbackError.message);
        throw fallbackError;
      }
    }
  };
};

/**
 * Debounced error handler to prevent error spam
 * @param {Function} errorHandler - Error handling function
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced error handler
 */
export const debouncedErrorHandler = (errorHandler, delay = 1000) => {
  let timeoutId = null;
  let lastError = null;

  return (error, context) => {
    lastError = { error, context };
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastError) {
        errorHandler(lastError.error, lastError.context);
        lastError = null;
      }
    }, delay);
  };
};

export default passwordValidationErrorHandler;