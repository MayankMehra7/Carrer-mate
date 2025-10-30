/**
 * Unit tests for HIBP API integration
 * Tests HIBP API integration with mocked responses and error scenarios
 */

import { HIBPChecker, HIBPError, HIBPErrorTypes, checkPasswordCompromised, hibpChecker } from '../hibpApi';

// Mock crypto-js
jest.mock('crypto-js', () => ({
  SHA1: jest.fn(() => ({
    toString: jest.fn(() => 'ABEABEABEABEABEABEABEABEABEABEABEABEABE')
  }))
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('HIBP API Integration', () => {
  let checker;

  beforeEach(() => {
    checker = new HIBPChecker();
    fetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('HIBPChecker class', () => {
    test('should initialize with correct default values', () => {
      expect(checker.baseUrl).toBe('https://api.pwnedpasswords.com/range/');
      expect(checker.timeout).toBe(5000);
      expect(checker.retryAttempts).toBe(2);
    });

    describe('shouldCheck method', () => {
      test('should return true for valid passwords >= 10 characters', () => {
        expect(checker.shouldCheck('ValidPass123!')).toBe(true);
        expect(checker.shouldCheck('1234567890')).toBe(true);
      });

      test('should return false for invalid inputs', () => {
        expect(checker.shouldCheck('short')).toBe(false);
        expect(checker.shouldCheck('')).toBe(false);
        expect(checker.shouldCheck(null)).toBe(false);
        expect(checker.shouldCheck(undefined)).toBe(false);
        expect(checker.shouldCheck(123)).toBe(false);
      });
    });

    describe('checkPassword method', () => {
      test('should return false for safe password', async () => {
        const mockResponse = 'ABCDE:123\nFGHIJ:456\nKLMNO:789';
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockResponse)
        });

        const result = await checker.checkPassword('SafePassword123!');
        expect(result).toBe(false);
        expect(fetch).toHaveBeenCalledWith(
          'https://api.pwnedpasswords.com/range/ABEAB',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'User-Agent': 'CareerMate-App-Password-Checker'
            })
          })
        );
      });

      test('should return true for compromised password', async () => {
        const mockResponse = 'EABEABEABEABEABEABEABEABEABEABEABEABE:123\nFGHIJ:456';
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockResponse)
        });

        const result = await checker.checkPassword('CompromisedPass123!');
        expect(result).toBe(true);
      });

      test('should handle network errors gracefully', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await checker.checkPassword('TestPassword123!');
        expect(result).toBe(false); // Should return false (safe) on error
      });

      test('should handle timeout errors', async () => {
        fetch.mockImplementationOnce(() => 
          new Promise((resolve) => {
            setTimeout(() => resolve({
              ok: true,
              text: () => Promise.resolve('ABCDE:123')
            }), 6000); // Longer than timeout
          })
        );

        const promise = checker.checkPassword('TestPassword123!');
        
        // Fast-forward time to trigger timeout
        jest.advanceTimersByTime(5000);
        
        const result = await promise;
        expect(result).toBe(false); // Should return false on timeout
      });

      test('should handle HTTP error responses', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });

        const result = await checker.checkPassword('TestPassword123!');
        expect(result).toBe(false);
      });

      test('should handle rate limiting (429)', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        });

        await expect(checker.checkPassword('TestPassword123!')).rejects.toThrow(HIBPError);
      });

      test('should handle service unavailable (503)', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        });

        await expect(checker.checkPassword('TestPassword123!')).rejects.toThrow(HIBPError);
      });

      test('should reject invalid password inputs', async () => {
        await expect(checker.checkPassword('')).rejects.toThrow(HIBPError);
        await expect(checker.checkPassword(null)).rejects.toThrow(HIBPError);
        await expect(checker.checkPassword(undefined)).rejects.toThrow(HIBPError);
      });

      test('should handle malformed API responses', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(null)
        });

        await expect(checker.checkPassword('TestPassword123!')).rejects.toThrow(HIBPError);
      });

      test('should implement retry logic for transient failures', async () => {
        // First call fails, second succeeds
        fetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve('ABCDE:123')
          });

        const result = await checker.checkPassword('TestPassword123!');
        expect(result).toBe(false);
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      test('should not retry for rate limit errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        });

        await expect(checker.checkPassword('TestPassword123!')).rejects.toThrow(HIBPError);
        expect(fetch).toHaveBeenCalledTimes(1); // Should not retry
      });

      test('should enforce rate limiting between requests', async () => {
        const startTime = Date.now();
        
        fetch.mockResolvedValue({
          ok: true,
          status: 200,
          text: () => Promise.resolve('ABCDE:123')
        });

        // Make two requests quickly
        const promise1 = checker.checkPassword('Password1!');
        const promise2 = checker.checkPassword('Password2!');

        await Promise.all([promise1, promise2]);

        // Second request should be delayed
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(100);
      });
    });
  });

  describe('HIBPError class', () => {
    test('should create error with correct properties', () => {
      const error = new HIBPError('Test message', HIBPErrorTypes.NETWORK_ERROR);
      
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('HIBPError');
      expect(error.type).toBe(HIBPErrorTypes.NETWORK_ERROR);
      expect(error.timestamp).toBeDefined();
    });

    test('should handle original error', () => {
      const originalError = new Error('Original');
      const error = new HIBPError('Wrapped', HIBPErrorTypes.API_ERROR, originalError);
      
      expect(error.originalError).toBe(originalError);
    });

    test('should default to UNKNOWN_ERROR type', () => {
      const error = new HIBPError('Test message');
      expect(error.type).toBe(HIBPErrorTypes.UNKNOWN_ERROR);
    });
  });

  describe('Error categorization', () => {
    test('should categorize AbortError as timeout', () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      fetch.mockRejectedValueOnce(abortError);
      
      return expect(checker.checkPassword('TestPassword123!')).rejects.toThrow(
        expect.objectContaining({ type: HIBPErrorTypes.TIMEOUT_ERROR })
      );
    });

    test('should categorize network errors correctly', () => {
      const networkError = new Error('Failed to fetch');
      
      fetch.mockRejectedValueOnce(networkError);
      
      return expect(checker.checkPassword('TestPassword123!')).rejects.toThrow(
        expect.objectContaining({ type: HIBPErrorTypes.NETWORK_ERROR })
      );
    });
  });

  describe('Singleton instance', () => {
    test('should export singleton hibpChecker instance', () => {
      expect(hibpChecker).toBeInstanceOf(HIBPChecker);
    });

    test('should export convenience function', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ABCDE:123')
      });

      const result = await checkPasswordCompromised('TestPassword123!');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle empty API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('')
      });

      const result = await checker.checkPassword('TestPassword123!');
      expect(result).toBe(false);
    });

    test('should handle API response with only newlines', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('\n\n\n')
      });

      const result = await checker.checkPassword('TestPassword123!');
      expect(result).toBe(false);
    });

    test('should handle API response with malformed lines', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ABCDE\nFGHIJ:456\nKLMNO')
      });

      const result = await checker.checkPassword('TestPassword123!');
      expect(result).toBe(false);
    });

    test('should match hash suffix case-insensitively', async () => {
      const mockResponse = 'eabeabeabeabeabeabeabeabeabeabeabeabe:123';
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockResponse)
      });

      const result = await checker.checkPassword('TestPassword123!');
      expect(result).toBe(true);
    });

    test('should handle very large API responses', async () => {
      const largeMockResponse = Array(1000).fill('ABCDE:123').join('\n');
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(largeMockResponse)
      });

      const result = await checker.checkPassword('TestPassword123!');
      expect(result).toBe(false);
    });
  });

  describe('Performance and reliability', () => {
    test('should handle concurrent requests', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ABCDE:123')
      });

      const promises = Array(5).fill().map((_, i) => 
        checker.checkPassword(`TestPassword${i}!`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(results.every(r => typeof r === 'boolean')).toBe(true);
    });

    test('should maintain state across multiple requests', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ABCDE:123')
      });

      await checker.checkPassword('Password1!');
      await checker.checkPassword('Password2!');
      
      // Should maintain consistent behavior
      expect(checker.timeout).toBe(5000);
      expect(checker.retryAttempts).toBe(2);
    });
  });
});