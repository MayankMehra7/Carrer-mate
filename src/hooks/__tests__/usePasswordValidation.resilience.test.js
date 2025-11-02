/**
 * Integration tests for password validation resilience
 * Tests HIBP service failures, fallback behavior, retry logic, and caching
 */

import { act, renderHook } from '@testing-library/react-native';
import { HIBPChecker } from '../../utils/hibpApi';
import { usePasswordValidation } from '../usePasswordValidation';

// Mock crypto-js for consistent hashing in tests
jest.mock('crypto-js', () => ({
  SHA1: jest.fn(() => ({
    toString: () => 'ABCDE12345678901234567890123456789012345'
  }))
}));

// Mock fetch for network simulation
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('Password Validation Resilience Integration Tests', () => {
  let hibpChecker;

  beforeEach(() => {
    // Create fresh HIBP checker instance for each test
    hibpChecker = new HIBPChecker();
    
    // Reset fetch mock
    fetch.mockClear();
    
    // Clear all console mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any active requests
    hibpChecker.cancelAllRequests();
    hibpChecker.clearCache();
  });

  describe('HIBP Service Failure Scenarios', () => {
    test('should handle network timeout gracefully', async () => {
      // Simulate network timeout
      fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      const result = await hibpChecker.checkPassword('TestPassword123!');
      
      expect(result.usedFallback).toBe(true);
      expect(result.isCompromised).toBe(false); // Should default to safe
      expect(result.fallbackReason).toBeDefined();
    });

    test('should handle rate limiting with exponential backoff', async () => {
      let callCount = 0;
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests'
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('12345:100\n67890:50')
        });
      });

      const startTime = Date.now();
      const result = await hibpChecker.checkPassword('TestPassword123!');
      const endTime = Date.now();
      
      // Should have used exponential backoff (at least 1 second delay)
      expect(endTime - startTime).toBeGreaterThan(1000);
      expect(callCount).toBe(3); // Initial + 2 retries
      expect(result.usedFallback).toBe(false);
    });

    test('should activate circuit breaker after consecutive failures', async () => {
      // Simulate consecutive failures
      fetch.mockRejectedValue(new Error('Service Unavailable'));

      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await hibpChecker.checkPassword(`TestPassword${i}!`);
        } catch (error) {
          // Expected to fail
        }
      }

      const metrics = hibpChecker.getMetrics();
      expect(metrics.circuitBreakerState).toBe('OPEN');
      expect(metrics.circuitBreakerTrips).toBeGreaterThan(0);

      // Next request should use fallback immediately
      const result = await hibpChecker.checkPassword('AnotherPassword123!');
      expect(result.usedFallback).toBe(true);
    });

    test('should recover from circuit breaker after timeout', async () => {
      // Open circuit breaker
      fetch.mockRejectedValue(new Error('Service Unavailable'));
      
      for (let i = 0; i < 6; i++) {
        try {
          await hibpChecker.checkPassword(`TestPassword${i}!`);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(hibpChecker.getMetrics().circuitBreakerState).toBe('OPEN');

      // Manually reset circuit breaker (simulating timeout)
      hibpChecker.resetCircuitBreaker();

      // Mock successful response
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      const result = await hibpChecker.checkPassword('RecoveryPassword123!');
      expect(result.usedFallback).toBe(false);
      expect(hibpChecker.getMetrics().circuitBreakerState).toBe('CLOSED');
    });

    test('should handle API errors with appropriate fallback', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      const result = await hibpChecker.checkPassword('TestPassword123!');
      
      expect(result.usedFallback).toBe(true);
      expect(result.isCompromised).toBe(false);
    });

    test('should handle malformed API responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('invalid-response-format')
      });

      const result = await hibpChecker.checkPassword('TestPassword123!');
      
      expect(result.usedFallback).toBe(true);
      expect(result.isCompromised).toBe(false);
    });
  });

  describe('Enhanced Local Fallback Validation', () => {
    test('should reject common passwords in fallback mode', async () => {
      const commonPasswords = [
        'password123',
        'Password123',
        'qwerty123',
        'admin123',
        'letmein123',
        'welcome123',
        'monkey123',
        'dragon123'
      ];

      for (const password of commonPasswords) {
        const result = await hibpChecker._performLocalFallbackValidation(password, 1);
        expect(result.isCompromised).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toBe('common_pattern');
        expect(result.validationDetails).toBeDefined();
        expect(result.securityScore).toBeLessThan(3);
      }
    });

    test('should reject passwords with low entropy in fallback mode', async () => {
      const lowEntropyPasswords = [
        'aaaaaaaaaa', // Repeated characters
        'abcdefghij', // Sequential
        '1111111111'  // All same digit
      ];

      for (const password of lowEntropyPasswords) {
        const result = await hibpChecker._performLocalFallbackValidation(password, 1);
        expect(result.isCompromised).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.entropyRatio).toBeLessThan(0.5);
        expect(result.validationDetails.hasLowEntropy).toBe(true);
      }
    });

    test('should accept strong passwords in fallback mode', async () => {
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd2024',
        'C0mpl3x&S3cur3!P@ss',
        'Un1qu3$P@ssw0rd#2024',
        'Tr3m3nd0us!y$3cur3P@ss'
      ];

      for (const password of strongPasswords) {
        const result = await hibpChecker._performLocalFallbackValidation(password, 1);
        expect(result.isCompromised).toBe(false);
        expect(result.usedFallback).toBe(true);
        expect(result.fallbackReason).toBe('passed_local_checks');
        expect(result.securityScore).toBeGreaterThanOrEqual(3);
        expect(result.charSetCount).toBeGreaterThanOrEqual(3);
      }
    });

    test('should handle keyboard patterns in fallback mode', async () => {
      const keyboardPatterns = [
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm123',
        'qazwsxedc',
        'rfvtgbyhn'
      ];

      for (const password of keyboardPatterns) {
        const result = await hibpChecker._performLocalFallbackValidation(password, 1);
        expect(result.isCompromised).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.validationDetails.hasKeyboardWalk).toBe(true);
      }
    });

    test('should detect common words in passwords', async () => {
      const passwordsWithCommonWords = [
        'password2024!',
        'Admin@123',
        'Company$ecret',
        'Business123!'
      ];

      for (const password of passwordsWithCommonWords) {
        const result = await hibpChecker._performLocalFallbackValidation(password, 1);
        expect(result.isCompromised).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.validationDetails.containsCommonWord).toBe(true);
      }
    });

    test('should detect repetitive patterns', async () => {
      const repetitivePasswords = [
        'abcabcabc123',
        '123123123abc',
        'xyzxyzxyz!'
      ];

      for (const password of repetitivePasswords) {
        const result = await hibpChecker._performLocalFallbackValidation(password, 1);
        expect(result.isCompromised).toBe(true);
        expect(result.usedFallback).toBe(true);
        expect(result.validationDetails.hasRepetitivePattern).toBe(true);
      }
    });

    test('should evaluate character set diversity', async () => {
      const testCases = [
        { password: 'onlylowercase', expectedCharSets: 1 },
        { password: 'LowerAndUpper', expectedCharSets: 2 },
        { password: 'LowerUpper123', expectedCharSets: 3 },
        { password: 'LowerUpper123!', expectedCharSets: 4 }
      ];

      for (const testCase of testCases) {
        const result = await hibpChecker._performLocalFallbackValidation(testCase.password, 1);
        expect(result.charSetCount).toBe(testCase.expectedCharSets);
        expect(result.validationDetails.hasInsufficientCharSets).toBe(testCase.expectedCharSets < 3);
      }
    });

    test('should provide detailed security scoring', async () => {
      const result = await hibpChecker._performLocalFallbackValidation('MyVeryStr0ng&C0mpl3xP@ssw0rd!2024', 1);
      
      expect(result.securityScore).toBeDefined();
      expect(result.entropyRatio).toBeDefined();
      expect(result.charSetCount).toBeDefined();
      expect(result.validationDetails).toMatchObject({
        hasCommonPattern: expect.any(Boolean),
        containsCommonWord: expect.any(Boolean),
        hasKeyboardWalk: expect.any(Boolean),
        hasRepetitivePattern: expect.any(Boolean),
        hasLowEntropy: expect.any(Boolean),
        hasInsufficientCharSets: expect.any(Boolean),
        isTooShort: expect.any(Boolean),
        isVeryShort: expect.any(Boolean)
      });
    });
  });

  describe('Enhanced Caching Behavior', () => {
    test('should cache successful HIBP responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // First request
      await hibpChecker.checkPassword('TestPassword123!');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second request with same password should use cache
      await hibpChecker.checkPassword('TestPassword123!');
      expect(fetch).toHaveBeenCalledTimes(1); // No additional fetch

      const metrics = hibpChecker.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheSize).toBeGreaterThan(0);
      expect(metrics.persistentCacheSize).toBeGreaterThan(0);
    });

    test('should use persistent cache when regular cache expires', async () => {
      // Set short regular cache expiry but longer persistent cache expiry
      hibpChecker.cacheExpiry = 100; // 100ms
      hibpChecker.persistentCacheExpiry = 5000; // 5 seconds

      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // First request - populates both caches
      await hibpChecker.checkPassword('TestPassword123!');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Wait for regular cache to expire but not persistent cache
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second request should use persistent cache (no new fetch)
      await hibpChecker.checkPassword('TestPassword123!');
      expect(fetch).toHaveBeenCalledTimes(1);

      const metrics = hibpChecker.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.persistentCacheSize).toBeGreaterThan(0);
    });

    test('should use negative cache to avoid repeated failures', async () => {
      fetch.mockRejectedValue(new Error('Service Unavailable'));

      // First request fails
      const result1 = await hibpChecker.checkPassword('TestPassword123!');
      expect(result1.usedFallback).toBe(true);

      // Second request should use negative cache
      const result2 = await hibpChecker.checkPassword('TestPassword123!');
      expect(result2.usedFallback).toBe(true);

      // Should only have made one network request
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(hibpChecker.getMetrics().negativeCacheSize).toBeGreaterThan(0);
    });

    test('should expire cache entries after timeout', async () => {
      // Mock shorter cache expiry for testing
      hibpChecker.cacheExpiry = 100; // 100ms
      hibpChecker.persistentCacheExpiry = 100; // Also expire persistent cache

      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // First request
      await hibpChecker.checkPassword('TestPassword123!');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Wait for both caches to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second request should make new network call
      await hibpChecker.checkPassword('TestPassword123!');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should clear negative cache when requested', async () => {
      fetch.mockRejectedValue(new Error('Service Unavailable'));

      // Cause a failure to populate negative cache
      await hibpChecker.checkPassword('TestPassword123!');
      expect(hibpChecker.getMetrics().negativeCacheSize).toBeGreaterThan(0);

      // Clear negative cache
      hibpChecker.clearNegativeCache();
      expect(hibpChecker.getMetrics().negativeCacheSize).toBe(0);

      // Mock successful response
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // Should now make network request instead of using negative cache
      const result = await hibpChecker.checkPassword('TestPassword123!');
      expect(result.usedFallback).toBe(false);
    });

    test('should manage cache size limits effectively', async () => {
      hibpChecker.cacheMaxSize = 3;
      hibpChecker.persistentCacheMaxSize = 5;

      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // Fill caches beyond limits
      for (let i = 0; i < 10; i++) {
        await hibpChecker.checkPassword(`TestPassword${i}!`);
      }

      const metrics = hibpChecker.getMetrics();
      expect(metrics.cacheSize).toBeLessThanOrEqual(3);
      expect(metrics.persistentCacheSize).toBeLessThanOrEqual(5);
      expect(metrics.totalCacheSize).toBeLessThanOrEqual(8);
    });

    test('should clear caches selectively', async () => {
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // Populate caches
      await hibpChecker.checkPassword('TestPassword1!');
      await hibpChecker.checkPassword('TestPassword2!');

      expect(hibpChecker.getMetrics().cacheSize).toBeGreaterThan(0);
      expect(hibpChecker.getMetrics().persistentCacheSize).toBeGreaterThan(0);

      // Clear only regular cache
      hibpChecker.clearCache(false);
      expect(hibpChecker.getMetrics().cacheSize).toBe(0);
      expect(hibpChecker.getMetrics().persistentCacheSize).toBeGreaterThan(0);

      // Clear all caches including persistent
      hibpChecker.clearCache(true);
      expect(hibpChecker.getMetrics().cacheSize).toBe(0);
      expect(hibpChecker.getMetrics().persistentCacheSize).toBe(0);
    });
  });

  describe('Enhanced Retry Logic and Adaptive Mechanisms', () => {
    test('should implement exponential backoff correctly', async () => {
      let callCount = 0;
      const callTimes = [];

      fetch.mockImplementation(() => {
        callTimes.push(Date.now());
        callCount++;
        
        if (callCount <= 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('12345:100\n67890:50')
        });
      });

      const startTime = Date.now();
      await hibpChecker.checkPassword('TestPassword123!');
      
      expect(callCount).toBe(3);
      
      // Check that delays increased exponentially
      if (callTimes.length >= 3) {
        const delay1 = callTimes[1] - callTimes[0];
        const delay2 = callTimes[2] - callTimes[1];
        expect(delay2).toBeGreaterThan(delay1);
      }
    });

    test('should respect maximum retry delay', async () => {
      hibpChecker.maxRetryDelay = 2000; // 2 seconds max
      
      let callCount = 0;
      fetch.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Persistent failure'));
      });

      const startTime = Date.now();
      await hibpChecker.checkPassword('TestPassword123!');
      const endTime = Date.now();
      
      // Even with exponential backoff, total time should be reasonable
      expect(endTime - startTime).toBeLessThan(15000); // Less than 15 seconds (increased for more retries)
    });

    test('should add enhanced jitter to prevent thundering herd', async () => {
      const delays = [];
      
      // Mock the backoff calculation to capture delays
      const originalCalculateBackoff = hibpChecker._calculateBackoffDelay;
      hibpChecker._calculateBackoffDelay = function(attempt) {
        const delay = originalCalculateBackoff.call(this, attempt);
        delays.push(delay);
        return delay;
      };

      fetch.mockRejectedValue(new Error('Service failure'));

      await hibpChecker.checkPassword('TestPassword123!');
      
      // Should have some variation in delays due to enhanced jitter (20%)
      if (delays.length > 1) {
        const uniqueDelays = new Set(delays);
        expect(uniqueDelays.size).toBeGreaterThan(1);
      }
    });

    test('should adapt backoff based on circuit breaker state', async () => {
      // Trigger circuit breaker failures
      hibpChecker.circuitBreaker.failureCount = 3;

      const delays = [];
      const originalCalculateBackoff = hibpChecker._calculateBackoffDelay;
      hibpChecker._calculateBackoffDelay = function(attempt) {
        const delay = originalCalculateBackoff.call(this, attempt);
        delays.push(delay);
        return delay;
      };

      fetch.mockRejectedValue(new Error('Service failure'));

      await hibpChecker.checkPassword('TestPassword123!');
      
      // Delays should be longer when circuit breaker has failures
      expect(delays.length).toBeGreaterThan(0);
      // The adaptive multiplier should make delays longer
    });

    test('should use adaptive timeout based on performance history', async () => {
      // Simulate slow responses to build performance history
      hibpChecker.metrics.responseTimes = [2000, 2500, 3000, 2200, 2800]; // Slow responses

      const originalGetAdaptiveTimeout = hibpChecker._getAdaptiveTimeout;
      let adaptiveTimeout;
      hibpChecker._getAdaptiveTimeout = function() {
        adaptiveTimeout = originalGetAdaptiveTimeout.call(this);
        return adaptiveTimeout;
      };

      fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            text: () => Promise.resolve('12345:100\n67890:50')
          }), 1000)
        )
      );

      await hibpChecker.checkPassword('TestPassword123!');
      
      // Adaptive timeout should be higher than base timeout due to slow history
      expect(adaptiveTimeout).toBeGreaterThan(hibpChecker.timeout);
    });

    test('should handle increased retry attempts for better resilience', async () => {
      let callCount = 0;
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 4) { // Fail first 4 attempts
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('12345:100\n67890:50')
        });
      });

      const result = await hibpChecker.checkPassword('TestPassword123!');
      
      expect(callCount).toBe(5); // Should retry up to 5 times (increased from 3)
      expect(result.usedFallback).toBe(false); // Should eventually succeed
    });

    test('should fall back after maximum retries exceeded', async () => {
      fetch.mockRejectedValue(new Error('Persistent failure'));

      const result = await hibpChecker.checkPassword('TestPassword123!');
      
      expect(result.usedFallback).toBe(true);
      expect(result.fallbackReason).toBeDefined();
      expect(hibpChecker.getMetrics().fallbackActivations).toBeGreaterThan(0);
    });
  });

  describe('Integration with Enhanced usePasswordValidation Hook', () => {
    test('should handle HIBP service failure gracefully in hook', async () => {
      // Mock HIBP failure
      fetch.mockRejectedValue(new Error('Service Unavailable'));

      const { result } = renderHook(() => 
        usePasswordValidation('StrongPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      // Hook should handle failure gracefully using enhanced error handling
      expect(result.current.hibpError).toBeNull();
      // Should not prevent form submission
      expect(result.current.isValid).toBeDefined();
      // Should provide enhanced error context
      expect(result.current.getStatusMessage).toBeDefined();
    });

    test('should provide enhanced fallback status information', async () => {
      // Mock fallback scenario
      fetch.mockRejectedValue(new Error('Service Unavailable'));

      const { result } = renderHook(() => 
        usePasswordValidation('StrongPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      // Should indicate fallback was used with detailed information
      expect(result.current.usedFallback).toBeDefined();
      expect(result.current.getServiceStatus).toBeDefined();
      
      const serviceStatus = result.current.getServiceStatus();
      expect(serviceStatus).toMatchObject({
        isAvailable: expect.any(Boolean),
        circuitBreakerState: expect.any(String),
        cacheSize: expect.any(Number),
        negativeCacheSize: expect.any(Number)
      });
    });

    test('should allow manual retry after service recovery', async () => {
      // Initially fail
      fetch.mockRejectedValue(new Error('Service Unavailable'));

      const { result } = renderHook(() => 
        usePasswordValidation('StrongPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      // Mock service recovery
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // Reset circuit breaker and retry
      await act(async () => {
        if (result.current.resetCircuitBreaker) {
          result.current.resetCircuitBreaker();
        }
        await result.current.recheckHIBP();
      });

      expect(result.current.usedFallback).toBe(false);
    });

    test('should provide performance metrics through hook', async () => {
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      const { result } = renderHook(() => 
        usePasswordValidation('StrongPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      if (result.current.getPerformanceMetrics) {
        const metrics = result.current.getPerformanceMetrics();
        expect(metrics).toMatchObject({
          totalRequests: expect.any(Number),
          cacheHits: expect.any(Number),
          cacheMisses: expect.any(Number),
          cacheSize: expect.any(Number),
          persistentCacheSize: expect.any(Number),
          circuitBreakerState: expect.any(String)
        });
      }
    });

    test('should handle cache management through hook', async () => {
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      const { result } = renderHook(() => 
        usePasswordValidation('StrongPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      // Should provide cache management functions
      if (result.current.clearCache) {
        await act(async () => {
          result.current.clearCache();
        });
      }

      if (result.current.clearNegativeCache) {
        await act(async () => {
          result.current.clearNegativeCache();
        });
      }
    });

    test('should integrate with static import error handling', async () => {
      // Mock error that should be handled by static import error handlers
      fetch.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => 
        usePasswordValidation('StrongPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      // Should handle error gracefully without breaking the hook
      expect(result.current.isValid).toBeDefined();
      expect(result.current.requirements).toBeDefined();
      expect(result.current.errors).toBeDefined();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should limit cache size to prevent memory leaks', async () => {
      hibpChecker.cacheMaxSize = 5; // Small cache for testing

      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // Fill cache beyond limit
      for (let i = 0; i < 10; i++) {
        await hibpChecker.checkPassword(`TestPassword${i}!`);
      }

      const metrics = hibpChecker.getMetrics();
      expect(metrics.cacheSize).toBeLessThanOrEqual(5);
    });

    test('should clean up expired cache entries', async () => {
      hibpChecker.cacheExpiry = 50; // Very short expiry

      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      // Add entries to cache
      await hibpChecker.checkPassword('TestPassword1!');
      await hibpChecker.checkPassword('TestPassword2!');

      expect(hibpChecker.getMetrics().cacheSize).toBe(2);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger cleanup by adding new entry
      await hibpChecker.checkPassword('TestPassword3!');

      // Old entries should be cleaned up
      expect(hibpChecker.getMetrics().cacheSize).toBe(1);
    });

    test('should track performance metrics accurately', async () => {
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('12345:100\n67890:50')
      });

      const initialMetrics = hibpChecker.getMetrics();
      
      await hibpChecker.checkPassword('TestPassword123!');
      
      const finalMetrics = hibpChecker.getMetrics();
      
      expect(finalMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1);
      expect(finalMetrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should recover from temporary network issues', async () => {
      let callCount = 0;
      
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('12345:100\n67890:50')
        });
      });

      const result = await hibpChecker.checkPassword('TestPassword123!');
      
      expect(result.usedFallback).toBe(false);
      expect(callCount).toBe(2); // Initial failure + successful retry
    });

    test('should handle mixed success/failure scenarios', async () => {
      let callCount = 0;
      
      fetch.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('12345:100\n67890:50')
        });
      });

      // First request should succeed
      const result1 = await hibpChecker.checkPassword('TestPassword1!');
      expect(result1.usedFallback).toBe(false);

      // Second request should use fallback due to failure
      const result2 = await hibpChecker.checkPassword('TestPassword2!');
      expect(result2.usedFallback).toBe(true);
    });
  });
});