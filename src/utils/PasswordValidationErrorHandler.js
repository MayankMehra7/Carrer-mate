/**
 * Enhanced Password Validation Error Handler
 * Integrates with ErrorHandlerRegistry for centralized error management
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { BaseErrorHandler, errorHandlerRegistry } from './ErrorHandlerRegistry';
import { ErrorCategory, ErrorSeverity } from './errorHandling';

/**
 * Enhanced Password Validation Error Handler
 * Extends BaseErrorHandler to provide specialized password validation error handling
 */
export class PasswordValidationErrorHandler extends BaseErrorHandler {
  constructor() {
    super(ErrorCategory.VALIDATION, 10); // High priority for validation errors
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.hibpErrorCount = 0;
    this.networkErrorCount = 0;
    this.validationErrorCount = 0;
  }

  /**
   * Check if this handler can handle the given error
   * @param {Error} error - The error to check
   * @param {string} context - Context where error occurred
   * @returns {boolean} True if this handler can handle the error
   */
  canHandle(error, context) {
    // Handle password validation related errors
    return (
      context.includes('PASSWORD') ||
      context.includes('VALIDATION') ||
      context.includes('HIBP') ||
      error.message.includes('password') ||
      error.message.includes('validation') ||
      error.message.includes('HIBP') ||
      error.message.includes('pwned')
    );
  }

  /**
   * Handle password validation errors with enhanced categorization
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @returns {Object} Error handling result
   */
  handle(error, context) {
    // Call parent to update statistics
    const baseResult = super.handle(error, context);

    // Determine specific error type and handle accordingly
    if (this.isHIBPError(error, context)) {
      return this.handleHIBPError(error, context);
    } else if (this.isNetworkError(error, context)) {
      return this.handleNetworkTimeout(error, context);
    } else if (this.isValidationError(error, context)) {
      return this.handleValidationError(error, context);
    } else {
      return this.handleSystemError(error, context);
    }
  }

  /**
   * Check if error is HIBP-related
   * @param {Error} error - The error to check
   * @param {string} context - Context where error occurred
   * @returns {boolean} True if HIBP error
   */
  isHIBPError(error, context) {
    return (
      error.message.includes('HIBP') ||
      error.message.includes('pwned') ||
      context.includes('HIBP') ||
      error.message.includes('haveibeenpwned') ||
      (error.message.includes('429') && context.includes('PASSWORD')) ||
      (error.message.includes('503') && context.includes('PASSWORD'))
    );
  }

  /**
   * Check if error is network-related
   * @param {Error} error - The error to check
   * @param {string} context - Context where error occurred
   * @returns {boolean} True if network error
   */
  isNetworkError(error, context) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ECONNREFUSED')
    );
  }

  /**
   * Check if error is validation-related
   * @param {Error} error - The error to check
   * @param {string} context - Context where error occurred
   * @returns {boolean} True if validation error
   */
  isValidationError(error, context) {
    return (
      error.name === 'ValidationError' ||
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      context.includes('VALIDATION')
    );
  }

  /**
   * Handles HIBP API errors with appropriate fallback behavior
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @returns {Object} Error handling result with fallback decision
   */
  handleHIBPError(error, context = 'HIBP_CHECK') {
    this.hibpErrorCount++;

    const errorInfo = {
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      shouldFallback: true,
      userMessage: 'Password security check temporarily unavailable',
      logMessage: error.message,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.API,
      handlerUsed: 'PasswordValidationErrorHandler.handleHIBPError'
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

    // Requirement 3.4: Always allow graceful fallback for HIBP errors
    return {
      handled: true,
      shouldFallback: true,
      userMessage: errorInfo.userMessage,
      errorType: errorInfo.category,
      severity: errorInfo.severity,
      canRetry: this.canRetry(context),
      handlerUsed: errorInfo.handlerUsed,
      category: this.category,
      context,
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Handles network timeout errors with retry logic
   * @param {Error} error - The timeout error
   * @param {string} context - Context where timeout occurred
   * @returns {Object} Timeout handling result
   */
  handleNetworkTimeout(error, context = 'NETWORK_REQUEST') {
    this.networkErrorCount++;
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
      category: ErrorCategory.NETWORK,
      handlerUsed: 'PasswordValidationErrorHandler.handleNetworkTimeout'
    };

    // Update retry count
    this.retryAttempts.set(context, currentRetries + 1);

    // Clear retry count after successful operation (handled externally)
    setTimeout(() => {
      if (this.retryAttempts.get(context) === currentRetries + 1) {
        this.retryAttempts.delete(context);
      }
    }, 60000); // Clear after 1 minute

    return {
      handled: true,
      canRetry: errorInfo.canRetry,
      retryAttempt: errorInfo.retryAttempt,
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      shouldFallback: !errorInfo.canRetry, // Fallback if no more retries
      handlerUsed: errorInfo.handlerUsed,
      category: this.category,
      context,
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Handles validation errors with user-friendly messages
   * @param {Error} error - The validation error
   * @param {string} field - Field that failed validation
   * @returns {Object} Validation error handling result
   */
  handleValidationError(error, field = 'password') {
    this.validationErrorCount++;

    const errorInfo = {
      originalError: error,
      field,
      timestamp: new Date().toISOString(),
      userMessage: error.message || 'Validation failed',
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      handlerUsed: 'PasswordValidationErrorHandler.handleValidationError'
    };

    return {
      handled: true,
      userMessage: errorInfo.userMessage,
      field: errorInfo.field,
      severity: errorInfo.severity,
      isValidationError: true,
      handlerUsed: errorInfo.handlerUsed,
      category: this.category,
      context: field,
      timestamp: errorInfo.timestamp
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
      userMessage: 'An unexpected error occurred during password validation. Please try again.',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      handlerUsed: 'PasswordValidationErrorHandler.handleSystemError'
    };

    return {
      handled: true,
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      shouldReportToUser: true,
      shouldFallback: true,
      handlerUsed: errorInfo.handlerUsed,
      category: this.category,
      context,
      timestamp: errorInfo.timestamp
    };
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
   * Get enhanced statistics including error type counts
   * @returns {Object} Enhanced handler statistics
   */
  getStats() {
    const baseStats = super.getStats();
    return {
      ...baseStats,
      hibpErrorCount: this.hibpErrorCount,
      networkErrorCount: this.networkErrorCount,
      validationErrorCount: this.validationErrorCount,
      activeRetries: this.retryAttempts.size,
      retryContexts: Array.from(this.retryAttempts.keys())
    };
  }

  /**
   * Clear all error counts and retry state
   */
  clearStats() {
    this.hibpErrorCount = 0;
    this.networkErrorCount = 0;
    this.validationErrorCount = 0;
    this.retryAttempts.clear();
    this.handledCount = 0;
    this.lastHandled = null;
  }
}

// Create singleton instance
export const passwordValidationErrorHandler = new PasswordValidationErrorHandler();

// Register with the global error handler registry
errorHandlerRegistry.registerHandler(ErrorCategory.VALIDATION, passwordValidationErrorHandler);

// Also register for API category to handle HIBP errors
errorHandlerRegistry.registerHandler(ErrorCategory.API, passwordValidationErrorHandler);

// Also register for network category to handle network timeouts in password validation
errorHandlerRegistry.registerHandler(ErrorCategory.NETWORK, passwordValidationErrorHandler);

export default passwordValidationErrorHandler;