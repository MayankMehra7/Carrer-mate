/**
 * Unit tests for useHIBPCheck hook
 * Tests HIBP checking hook with various scenarios and error handling
 */

import { act, renderHook } from '@testing-library/react-native';
import { HIBPError, HIBPErrorTypes } from '../../utils/hibpApi';
import { useHIBPCheck } from '../useHIBPCheck';

// Mock the hibpChecker
jest.mock('../../utils/hibpApi', () => ({
  hibpChecker: {
    checkPassword: jest.fn(),
    shouldCheck: jest.fn()
  },
  HIBPError: class HIBPError extends Error {
    constructor(message, type) {
      super(message);
      this.name = 'HIBPError';
      this.type = type;
    }
  },
  HIBPErrorTypes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    API_ERROR: 'API_ERROR',
    PARSE_ERROR: 'PARSE_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  }
}));

import { hibpChecker } from '../../utils/hibpApi';

describe('useHIBPCheck hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    hibpChecker.shouldCheck.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useHIBPCheck());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastCheckResult).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.isServiceAvailable).toBe(true);
      expect(result.current.hasActiveRequest).toBe(false);
      expect(result.current.canRetry).toBe(false);
      expect(result.current.hasRecentResult).toBe(false);
    });

    test('should provide all expected functions', () => {
      const { result } = renderHook(() => useHIBPCheck());

      expect(typeof result.current.checkPassword).toBe('function');
      expect(typeof result.current.retryCheck).toBe('function');
      expect(typeof result.current.cancelCheck).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.resetState).toBe('function');
      expect(typeof result.current.getStatusMessage).toBe('function');
    });
  });

  describe('checkPassword function', () => {
    test('should successfully check a safe password', async () => {
      hibpChecker.checkPassword.mockResolvedValue(false);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        const isCompromised = await result.current.checkPassword('SafePassword123!');
        expect(isCompromised).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastCheckResult.checked).toBe(true);
      expect(result.current.lastCheckResult.compromised).toBe(false);
      expect(result.current.retryCount).toBe(0);
    });

    test('should successfully check a compromised password', async () => {
      hibpChecker.checkPassword.mockResolvedValue(true);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        const isCompromised = await result.current.checkPassword('CompromisedPass123!');
        expect(isCompromised).toBe(true);
      });

      expect(result.current.lastCheckResult.checked).toBe(true);
      expect(result.current.lastCheckResult.compromised).toBe(true);
    });

    test('should skip check for passwords not meeting minimum requirements', async () => {
      hibpChecker.shouldCheck.mockReturnValue(false);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        const isCompromised = await result.current.checkPassword('short');
        expect(isCompromised).toBe(false);
      });

      expect(hibpChecker.checkPassword).not.toHaveBeenCalled();
      expect(result.current.lastCheckResult.checked).toBe(false);
      expect(result.current.lastCheckResult.reason).toBe('minimum_requirements_not_met');
    });

    test('should skip check when service is unavailable', async () => {
      const { result } = renderHook(() => useHIBPCheck());

      // Set service as unavailable
      act(() => {
        result.current.isServiceAvailable = false;
      });

      await act(async () => {
        const isCompromised = await result.current.checkPassword('Password123!');
        expect(isCompromised).toBe(false);
      });

      expect(hibpChecker.checkPassword).not.toHaveBeenCalled();
      expect(result.current.lastCheckResult.reason).toBe('service_unavailable');
    });

    test('should set loading state during check', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      hibpChecker.checkPassword.mockReturnValue(promise);

      const { result } = renderHook(() => useHIBPCheck());

      act(() => {
        result.current.checkPassword('Password123!');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(false);
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test('should handle request cancellation', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      hibpChecker.checkPassword.mockReturnValue(promise);

      const { result } = renderHook(() => useHIBPCheck());

      // Start check
      act(() => {
        result.current.checkPassword('Password123!');
      });

      // Cancel before completion
      act(() => {
        result.current.cancelCheck();
      });

      await act(async () => {
        resolvePromise(false);
        await promise;
      });

      expect(result.current.lastCheckResult.reason).toBe('request_cancelled');
    });
  });

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      const networkError = new HIBPError('Network error', HIBPErrorTypes.NETWORK_ERROR);
      hibpChecker.checkPassword.mockRejectedValue(networkError);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        const isCompromised = await result.current.checkPassword('Password123!');
        expect(isCompromised).toBe(false); // Should return false on error
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error.type).toBe(HIBPErrorTypes.NETWORK_ERROR);
      expect(result.current.retryCount).toBe(1);
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new HIBPError('Timeout', HIBPErrorTypes.TIMEOUT_ERROR);
      hibpChecker.checkPassword.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        const isCompromised = await result.current.checkPassword('Password123!');
        expect(isCompromised).toBe(false);
      });

      expect(result.current.error.type).toBe(HIBPErrorTypes.TIMEOUT_ERROR);
    });

    test('should handle rate limit errors and disable service', async () => {
      const rateLimitError = new HIBPError('Rate limited', HIBPErrorTypes.RATE_LIMIT_ERROR);
      hibpChecker.checkPassword.mockRejectedValue(rateLimitError);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        await result.current.checkPassword('Password123!');
      });

      expect(result.current.isServiceAvailable).toBe(false);
      expect(result.current.error.type).toBe(HIBPErrorTypes.RATE_LIMIT_ERROR);
    });

    test('should handle API errors', async () => {
      const apiError = new HIBPError('API error', HIBPErrorTypes.API_ERROR);
      hibpChecker.checkPassword.mockRejectedValue(apiError);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        await result.current.checkPassword('Password123!');
      });

      expect(result.current.error.type).toBe(HIBPErrorTypes.API_ERROR);
    });

    test('should handle parse errors', async () => {
      const parseError = new HIBPError('Parse error', HIBPErrorTypes.PARSE_ERROR);
      hibpChecker.checkPassword.mockRejectedValue(parseError);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        await result.current.checkPassword('Password123!');
      });

      expect(result.current.error.type).toBe(HIBPErrorTypes.PARSE_ERROR);
    });

    test('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error');
      hibpChecker.checkPassword.mockRejectedValue(unknownError);

      const { result } = renderHook(() => useHIBPCheck());

      await act(async () => {
        await result.current.checkPassword('Password123!');
      });

      expect(result.current.error.type).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Retry functionality', () => {
    test('should allow retry when under max attempts', async () => {
      const error = new HIBPError('Network error', HIBPErrorTypes.NETWORK_ERROR);
      hibpChecker.checkPassword
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(false);

      const { result } = renderHook(() => useHIBPCheck());

      // First attempt fails
      await act(async () => {
        await result.current.checkPassword('Password123!');
      });

      expect(result.current.canRetry).toBe(true);

      // Retry succeeds
      await act(async () => {
        const isCompromised = await result.current.retryCheck('Password123!');
        expect(isCompromised).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0); // Reset on success
    });

    test('should prevent retry when max attempts reached', async () => {
      const { result } = renderHook(() => useHIBPCheck());

      // Simulate max retries reached
      act(() => {
        result.current.retryCount = 3;
      });

      await act(async () => {
        const isCompromised = await result.current.retryCheck('Password123!');
        expect(isCompromised).toBe(false);
      });

      expect(hibpChecker.checkPassword).not.toHaveBeenCalled();
    });
  });

  describe('Service availability management', () => {
    test('should reset service availability after timeout', async () => {
      const rateLimitError = new HIBPError('Rate limited', HIBPErrorTypes.RATE_LIMIT_ERROR);
      hibpChecker.checkPassword.mockRejectedValue(rateLimitError);

      const { result } = renderHook(() => useHIBPCheck());

      // Trigger rate limit error
      await act(async () => {
        await result.current.checkPassword('Password123!');
      });

      expect(result.current.isServiceAvailable).toBe(false);

      // Fast-forward time to reset service availability
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(result.current.isServiceAvailable).toBe(true);
      expect(result.current.retryCount).toBe(0);
    });
  });

  describe('State management functions', () => {
    test('should clear error state', () => {
      const { result } = renderHook(() => useHIBPCheck());

      // Set error state
      act(() => {
        result.current.error = { message: 'Test error' };
        result.current.retryCount = 2;
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
    });

    test('should reset all state', () => {
      const { result } = renderHook(() => useHIBPCheck());

      // Set various state
      act(() => {
        result.current.error = { message: 'Test error' };
        result.current.retryCount = 2;
        result.current.lastCheckResult = { checked: true };
        result.current.isServiceAvailable = false;
      });

      act(() => {
        result.current.resetState();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.lastCheckResult).toBe(null);
      expect(result.current.isServiceAvailable).toBe(true);
    });

    test('should cancel active requests', () => {
      const { result } = renderHook(() => useHIBPCheck());

      // Start a request
      act(() => {
        result.current.checkPassword('Password123!');
      });

      expect(result.current.hasActiveRequest).toBe(true);

      act(() => {
        result.current.cancelCheck();
      });

      expect(result.current.hasActiveRequest).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Status messages', () => {
    test('should provide appropriate status messages', () => {
      const { result } = renderHook(() => useHIBPCheck());

      // Initial state
      expect(result.current.getStatusMessage()).toBe('Ready to check password security');

      // Loading state
      act(() => {
        result.current.isLoading = true;
      });
      expect(result.current.getStatusMessage()).toBe('Checking password security...');

      // Error state
      act(() => {
        result.current.isLoading = false;
        result.current.error = { message: 'Network error' };
      });
      expect(result.current.getStatusMessage()).toBe('Network error');

      // Service unavailable
      act(() => {
        result.current.error = null;
        result.current.isServiceAvailable = false;
      });
      expect(result.current.getStatusMessage()).toBe('Password security check temporarily disabled');

      // Successful check - safe password
      act(() => {
        result.current.isServiceAvailable = true;
        result.current.lastCheckResult = { checked: true, compromised: false };
      });
      expect(result.current.getStatusMessage()).toBe('Password not found in known breaches');

      // Successful check - compromised password
      act(() => {
        result.current.lastCheckResult = { checked: true, compromised: true };
      });
      expect(result.current.getStatusMessage()).toBe('Password found in security breach database');
    });

    test('should handle different check failure reasons', () => {
      const { result } = renderHook(() => useHIBPCheck());

      const testCases = [
        { reason: 'minimum_requirements_not_met', expected: 'Password too short for security check' },
        { reason: 'service_unavailable', expected: 'Security check service unavailable' },
        { reason: 'request_cancelled', expected: 'Security check cancelled' },
        { reason: 'api_error', expected: 'Security check failed - password allowed' },
        { reason: 'unknown', expected: 'Security check not performed' }
      ];

      testCases.forEach(({ reason, expected }) => {
        act(() => {
          result.current.lastCheckResult = { checked: false, reason };
        });
        expect(result.current.getStatusMessage()).toBe(expected);
      });
    });
  });

  describe('Computed properties', () => {
    test('should calculate hasRecentResult correctly', () => {
      const { result } = renderHook(() => useHIBPCheck());

      // No result
      expect(result.current.hasRecentResult).toBe(false);

      // Recent result
      act(() => {
        result.current.lastCheckResult = { 
          checked: true, 
          timestamp: Date.now() 
        };
      });
      expect(result.current.hasRecentResult).toBe(true);

      // Old result
      act(() => {
        result.current.lastCheckResult = { 
          checked: true, 
          timestamp: Date.now() - 120000 // 2 minutes ago
        };
      });
      expect(result.current.hasRecentResult).toBe(false);
    });

    test('should calculate canRetry correctly', () => {
      const { result } = renderHook(() => useHIBPCheck());

      // No error
      expect(result.current.canRetry).toBe(false);

      // Error but service unavailable
      act(() => {
        result.current.error = { message: 'Error' };
        result.current.isServiceAvailable = false;
      });
      expect(result.current.canRetry).toBe(false);

      // Error, service available, under max retries
      act(() => {
        result.current.isServiceAvailable = true;
        result.current.retryCount = 1;
      });
      expect(result.current.canRetry).toBe(true);

      // Error, service available, max retries reached
      act(() => {
        result.current.retryCount = 3;
      });
      expect(result.current.canRetry).toBe(false);
    });
  });
});