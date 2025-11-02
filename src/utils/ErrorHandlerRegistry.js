/**
 * Centralized Error Handler Registry
 * Manages different error handler categories with static import support
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { ErrorCategory, ErrorSeverity } from './errorHandling.js';

/**
 * Performance monitoring for error handling operations
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} operationId - Unique identifier for the operation
   */
  startTiming(operationId) {
    this.startTimes.set(operationId, performance.now());
  }

  /**
   * End timing and record metrics
   * @param {string} operationId - Unique identifier for the operation
   * @param {string} category - Error category for grouping metrics
   */
  endTiming(operationId, category = 'UNKNOWN') {
    const startTime = this.startTimes.get(operationId);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric(category, duration);
      this.startTimes.delete(operationId);
      return duration;
    }
    return null;
  }

  /**
   * Record a performance metric
   * @param {string} category - Error category
   * @param {number} duration - Duration in milliseconds
   */
  recordMetric(category, duration) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }

    const metric = this.metrics.get(category);
    metric.count++;
    metric.totalTime += duration;
    metric.averageTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
  }

  /**
   * Get performance metrics for a category
   * @param {string} category - Error category
   * @returns {Object} Performance metrics
   */
  getMetrics(category) {
    return this.metrics.get(category) || null;
  }

  /**
   * Get all performance metrics
   * @returns {Object} All performance metrics
   */
  getAllMetrics() {
    const result = {};
    for (const [category, metrics] of this.metrics) {
      result[category] = { ...metrics };
    }
    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

/**
 * Base error handler interface
 */
export class BaseErrorHandler {
  constructor(category, priority = 0) {
    this.category = category;
    this.priority = priority;
    this.handledCount = 0;
    this.lastHandled = null;
  }

  /**
   * Handle an error - to be implemented by subclasses
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @returns {Object} Error handling result
   */
  handle(error, context) {
    this.handledCount++;
    this.lastHandled = new Date().toISOString();
    
    // Default implementation - should be overridden
    return {
      handled: true,
      category: this.category,
      context,
      timestamp: this.lastHandled,
      userMessage: 'An error occurred',
      severity: ErrorSeverity.MEDIUM,
      shouldFallback: true
    };
  }

  /**
   * Check if this handler can handle the given error
   * @param {Error} error - The error to check
   * @param {string} context - Context where error occurred
   * @returns {boolean} True if this handler can handle the error
   */
  canHandle(error, context) {
    // Default implementation - should be overridden
    return true;
  }

  /**
   * Get handler statistics
   * @returns {Object} Handler statistics
   */
  getStats() {
    return {
      category: this.category,
      priority: this.priority,
      handledCount: this.handledCount,
      lastHandled: this.lastHandled
    };
  }
}

/**
 * Centralized Error Handler Registry
 * Manages error handlers with performance monitoring and categorization
 */
export class ErrorHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.performanceMonitor = new PerformanceMonitor();
    this.globalErrorCount = 0;
    this.errorLog = [];
    this.maxLogSize = 1000;
  }

  /**
   * Register an error handler for a specific category
   * @param {string} category - Error category from ErrorCategory enum
   * @param {BaseErrorHandler} handler - Error handler instance
   * @throws {Error} If category or handler is invalid
   */
  registerHandler(category, handler) {
    if (!category || typeof category !== 'string') {
      throw new Error('Category must be a non-empty string');
    }

    if (!handler || typeof handler.handle !== 'function') {
      throw new Error('Handler must implement handle method');
    }

    if (!this.handlers.has(category)) {
      this.handlers.set(category, []);
    }

    // Insert handler in priority order (higher priority first)
    const categoryHandlers = this.handlers.get(category);
    const insertIndex = categoryHandlers.findIndex(h => h.priority < handler.priority);
    
    if (insertIndex === -1) {
      categoryHandlers.push(handler);
    } else {
      categoryHandlers.splice(insertIndex, 0, handler);
    }

    console.info(`Registered error handler for category: ${category}, priority: ${handler.priority}`);
  }

  /**
   * Get error handler for a specific category
   * @param {string} category - Error category
   * @returns {BaseErrorHandler|null} First matching handler or null
   */
  getHandler(category) {
    const categoryHandlers = this.handlers.get(category);
    return categoryHandlers && categoryHandlers.length > 0 ? categoryHandlers[0] : null;
  }

  /**
   * Get all handlers for a specific category
   * @param {string} category - Error category
   * @returns {BaseErrorHandler[]} Array of handlers for the category
   */
  getHandlers(category) {
    return this.handlers.get(category) || [];
  }

  /**
   * Handle an error using the appropriate registered handler
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @param {string} category - Optional category override
   * @returns {Object} Error handling result
   */
  handleError(error, context = 'UNKNOWN', category = null) {
    const operationId = `error_${Date.now()}_${Math.random()}`;
    this.performanceMonitor.startTiming(operationId);

    try {
      this.globalErrorCount++;

      // Determine error category if not provided
      const errorCategory = category || this.categorizeError(error, context);
      
      // Get handlers for the category
      const categoryHandlers = this.getHandlers(errorCategory);
      
      let result = null;
      
      // Try handlers in priority order
      for (const handler of categoryHandlers) {
        if (handler.canHandle(error, context)) {
          result = handler.handle(error, context);
          break;
        }
      }

      // If no specific handler found, use default handling
      if (!result) {
        result = this.handleUnknownError(error, context, errorCategory);
      }

      // Log the error handling
      this.logErrorHandling(error, context, errorCategory, result);

      // Record performance metrics
      const duration = this.performanceMonitor.endTiming(operationId, errorCategory);
      
      // Add performance info to result
      result.performanceMetrics = {
        handlingDuration: duration,
        category: errorCategory,
        handlerUsed: result.handlerUsed || 'default'
      };

      return result;

    } catch (handlingError) {
      console.error('Error in error handling:', handlingError);
      
      // Fallback error handling
      const duration = this.performanceMonitor.endTiming(operationId, 'ERROR_HANDLING_FAILURE');
      
      return {
        handled: false,
        error: handlingError,
        originalError: error,
        context,
        userMessage: 'An unexpected error occurred',
        severity: ErrorSeverity.CRITICAL,
        shouldFallback: true,
        performanceMetrics: {
          handlingDuration: duration,
          category: 'ERROR_HANDLING_FAILURE',
          handlerUsed: 'fallback'
        }
      };
    }
  }

  /**
   * Categorize an error based on its properties
   * @param {Error} error - The error to categorize
   * @param {string} context - Context where error occurred
   * @returns {string} Error category
   */
  categorizeError(error, context) {
    // Network-related errors
    if (error.name === 'AbortError' || 
        error.message.includes('timeout') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED')) {
      return ErrorCategory.NETWORK;
    }

    // API-related errors
    if (error.message.includes('429') ||
        error.message.includes('503') ||
        error.message.includes('500') ||
        error.message.includes('API') ||
        error.message.includes('HIBP')) {
      return ErrorCategory.API;
    }

    // Validation errors
    if (error.name === 'ValidationError' ||
        error.message.includes('validation') ||
        error.message.includes('invalid') ||
        context.includes('VALIDATION')) {
      return ErrorCategory.VALIDATION;
    }

    // Security errors
    if (error.message.includes('security') ||
        error.message.includes('unauthorized') ||
        error.message.includes('forbidden') ||
        context.includes('SECURITY')) {
      return ErrorCategory.SECURITY;
    }

    // User input errors
    if (context.includes('USER_INPUT') ||
        error.message.includes('user input') ||
        error.message.includes('form')) {
      return ErrorCategory.USER_INPUT;
    }

    // Default to system error
    return ErrorCategory.SYSTEM;
  }

  /**
   * Handle unknown errors with default behavior
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @param {string} category - Error category
   * @returns {Object} Error handling result
   */
  handleUnknownError(error, context, category) {
    return {
      handled: true,
      category,
      context,
      timestamp: new Date().toISOString(),
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: ErrorSeverity.HIGH,
      shouldFallback: true,
      handlerUsed: 'default',
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
  }

  /**
   * Log error handling for monitoring and debugging
   * @param {Error} error - The original error
   * @param {string} context - Context where error occurred
   * @param {string} category - Error category
   * @param {Object} result - Error handling result
   */
  logErrorHandling(error, context, category, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      category,
      result: {
        handled: result.handled,
        severity: result.severity,
        userMessage: result.userMessage,
        handlerUsed: result.handlerUsed
      },
      globalErrorCount: this.globalErrorCount
    };

    this.errorLog.push(logEntry);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console logging based on severity
    const logMessage = `[${category}] ${context}: ${error.message}`;
    
    switch (result.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(logMessage, logEntry);
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
   * Remove all handlers for a category
   * @param {string} category - Error category to clear
   */
  clearHandlers(category = null) {
    if (category) {
      this.handlers.delete(category);
      console.info(`Cleared handlers for category: ${category}`);
    } else {
      this.handlers.clear();
      console.info('Cleared all error handlers');
    }
  }

  /**
   * Get registry statistics and performance metrics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const stats = {
      totalHandlers: 0,
      handlersByCategory: {},
      globalErrorCount: this.globalErrorCount,
      recentErrors: this.errorLog.slice(-10),
      performanceMetrics: this.performanceMonitor.getAllMetrics()
    };

    // Count handlers by category
    for (const [category, handlers] of this.handlers) {
      stats.handlersByCategory[category] = handlers.length;
      stats.totalHandlers += handlers.length;
    }

    return stats;
  }

  /**
   * Get detailed handler information
   * @returns {Object} Detailed handler information
   */
  getHandlerDetails() {
    const details = {};
    
    for (const [category, handlers] of this.handlers) {
      details[category] = handlers.map(handler => handler.getStats());
    }

    return details;
  }

  /**
   * Clear error log and reset counters
   */
  clearErrorLog() {
    this.errorLog = [];
    this.globalErrorCount = 0;
    this.performanceMonitor.clearMetrics();
    console.info('Cleared error log and reset counters');
  }

  /**
   * Check if a handler is registered for a category
   * @param {string} category - Error category to check
   * @returns {boolean} True if handler exists for category
   */
  hasHandler(category) {
    const handlers = this.handlers.get(category);
    return handlers && handlers.length > 0;
  }

  /**
   * Get all registered categories
   * @returns {string[]} Array of registered categories
   */
  getRegisteredCategories() {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance for global use
export const errorHandlerRegistry = new ErrorHandlerRegistry();

export default errorHandlerRegistry; 