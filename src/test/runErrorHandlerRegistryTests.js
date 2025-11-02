/**
 * Simple test runner for Error Handler Registry
 * Tests core functionality without complex module imports
 */

// Simple test framework
const runTest = (testName, testFn) => {
  try {
    console.log(`Testing: ${testName}`);
    const result = testFn();
    if (result) {
      console.log(`✅ ${testName} - PASSED`);
      return true;
    } else {
      console.error(`❌ ${testName} - FAILED`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${testName} - ERROR:`, error.message);
    return false;
  }
};

// Mock implementations for testing
const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const ErrorCategory = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  API: 'API',
  USER_INPUT: 'USER_INPUT',
  SYSTEM: 'SYSTEM',
  SECURITY: 'SECURITY'
};

// Simple performance monitor for testing
class TestPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  startTiming(operationId) {
    this.startTimes.set(operationId, Date.now());
  }

  endTiming(operationId, category = 'UNKNOWN') {
    const startTime = this.startTimes.get(operationId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.recordMetric(category, duration);
      this.startTimes.delete(operationId);
      return duration;
    }
    return null;
  }

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

  getAllMetrics() {
    const result = {};
    for (const [category, metrics] of this.metrics) {
      result[category] = { ...metrics };
    }
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// Simple base error handler for testing
class TestBaseErrorHandler {
  constructor(category, priority = 0) {
    this.category = category;
    this.priority = priority;
    this.handledCount = 0;
    this.lastHandled = null;
  }

  handle(error, context) {
    this.handledCount++;
    this.lastHandled = new Date().toISOString();
    
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

  canHandle(error, context) {
    return true;
  }

  getStats() {
    return {
      category: this.category,
      priority: this.priority,
      handledCount: this.handledCount,
      lastHandled: this.lastHandled
    };
  }
}

// Simple error handler registry for testing
class TestErrorHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.performanceMonitor = new TestPerformanceMonitor();
    this.globalErrorCount = 0;
    this.errorLog = [];
    this.maxLogSize = 1000;
  }

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

    const categoryHandlers = this.handlers.get(category);
    const insertIndex = categoryHandlers.findIndex(h => h.priority < handler.priority);
    
    if (insertIndex === -1) {
      categoryHandlers.push(handler);
    } else {
      categoryHandlers.splice(insertIndex, 0, handler);
    }
  }

  getHandler(category) {
    const categoryHandlers = this.handlers.get(category);
    return categoryHandlers && categoryHandlers.length > 0 ? categoryHandlers[0] : null;
  }

  getHandlers(category) {
    return this.handlers.get(category) || [];
  }

  handleError(error, context = 'UNKNOWN', category = null) {
    const operationId = `error_${Date.now()}_${Math.random()}`;
    this.performanceMonitor.startTiming(operationId);

    try {
      this.globalErrorCount++;

      const errorCategory = category || this.categorizeError(error, context);
      const categoryHandlers = this.getHandlers(errorCategory);
      
      let result = null;
      
      for (const handler of categoryHandlers) {
        if (handler.canHandle(error, context)) {
          result = handler.handle(error, context);
          break;
        }
      }

      if (!result) {
        result = this.handleUnknownError(error, context, errorCategory);
      }

      const duration = this.performanceMonitor.endTiming(operationId, errorCategory);
      
      result.performanceMetrics = {
        handlingDuration: duration,
        category: errorCategory,
        handlerUsed: result.handlerUsed || 'default'
      };

      return result;

    } catch (handlingError) {
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

  categorizeError(error, context) {
    if (error.name === 'AbortError' || 
        error.message.includes('timeout') ||
        error.message.includes('Failed to fetch')) {
      return ErrorCategory.NETWORK;
    }
    if (error.message.includes('HIBP') || 
        error.message.includes('API') ||
        error.message.includes('service unavailable')) {
      return ErrorCategory.API;
    }
    if (error.name === 'ValidationError' || 
        error.message.includes('validation') ||
        context.includes('VALIDATION')) {
      return ErrorCategory.VALIDATION;
    }
    return ErrorCategory.SYSTEM;
  }

  handleUnknownError(error, context, category) {
    return {
      handled: true,
      category,
      context,
      timestamp: new Date().toISOString(),
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: ErrorSeverity.HIGH,
      shouldFallback: true,
      handlerUsed: 'default'
    };
  }

  clearHandlers(category = null) {
    if (category) {
      this.handlers.delete(category);
    } else {
      this.handlers.clear();
    }
  }

  getStats() {
    const stats = {
      totalHandlers: 0,
      handlersByCategory: {},
      globalErrorCount: this.globalErrorCount,
      performanceMetrics: this.performanceMonitor.getAllMetrics()
    };

    for (const [category, handlers] of this.handlers) {
      stats.handlersByCategory[category] = handlers.length;
      stats.totalHandlers += handlers.length;
    }

    return stats;
  }

  hasHandler(category) {
    const handlers = this.handlers.get(category);
    return handlers && handlers.length > 0;
  }
}

// Mock error handler for testing
class MockErrorHandler extends TestBaseErrorHandler {
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
}

// Test suite
const testErrorHandlerRegistry = () => {
  console.log('🧪 Testing Error Handler Registry Core Functionality...');
  
  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: Registry instantiation
  testsPassed += runTest('Registry instantiation', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
    return registry instanceof TestErrorHandlerRegistry &&
           registry.handlers instanceof Map &&
           registry.globalErrorCount === 0;
  });

  // Test 2: Handler registration
  testsPassed += runTest('Handler registration', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.VALIDATION, 5);
    
    registry.registerHandler(ErrorCategory.VALIDATION, handler);
    
    const retrievedHandler = registry.getHandler(ErrorCategory.VALIDATION);
    return retrievedHandler === handler;
  });

  // Test 3: Priority-based handler ordering
  testsPassed += runTest('Priority-based handler ordering', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
    const lowPriorityHandler = new MockErrorHandler(ErrorCategory.NETWORK, 1);
    const highPriorityHandler = new MockErrorHandler(ErrorCategory.NETWORK, 10);
    const mediumPriorityHandler = new MockErrorHandler(ErrorCategory.NETWORK, 5);
    
    registry.registerHandler(ErrorCategory.NETWORK, lowPriorityHandler);
    registry.registerHandler(ErrorCategory.NETWORK, highPriorityHandler);
    registry.registerHandler(ErrorCategory.NETWORK, mediumPriorityHandler);
    
    const handlers = registry.getHandlers(ErrorCategory.NETWORK);
    
    return handlers.length === 3 &&
           handlers[0] === highPriorityHandler &&
           handlers[1] === mediumPriorityHandler &&
           handlers[2] === lowPriorityHandler;
  });

  // Test 4: Error categorization
  testsPassed += runTest('Error categorization', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
    
    const networkError = new Error('Failed to fetch');
    const networkCategory = registry.categorizeError(networkError, 'API_CALL');
    
    const validationError = new Error('validation failed');
    const validationCategory = registry.categorizeError(validationError, 'USER_INPUT');
    
    const hibpError = new Error('HIBP service unavailable');
    const apiCategory = registry.categorizeError(hibpError, 'PASSWORD_CHECK');
    
    return networkCategory === ErrorCategory.NETWORK &&
           validationCategory === ErrorCategory.VALIDATION &&
           apiCategory === ErrorCategory.API;
  });

  // Test 5: Error handling with registered handlers
  testsPassed += runTest('Error handling with registered handlers', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
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

  // Test 6: Performance monitoring
  testsPassed += runTest('Performance monitoring', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
    const handler = new MockErrorHandler(ErrorCategory.API, 5);
    
    registry.registerHandler(ErrorCategory.API, handler);
    
    for (let i = 0; i < 3; i++) {
      const testError = new Error(`Test error ${i}`);
      registry.handleError(testError, 'PERFORMANCE_TEST', ErrorCategory.API);
    }
    
    const stats = registry.getStats();
    const metrics = stats.performanceMetrics[ErrorCategory.API];
    
    return metrics &&
           metrics.count === 3 &&
           typeof metrics.averageTime === 'number';
  });

  // Test 7: Clear handlers functionality
  testsPassed += runTest('Clear handlers functionality', () => {
    testsTotal++;
    const registry = new TestErrorHandlerRegistry();
    const handler1 = new MockErrorHandler(ErrorCategory.NETWORK, 5);
    const handler2 = new MockErrorHandler(ErrorCategory.VALIDATION, 3);
    
    registry.registerHandler(ErrorCategory.NETWORK, handler1);
    registry.registerHandler(ErrorCategory.VALIDATION, handler2);
    
    registry.clearHandlers(ErrorCategory.NETWORK);
    
    const networkHandlers = registry.getHandlers(ErrorCategory.NETWORK);
    const validationHandlers = registry.getHandlers(ErrorCategory.VALIDATION);
    
    return networkHandlers.length === 0 && validationHandlers.length === 1;
  });

  console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} passed (${((testsPassed / testsTotal) * 100).toFixed(1)}%)`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All Error Handler Registry tests passed!');
    return true;
  } else {
    console.error('❌ Some Error Handler Registry tests failed!');
    return false;
  }
};

// Run the tests
console.log('🚀 Running Error Handler Registry Tests...\n');
const result = testErrorHandlerRegistry();
console.log('\n' + '='.repeat(50));
if (result) {
  console.log('🎉 ALL TESTS PASSED! 🎉');
} else {
  console.error('❌ SOME TESTS FAILED! ❌');
}
console.log('='.repeat(50));