/**
 * Unit Tests for Feature Flag Manager
 * Tests flag retrieval, caching, fallback behavior, and TTL management
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { FeatureFlag, FeatureFlagManager, featureFlagManager } from '../services/FeatureFlagManager.js';

/**
 * Mock fetch for testing network requests
 */
class MockFetch {
  constructor() {
    this.responses = new Map();
    this.callLog = [];
    this.shouldFail = false;
    this.failureType = 'network';
    this.delay = 0;
  }

  /**
   * Set mock response for a URL
   * @param {string} url - URL to mock
   * @param {Object} response - Mock response data
   * @param {number} status - HTTP status code
   */
  setResponse(url, response, status = 200) {
    this.responses.set(url, { response, status });
  }

  /**
   * Set failure mode for testing error scenarios
   * @param {boolean} shouldFail - Whether requests should fail
   * @param {string} failureType - Type of failure ('network', 'timeout', 'server')
   */
  setFailure(shouldFail, failureType = 'network') {
    this.shouldFail = shouldFail;
    this.failureType = failureType;
  }

  /**
   * Set artificial delay for testing timeout scenarios
   * @param {number} delay - Delay in milliseconds
   */
  setDelay(delay) {
    this.delay = delay;
  }

  /**
   * Mock fetch implementation
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} Mock response
   */
  async fetch(url, options = {}) {
    this.callLog.push({ url, options, timestamp: new Date().toISOString() });

    // Handle AbortController signal
    if (options.signal && options.signal.aborted) {
      throw new Error('Request timeout');
    }

    // Simulate delay
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
      
      // Check if request was aborted during delay
      if (options.signal && options.signal.aborted) {
        throw new Error('Request timeout');
      }
    }

    // Simulate failures
    if (this.shouldFail) {
      switch (this.failureType) {
        case 'timeout':
          throw new Error('Request timeout');
        case 'server':
          throw new Error('HTTP 503: Service Unavailable');
        case 'rate-limit':
          throw new Error('HTTP 429: Too Many Requests');
        default:
          throw new Error('Failed to fetch');
      }
    }

    // Return mock response
    const mockResponse = this.responses.get(url);
    if (mockResponse) {
      return {
        ok: mockResponse.status >= 200 && mockResponse.status < 300,
        status: mockResponse.status,
        statusText: mockResponse.status === 200 ? 'OK' : 'Error',
        json: async () => mockResponse.response
      };
    }

    // Default 404 response
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' })
    };
  }

  /**
   * Get call log for verification
   * @returns {Array} Array of fetch calls
   */
  getCallLog() {
    return this.callLog;
  }

  /**
   * Clear call log
   */
  clearCallLog() {
    this.callLog = [];
  }

  /**
   * Reset mock to initial state
   */
  reset() {
    this.responses.clear();
    this.callLog = [];
    this.shouldFail = false;
    this.failureType = 'network';
    this.delay = 0;
  }
}

/**
 * Test suite for Feature Flag Manager
 */
export const testFeatureFlagManager = () => {
  console.log('🧪 Testing Feature Flag Manager...');
  
  let testsPassed = 0;
  let testsTotal = 0;
  const mockFetch = new MockFetch();
  
  // Store original fetch
  const originalFetch = global.fetch;
  
  const runTest = (testName, testFn) => {
    testsTotal++;
    try {
      console.log(`  Testing: ${testName}`);
      
      // Setup mock fetch
      global.fetch = mockFetch.fetch.bind(mockFetch);
      mockFetch.reset();
      
      const result = testFn();
      if (result instanceof Promise) {
        return result.then(success => {
          if (success) {
            testsPassed++;
            console.log(`  ✅ ${testName} - PASSED`);
          } else {
            console.error(`  ❌ ${testName} - FAILED`);
          }
        }).catch(error => {
          console.error(`  ❌ ${testName} - ERROR:`, error.message);
        });
      } else {
        if (result) {
          testsPassed++;
          console.log(`  ✅ ${testName} - PASSED`);
        } else {
          console.error(`  ❌ ${testName} - FAILED`);
        }
      }
    } catch (error) {
      console.error(`  ❌ ${testName} - ERROR:`, error.message);
    }
  };

  // Test 1: FeatureFlag class instantiation
  runTest('FeatureFlag class instantiation', () => {
    const flag = new FeatureFlag('test-flag', true, false, 'remote');
    
    return flag.name === 'test-flag' &&
           flag.enabled === true &&
           flag.defaultValue === false &&
           flag.source === 'remote' &&
           flag.lastUpdated instanceof Date;
  });

  // Test 2: FeatureFlag from API response
  runTest('FeatureFlag from API response', () => {
    const apiData = {
      name: 'api-flag',
      enabled: true,
      defaultValue: false
    };
    
    const flag = FeatureFlag.fromApiResponse(apiData);
    
    return flag.name === 'api-flag' &&
           flag.enabled === true &&
           flag.source === 'remote';
  });

  // Test 3: FeatureFlag cache operations
  runTest('FeatureFlag cache operations', () => {
    const flag = new FeatureFlag('cache-flag', true, false, 'remote');
    const cacheData = flag.toCacheData();
    const restoredFlag = FeatureFlag.fromCache(cacheData);
    
    return restoredFlag.name === flag.name &&
           restoredFlag.enabled === flag.enabled &&
           restoredFlag.source === 'cache';
  });

  // Test 4: FeatureFlag TTL expiration
  runTest('FeatureFlag TTL expiration', () => {
    const flag = new FeatureFlag('ttl-flag', true, false, 'cache');
    
    // Flag should not be expired immediately
    const notExpired = !flag.isExpired(5000);
    
    // Simulate old flag
    flag.lastUpdated = new Date(Date.now() - 10000); // 10 seconds ago
    const expired = flag.isExpired(5000); // 5 second TTL
    
    return notExpired && expired;
  });

  // Test 5: FeatureFlagManager instantiation
  runTest('FeatureFlagManager instantiation', () => {
    const manager = new FeatureFlagManager({
      apiEndpoint: '/test/flags',
      cacheTtlMs: 10000,
      requestTimeout: 3000
    });
    
    return manager.apiEndpoint === '/test/flags' &&
           manager.requestTimeout === 3000 &&
           manager.cache &&
           manager.defaultFlags instanceof Map;
  });

  // Test 6: Set default flags (Requirement 3.1)
  runTest('Set default flags', () => {
    const manager = new FeatureFlagManager();
    const defaults = {
      'feature-a': true,
      'feature-b': false,
      'feature-c': true
    };
    
    manager.setDefaultFlags(defaults);
    
    return manager.defaultFlags.size === 3 &&
           manager.defaultFlags.get('feature-a').enabled === true &&
           manager.defaultFlags.get('feature-b').enabled === false;
  });

  // Test 7: Get flag from service (successful)
  const test7Promise = runTest('Get flag from service (successful)', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Mock successful API response
    mockFetch.setResponse('/api/flags/test-flag', {
      enabled: true,
      defaultValue: false
    });
    
    const result = await manager.getFlag('test-flag');
    const callLog = mockFetch.getCallLog();
    
    return result === true &&
           callLog.length === 1 &&
           callLog[0].url === '/api/flags/test-flag';
  });

  // Test 8: Get flag with service failure and fallback (Requirement 3.2)
  runTest('Get flag with service failure and fallback', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Set default value
    manager.setDefaultFlags({ 'fallback-flag': true });
    
    // Mock service failure
    mockFetch.setFailure(true, 'network');
    
    const result = await manager.getFlag('fallback-flag');
    const stats = manager.getStats();
    
    return result === true &&
           stats.fallbackCount > 0 &&
           stats.errorCount > 0;
  });

  // Test 9: Flag caching behavior (Requirement 3.3)
  const test9Promise = runTest('Flag caching behavior', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Mock API response
    mockFetch.setResponse('/api/flags/cached-flag', {
      enabled: true,
      defaultValue: false
    });
    
    // First call should hit API
    const result1 = await manager.getFlag('cached-flag');
    const callsAfterFirst = mockFetch.getCallLog().length;
    
    // Second call should use cache
    const result2 = await manager.getFlag('cached-flag');
    const callsAfterSecond = mockFetch.getCallLog().length;
    
    return result1 === true &&
           result2 === true &&
           callsAfterFirst === 1 &&
           callsAfterSecond === 1; // No additional API call
  });

  // Test 10: Cache TTL expiration
  const test10Promise = runTest('Cache TTL expiration', async () => {
    const manager = new FeatureFlagManager({ 
      apiEndpoint: '/api/flags',
      cacheTtlMs: 100 // Very short TTL for testing
    });
    
    // Mock API response
    mockFetch.setResponse('/api/flags/ttl-flag', {
      enabled: true,
      defaultValue: false
    });
    
    // First call
    await manager.getFlag('ttl-flag');
    const callsAfterFirst = mockFetch.getCallLog().length;
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Second call should hit API again due to TTL expiration
    await manager.getFlag('ttl-flag');
    const callsAfterSecond = mockFetch.getCallLog().length;
    
    return callsAfterFirst === 1 && callsAfterSecond === 2;
  });

  // Test 11: Get all flags from service
  runTest('Get all flags from service', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Mock API response for all flags
    mockFetch.setResponse('/api/flags', {
      flags: [
        { name: 'flag-1', enabled: true, defaultValue: false },
        { name: 'flag-2', enabled: false, defaultValue: true },
        { name: 'flag-3', enabled: true, defaultValue: true }
      ]
    });
    
    const result = await manager.getAllFlags();
    
    return typeof result === 'object' &&
           result['flag-1'] === true &&
           result['flag-2'] === false &&
           result['flag-3'] === true &&
           Object.keys(result).length === 3;
  });

  // Test 12: Get all flags with fallback
  runTest('Get all flags with fallback', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Set default flags
    manager.setDefaultFlags({
      'default-flag-1': true,
      'default-flag-2': false
    });
    
    // Mock service failure
    mockFetch.setFailure(true, 'server');
    
    const result = await manager.getAllFlags();
    
    return typeof result === 'object' &&
           result['default-flag-1'] === true &&
           result['default-flag-2'] === false;
  });

  // Test 13: Service health tracking
  const test13Promise = runTest('Service health tracking', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Initially healthy
    const initialHealth = manager.getStats().serviceHealthy;
    
    // Mock service failure
    mockFetch.setFailure(true, 'timeout');
    
    await manager.getFlag('health-test');
    const healthAfterFailure = manager.getStats().serviceHealthy;
    
    // Mock service recovery
    mockFetch.setFailure(false);
    mockFetch.setResponse('/api/flags/health-test', { enabled: true });
    
    await manager.getFlag('health-test');
    const healthAfterRecovery = manager.getStats().serviceHealthy;
    
    return initialHealth === true &&
           healthAfterFailure === false &&
           healthAfterRecovery === true;
  });

  // Test 14: Request timeout handling
  runTest('Request timeout handling', async () => {
    const manager = new FeatureFlagManager({ 
      apiEndpoint: '/api/flags',
      requestTimeout: 100 // Very short timeout
    });
    
    // Set default for fallback
    manager.setDefaultFlags({ 'timeout-flag': false });
    
    // Mock slow response
    mockFetch.setDelay(200); // Longer than timeout
    mockFetch.setResponse('/api/flags/timeout-flag', { enabled: true });
    
    const result = await manager.getFlag('timeout-flag');
    const stats = manager.getStats();
    
    return result === false && // Should use default
           stats.errorCount > 0;
  });

  // Test 15: Refresh flags functionality
  const test15Promise = runTest('Refresh flags functionality', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Mock initial response for single flag
    mockFetch.setResponse('/api/flags/refresh-flag', {
      enabled: false,
      defaultValue: false
    });
    
    // Mock initial response for all flags
    mockFetch.setResponse('/api/flags', {
      flags: [
        { name: 'refresh-flag', enabled: false, defaultValue: false }
      ]
    });
    
    // Get flag to populate cache
    await manager.getFlag('refresh-flag');
    const initialResult = await manager.getFlag('refresh-flag'); // From cache
    
    // Update mock response for all flags
    mockFetch.setResponse('/api/flags', {
      flags: [
        { name: 'refresh-flag', enabled: true, defaultValue: false }
      ]
    });
    
    // Refresh flags
    const refreshSuccess = await manager.refreshFlags();
    const refreshedResult = await manager.getFlag('refresh-flag');
    
    return initialResult === false &&
           refreshSuccess === true &&
           refreshedResult === true;
  });

  // Test 16: Cache statistics
  runTest('Cache statistics', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Mock response
    mockFetch.setResponse('/api/flags/stats-flag', { enabled: true });
    
    // Generate cache hits and misses
    await manager.getFlag('stats-flag'); // Miss (API call)
    await manager.getFlag('stats-flag'); // Hit (cache)
    await manager.getFlag('stats-flag'); // Hit (cache)
    await manager.getFlag('nonexistent-flag'); // Miss (fallback)
    
    const stats = manager.getStats();
    const cacheStats = stats.cache;
    
    return cacheStats.hitCount >= 2 &&
           cacheStats.missCount >= 2 &&
           cacheStats.totalRequests >= 4 &&
           typeof cacheStats.hitRate === 'number';
  });

  // Test 17: Manager utility methods
  runTest('Manager utility methods', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Set up test data
    manager.setDefaultFlags({ 'util-flag': true });
    mockFetch.setResponse('/api/flags/cached-util-flag', { enabled: false });
    await manager.getFlag('cached-util-flag'); // Cache it
    
    const hasDefaultFlag = manager.hasFlag('util-flag');
    const hasCachedFlag = manager.hasFlag('cached-util-flag');
    const hasNonexistentFlag = manager.hasFlag('nonexistent');
    
    const defaultSource = manager.getFlagSource('util-flag');
    const cachedSource = manager.getFlagSource('cached-util-flag');
    const nonexistentSource = manager.getFlagSource('nonexistent');
    
    return hasDefaultFlag === true &&
           hasCachedFlag === true &&
           hasNonexistentFlag === false &&
           defaultSource === 'default' &&
           cachedSource === 'cache' &&
           nonexistentSource === null;
  });

  // Test 18: Error categorization and handling
  const test18Promise = runTest('Error categorization and handling', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Set fallback
    manager.setDefaultFlags({ 'error-flag': true });
    
    // Test different error types
    mockFetch.setFailure(true, 'rate-limit');
    const rateLimitResult = await manager.getFlag('error-flag');
    
    mockFetch.setFailure(true, 'server');
    const serverErrorResult = await manager.getFlag('error-flag');
    
    mockFetch.setFailure(true, 'network');
    const networkErrorResult = await manager.getFlag('error-flag');
    
    const stats = manager.getStats();
    
    return rateLimitResult === true &&
           serverErrorResult === true &&
           networkErrorResult === true &&
           stats.errorCount >= 3 &&
           stats.fallbackCount >= 3;
  });

  // Test 19: Core functionality remains available (Requirement 3.4)
  runTest('Core functionality remains available', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Set critical default flags
    manager.setDefaultFlags({
      'core-feature-1': true,
      'core-feature-2': false,
      'optional-feature': true
    });
    
    // Simulate complete service outage
    mockFetch.setFailure(true, 'network');
    
    // All flags should still be accessible via defaults
    const coreFeature1 = await manager.getFlag('core-feature-1');
    const coreFeature2 = await manager.getFlag('core-feature-2');
    const optionalFeature = await manager.getFlag('optional-feature');
    const allFlags = await manager.getAllFlags();
    
    return coreFeature1 === true &&
           coreFeature2 === false &&
           optionalFeature === true &&
           Object.keys(allFlags).length === 3 &&
           allFlags['core-feature-1'] === true;
  });

  // Test 20: Singleton instance functionality
  runTest('Singleton instance functionality', async () => {
    // Test that the exported singleton works
    featureFlagManager.setDefaultFlags({ 'singleton-flag': true });
    
    mockFetch.setResponse('/api/feature-flags/singleton-flag', { enabled: false });
    
    const result = await featureFlagManager.getFlag('singleton-flag');
    
    // Clean up
    featureFlagManager.resetStats();
    
    return result === false; // Should get from API, not default
  });

  // Restore original fetch
  const cleanup = () => {
    global.fetch = originalFetch;
  };

  // Run all tests
  const runAllTests = async () => {
    // Wait for all async tests to complete
    const asyncTests = [test7Promise, test9Promise, test10Promise, test13Promise, test15Promise, test18Promise];
    await Promise.all(asyncTests.filter(test => test instanceof Promise));
    
    // Wait a bit more for any remaining async operations
    await new Promise(resolve => setTimeout(resolve, 200));
    
    cleanup();
    
    // Summary
    console.log(`\n📊 Feature Flag Manager Test Results:`);
    console.log(`   Tests Passed: ${testsPassed}/${testsTotal}`);
    console.log(`   Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
      console.log('🎉 All Feature Flag Manager tests passed!');
      return true;
    } else {
      console.error('❌ Some Feature Flag Manager tests failed!');
      return false;
    }
  };

  return runAllTests();
};

/**
 * Test suite for Feature Flag Manager integration with Error Handler Registry
 */
export const testFeatureFlagManagerIntegration = () => {
  console.log('\n🧪 Testing Feature Flag Manager Integration...');
  
  let testsPassed = 0;
  let testsTotal = 0;
  const mockFetch = new MockFetch();
  const originalFetch = global.fetch;
  
  const runTest = (testName, testFn) => {
    testsTotal++;
    try {
      console.log(`  Testing: ${testName}`);
      
      global.fetch = mockFetch.fetch.bind(mockFetch);
      mockFetch.reset();
      
      const result = testFn();
      if (result instanceof Promise) {
        return result.then(success => {
          if (success) {
            testsPassed++;
            console.log(`  ✅ ${testName} - PASSED`);
          } else {
            console.error(`  ❌ ${testName} - FAILED`);
          }
        }).catch(error => {
          console.error(`  ❌ ${testName} - ERROR:`, error.message);
        });
      } else {
        if (result) {
          testsPassed++;
          console.log(`  ✅ ${testName} - PASSED`);
        } else {
          console.error(`  ❌ ${testName} - FAILED`);
        }
      }
    } catch (error) {
      console.error(`  ❌ ${testName} - ERROR:`, error.message);
    }
  };

  // Test 1: Error handler registry integration
  runTest('Error handler registry integration', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    // Mock service failure
    mockFetch.setFailure(true, 'server');
    manager.setDefaultFlags({ 'integration-flag': true });
    
    const result = await manager.getFlag('integration-flag');
    
    // Should handle error gracefully and use fallback
    return result === true;
  });

  // Test 2: Performance monitoring integration
  runTest('Performance monitoring integration', async () => {
    const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
    
    mockFetch.setResponse('/api/flags/perf-flag', { enabled: true });
    
    await manager.getFlag('perf-flag');
    const stats = manager.getStats();
    
    return stats.requestCount > 0 &&
           typeof stats.errorRate === 'number' &&
           typeof stats.fallbackRate === 'number';
  });

  const runAllIntegrationTests = async () => {
    const testPromises = [];
    
    testPromises.push(runTest('Error handler registry integration', async () => {
      const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
      mockFetch.setFailure(true, 'server');
      manager.setDefaultFlags({ 'integration-flag': true });
      const result = await manager.getFlag('integration-flag');
      return result === true;
    }));

    testPromises.push(runTest('Performance monitoring integration', async () => {
      const manager = new FeatureFlagManager({ apiEndpoint: '/api/flags' });
      mockFetch.setResponse('/api/flags/perf-flag', { enabled: true });
      await manager.getFlag('perf-flag');
      const stats = manager.getStats();
      return stats.requestCount > 0 && typeof stats.errorRate === 'number';
    }));
    
    await Promise.all(testPromises);
    
    global.fetch = originalFetch;
    
    console.log(`\n📊 Feature Flag Manager Integration Test Results:`);
    console.log(`   Tests Passed: ${testsPassed}/${testsTotal}`);
    console.log(`   Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
      console.log('🎉 All Feature Flag Manager Integration tests passed!');
      return true;
    } else {
      console.error('❌ Some Feature Flag Manager Integration tests failed!');
      return false;
    }
  };

  return runAllIntegrationTests();
};

/**
 * Run all Feature Flag Manager tests
 */
export const runAllFeatureFlagManagerTests = async () => {
  console.log('🚀 Running all Feature Flag Manager tests...\n');
  
  const managerTestsResult = await testFeatureFlagManager();
  const integrationTestsResult = await testFeatureFlagManagerIntegration();
  
  const allTestsPassed = managerTestsResult && integrationTestsResult;
  
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL FEATURE FLAG MANAGER TESTS PASSED! 🎉');
  } else {
    console.error('❌ SOME FEATURE FLAG MANAGER TESTS FAILED! ❌');
  }
  console.log('='.repeat(60));
  
  return allTestsPassed;
};

export default runAllFeatureFlagManagerTests;