/**
 * Unit Tests for Error Handler Registry
 * Tests error handler registration, retrieval, categorization, and performance monitoring
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import {
    BaseErrorHandler,
    ErrorHandlerRegistry,
    errorHandlerRegistry
} from '../utils/ErrorHandlerRegistry';
import { ErrorCategory, ErrorSeverity } from '../utils/errorHandling';

/**
 * Mock error handler for testing
 */
class MockErrorHandler extends BaseErrorHandler {
  constructor(category, priority = 0, canHandleResult = true) {
    super(category, priority);
    this.canHandleResult = canHandleResult;
    this.handleCalls = [];
  }

  canHandle(error, context) {
    return this.canHandleResult;
  }

  handle(error, context) {
    const result = super.handle(error, context);
    this.handleCalls.push({ error, context, timestamp: new Date().toISOString() });
    
    return {
      ...result,
      handlerUsed: `MockErrorHandler-${this.category}`,
      mockHandled: true
    };
  }

  getHandleCalls() {
    return this.handleCalls;
  }

  clearHandleCalls() {
    this.handleCalls = [];
  }
}

/**
 * Test suite for Error Handler Registry
 */
export const testErrorHandlerRegistry = () => {
  console.log('🧪 Testing Error Handler Registry...');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  const runTest = (testName, testFn) => {
    testsTotal++;
    try {
      console.log(`  Testing: ${testName}`);
      const result = testFn();
      if (result) {
        testsPassed++;
        console.log(`  ✅ ${testName} - PASSED`);
      } else {
        console.error(`  ❌ ${testName} - FAILED`);
      }
    } catch (error) {
      console.error(`  ❌ ${testName} - ERROR:`, error.message);
    }
  };

  // Test 1: Registry instantiation
  runTest('Registry instantiation', () => {
    const registry = new ErrorHandlerRegistry();
    return registry instanceof ErrorHandlerRegistry &&
           registry.handlers instanceof Map &&
           registry.performanceMonitor &&
           registry.globalErrorCount === 0;
  });

  // Test 2: Handler registration
  runTest('Handler registration', () => {
    const registry = new ErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.VALIDATION, 5);
    
    registry.registerHandler(ErrorCategory.VALIDATION, handler);
    
    const retrievedHandler = registry.getHandler(ErrorCategory.VALIDATION);
    return retrievedHandler === handler;
  });

  // Test 3: Handler registration validation
  runTest('Handler registration validation', () => {
    const registry = new ErrorHandlerRegistry();
    
    try {
      // Should throw error for invalid category
      registry.registerHandler('', new MockErrorHandler(ErrorCategory.VALIDATION));
      return false;
    } catch (error) {
      // Expected error
    }
    
    try {
      // Should throw error for invalid handler
      registry.registerHandler(ErrorCategory.VALIDATION, {});
      return false;
    } catch (error) {
      // Expected error
      return true;
    }
  });

  // Test 4: Priority-based handler ordering
  runTest('Priority-based handler ordering', () => {
    const registry = new ErrorHandlerRegistry();
    const lowPriorityHandler = new MockErrorHandler(ErrorCategory.NETWORK, 1);
    const highPriorityHandler = new MockErrorHandler(ErrorCategory.NETWORK, 10);
    const mediumPriorityHandler = new MockErrorHandler(ErrorCategory.NETWORK, 5);
    
    // Register in random order
    registry.registerHandler(ErrorCategory.NETWORK, lowPriorityHandler);
    registry.registerHandler(ErrorCategory.NETWORK, highPriorityHandler);
    registry.registerHandler(ErrorCategory.NETWORK, mediumPriorityHandler);
    
    const handlers = registry.getHandlers(ErrorCategory.NETWORK);
    
    // Should be ordered by priority (highest first)
    return handlers.length === 3 &&
           handlers[0] === highPriorityHandler &&
           handlers[1] === mediumPriorityHandler &&
           handlers[2] === lowPriorityHandler;
  });

  // Test 5: Error categorization
  runTest('Error categorization', () => {
    const registry = new ErrorHandlerRegistry();
    
    // Test network error categorization
    const networkError = new Error('Failed to fetch');
    const networkCategory = registry.categorizeError(networkError, 'API_CALL');
    
    // Test validation error categorization
    const validationError = new Error('validation failed');
    const validationCategory = registry.categorizeError(validationError, 'USER_INPUT');
    
    // Test HIBP API error categorization
    const hibpError = new Error('HIBP service unavailable');
    const apiCategory = registry.categorizeError(hibpError, 'PASSWORD_CHECK');
    
    return networkCategory === ErrorCategory.NETWORK &&
           validationCategory === ErrorCategory.VALIDATION &&
           apiCategory === ErrorCategory.API;
  });

  // Test 6: Error handling with registered handlers
  runTest('Error handling with registered handlers', () => {
    const registry = new ErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.VALIDATION, 5);
    
    registry.registerHandler(ErrorCategory.VALIDATION, handler);
    
    const testError = new Error('Test validation error');
    const result = registry.handleError(testError, 'TEST_CONTEXT', ErrorCategory.VALIDATION);
    
    return result.handled === true &&
           result.mockHandled === true &&
           result.handlerUsed === 'MockErrorHandler-VALIDATION' &&
           result.performanceMetrics &&
           typeof result.performanceMetrics.handlingDuration === 'number';
  });

  // Test 7: Error handling without registered handlers (default behavior)
  runTest('Error handling without registered handlers', () => {
    const registry = new ErrorHandlerRegistry();
    
    const testError = new Error('Unhandled error type');
    const result = registry.handleError(testError, 'TEST_CONTEXT', ErrorCategory.SYSTEM);
    
    return result.handled === true &&
           result.handlerUsed === 'default' &&
           result.severity === ErrorSeverity.HIGH &&
           result.shouldFallback === true;
  });

  // Test 8: Handler selection based on canHandle method
  runTest('Handler selection based on canHandle method', () => {
    const registry = new ErrorHandlerRegistry();
    const cannotHandleHandler = new MockErrorHandler(ErrorCategory.NETWORK, 10, false);
    const canHandleHandler = new MockErrorHandler(ErrorCategory.NETWORK, 5, true);
    
    registry.registerHandler(ErrorCategory.NETWORK, cannotHandleHandler);
    registry.registerHandler(ErrorCategory.NETWORK, canHandleHandler);
    
    const testError = new Error('Network error');
    const result = registry.handleError(testError, 'TEST_CONTEXT', ErrorCategory.NETWORK);
    
    // Should use the handler that can handle the error, not the highest priority one
    return result.handlerUsed === 'MockErrorHandler-NETWORK' &&
           canHandleHandler.getHandleCalls().length === 1 &&
           cannotHandleHandler.getHandleCalls().length === 0;
  });

  // Test 9: Performance monitoring
  runTest('Performance monitoring', () => {
    const registry = new ErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.API, 5);
    
    registry.registerHandler(ErrorCategory.API, handler);
    
    // Handle multiple errors to generate metrics
    for (let i = 0; i < 3; i++) {
      const testError = new Error(`Test error ${i}`);
      registry.handleError(testError, 'PERFORMANCE_TEST', ErrorCategory.API);
    }
    
    const stats = registry.getStats();
    const metrics = stats.performanceMetrics[ErrorCategory.API];
    
    return metrics &&
           metrics.count === 3 &&
           typeof metrics.averageTime === 'number' &&
           typeof metrics.totalTime === 'number' &&
           metrics.minTime <= metrics.maxTime;
  });

  // Test 10: Error logging and statistics
  runTest('Error logging and statistics', () => {
    const registry = new ErrorHandlerRegistry();
    
    // Handle some errors
    registry.handleError(new Error('Error 1'), 'CONTEXT_1', ErrorCategory.NETWORK);
    registry.handleError(new Error('Error 2'), 'CONTEXT_2', ErrorCategory.VALIDATION);
    registry.handleError(new Error('Error 3'), 'CONTEXT_3', ErrorCategory.API);
    
    const stats = registry.getStats();
    
    return stats.globalErrorCount === 3 &&
           stats.recentErrors.length === 3 &&
           stats.recentErrors[0].context === 'CONTEXT_1' &&
           stats.recentErrors[2].context === 'CONTEXT_3';
  });

  // Test 11: Handler statistics
  runTest('Handler statistics', () => {
    const registry = new ErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.SECURITY, 8);
    
    registry.registerHandler(ErrorCategory.SECURITY, handler);
    
    // Handle some errors
    registry.handleError(new Error('Security error 1'), 'SEC_CONTEXT_1', ErrorCategory.SECURITY);
    registry.handleError(new Error('Security error 2'), 'SEC_CONTEXT_2', ErrorCategory.SECURITY);
    
    const handlerStats = handler.getStats();
    
    return handlerStats.category === ErrorCategory.SECURITY &&
           handlerStats.priority === 8 &&
           handlerStats.handledCount === 2 &&
           handlerStats.lastHandled !== null;
  });

  // Test 12: Clear handlers functionality
  runTest('Clear handlers functionality', () => {
    const registry = new ErrorHandlerRegistry();
    const handler1 = new MockErrorHandler(ErrorCategory.NETWORK, 5);
    const handler2 = new MockErrorHandler(ErrorCategory.VALIDATION, 3);
    
    registry.registerHandler(ErrorCategory.NETWORK, handler1);
    registry.registerHandler(ErrorCategory.VALIDATION, handler2);
    
    // Clear specific category
    registry.clearHandlers(ErrorCategory.NETWORK);
    
    const networkHandlers = registry.getHandlers(ErrorCategory.NETWORK);
    const validationHandlers = registry.getHandlers(ErrorCategory.VALIDATION);
    
    return networkHandlers.length === 0 && validationHandlers.length === 1;
  });

  // Test 13: Clear all handlers
  runTest('Clear all handlers', () => {
    const registry = new ErrorHandlerRegistry();
    const handler1 = new MockErrorHandler(ErrorCategory.NETWORK, 5);
    const handler2 = new MockErrorHandler(ErrorCategory.VALIDATION, 3);
    
    registry.registerHandler(ErrorCategory.NETWORK, handler1);
    registry.registerHandler(ErrorCategory.VALIDATION, handler2);
    
    // Clear all handlers
    registry.clearHandlers();
    
    const stats = registry.getStats();
    
    return stats.totalHandlers === 0 &&
           Object.keys(stats.handlersByCategory).length === 0;
  });

  // Test 14: Error handling failure recovery
  runTest('Error handling failure recovery', () => {
    const registry = new ErrorHandlerRegistry();
    
    // Create a handler that throws an error
    class FailingHandler extends BaseErrorHandler {
      handle(error, context) {
        throw new Error('Handler failed');
      }
    }
    
    const failingHandler = new FailingHandler(ErrorCategory.SYSTEM, 10);
    registry.registerHandler(ErrorCategory.SYSTEM, failingHandler);
    
    const testError = new Error('Test error');
    const result = registry.handleError(testError, 'FAILING_TEST', ErrorCategory.SYSTEM);
    
    return result.handled === false &&
           result.severity === ErrorSeverity.CRITICAL &&
           result.originalError === testError &&
           result.performanceMetrics &&
           result.performanceMetrics.category === 'ERROR_HANDLING_FAILURE';
  });

  // Test 15: Registry utility methods
  runTest('Registry utility methods', () => {
    const registry = new ErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.USER_INPUT, 7);
    
    registry.registerHandler(ErrorCategory.USER_INPUT, handler);
    
    const hasHandler = registry.hasHandler(ErrorCategory.USER_INPUT);
    const hasNoHandler = registry.hasHandler(ErrorCategory.SECURITY);
    const categories = registry.getRegisteredCategories();
    
    return hasHandler === true &&
           hasNoHandler === false &&
           categories.includes(ErrorCategory.USER_INPUT) &&
           categories.length === 1;
  });

  // Test 16: Singleton instance functionality
  runTest('Singleton instance functionality', () => {
    // Test that the exported singleton works
    const handler = new MockErrorHandler(ErrorCategory.NETWORK, 1);
    
    errorHandlerRegistry.registerHandler(ErrorCategory.NETWORK, handler);
    
    const testError = new Error('Singleton test error');
    const result = errorHandlerRegistry.handleError(testError, 'SINGLETON_TEST', ErrorCategory.NETWORK);
    
    // Clean up
    errorHandlerRegistry.clearHandlers(ErrorCategory.NETWORK);
    
    return result.handled === true &&
           result.mockHandled === true;
  });

  // Summary
  console.log(`\n📊 Error Handler Registry Test Results:`);
  console.log(`   Tests Passed: ${testsPassed}/${testsTotal}`);
  console.log(`   Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All Error Handler Registry tests passed!');
    return true;
  } else {
    console.error('❌ Some Error Handler Registry tests failed!');
    return false;
  }
};

/**
 * Test suite for Password Validation Error Handler integration
 */
export const testPasswordValidationErrorHandlerIntegration = () => {
  console.log('\n🧪 Testing Password Validation Error Handler Integration...');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  const runTest = (testName, testFn) => {
    testsTotal++;
    try {
      console.log(`  Testing: ${testName}`);
      const result = testFn();
      if (result) {
        testsPassed++;
        console.log(`  ✅ ${testName} - PASSED`);
      } else {
        console.error(`  ❌ ${testName} - FAILED`);
      }
    } catch (error) {
      console.error(`  ❌ ${testName} - ERROR:`, error.message);
    }
  };

  // Test 1: Registry has password validation handlers registered
  runTest('Registry has password validation handlers registered', () => {
    const hasValidationHandler = errorHandlerRegistry.hasHandler(ErrorCategory.VALIDATION);
    const hasAPIHandler = errorHandlerRegistry.hasHandler(ErrorCategory.API);
    const hasNetworkHandler = errorHandlerRegistry.hasHandler(ErrorCategory.NETWORK);
    
    return hasValidationHandler && hasAPIHandler && hasNetworkHandler;
  });

  // Test 2: HIBP error handling through registry
  runTest('HIBP error handling through registry', () => {
    const hibpError = new Error('HIBP service unavailable');
    const result = errorHandlerRegistry.handleError(hibpError, 'HIBP_PASSWORD_CHECK', ErrorCategory.API);
    
    return result.handled === true &&
           result.shouldFallback === true &&
           result.category === ErrorCategory.VALIDATION &&
           result.userMessage.includes('unavailable');
  });

  // Test 3: Network timeout error handling
  runTest('Network timeout error handling', () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'AbortError';
    
    const result = errorHandlerRegistry.handleError(timeoutError, 'PASSWORD_NETWORK_CHECK', ErrorCategory.NETWORK);
    
    return result.handled === true &&
           result.canRetry !== undefined &&
           result.userMessage.includes('timeout');
  });

  // Test 4: Validation error handling
  runTest('Validation error handling', () => {
    const validationError = new Error('Password validation failed');
    validationError.name = 'ValidationError';
    
    const result = errorHandlerRegistry.handleError(validationError, 'PASSWORD_VALIDATION', ErrorCategory.VALIDATION);
    
    return result.handled === true &&
           result.isValidationError === true &&
           result.severity === ErrorSeverity.LOW;
  });

  // Test 5: Performance metrics collection
  runTest('Performance metrics collection', () => {
    // Generate some errors to collect metrics
    for (let i = 0; i < 5; i++) {
      const error = new Error(`Test error ${i}`);
      errorHandlerRegistry.handleError(error, 'PERFORMANCE_TEST', ErrorCategory.VALIDATION);
    }
    
    const stats = errorHandlerRegistry.getStats();
    const validationMetrics = stats.performanceMetrics[ErrorCategory.VALIDATION];
    
    return validationMetrics &&
           validationMetrics.count >= 5 &&
           typeof validationMetrics.averageTime === 'number';
  });

  // Summary
  console.log(`\n📊 Password Validation Integration Test Results:`);
  console.log(`   Tests Passed: ${testsPassed}/${testsTotal}`);
  console.log(`   Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All Password Validation Integration tests passed!');
    return true;
  } else {
    console.error('❌ Some Password Validation Integration tests failed!');
    return false;
  }
};

/**
 * Run all Error Handler Registry tests
 */
export const runAllErrorHandlerRegistryTests = () => {
  console.log('🚀 Running all Error Handler Registry tests...\n');
  
  const registryTestsResult = testErrorHandlerRegistry();
  const integrationTestsResult = testPasswordValidationErrorHandlerIntegration();
  
  const allTestsPassed = registryTestsResult && integrationTestsResult;
  
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL ERROR HANDLER REGISTRY TESTS PASSED! 🎉');
  } else {
    console.error('❌ SOME ERROR HANDLER REGISTRY TESTS FAILED! ❌');
  }
  console.log('='.repeat(60));
  
  return allTestsPassed;
};

export default runAllErrorHandlerRegistryTests;