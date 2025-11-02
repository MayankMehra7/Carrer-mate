/**
 * useHIBPCheck hook for password compromise checking
 * Manages HIBP API integration with comprehensive error handling and fallback behavior
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { hibpChecker, HIBPError, HIBPErrorTypes } from '../utils/hibpApi';

/**
 * Hook for checking passwords against HIBP database with comprehensive error handling
 * @returns {Object} Object containing checkPassword function and enhanced state management
 */
export const useHIBPCheck = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCheckResult, setLastCheckResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);

  // Keep track of the current request to allow cancellation
  const currentRequestRef = useRef(null);
  const maxRetries = 3;
  const serviceUnavailableTimeout = 30000; // 30 seconds
  
  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  /**
   * Automatically reset service availability after timeout
   */
  useEffect(() => {
    if (!isServiceAvailable) {
      const timer = setTimeout(() => {
        setIsServiceAvailable(true);
        setRetryCount(0);
        console.info('HIBP service availability reset - retries enabled');
      }, serviceUnavailableTimeout);

      return () => clearTimeout(timer);
    }
  }, [isServiceAvailable, serviceUnavailableTimeout]);

  /**
   * Handles different types of HIBP errors with appropriate fallback behavior
   * @private
   * @param {HIBPError|Error} error - The error to handle
   * @returns {Object} Error handling result with fallback decision
   */
  const handleHIBPError = useCallback((error) => {
    let shouldFallback = true;
    let userMessage = 'Password security check temporarily unavailable';
    let logMessage = error.message;

    if (error instanceof HIBPError) {
      switch (error.type) {
        case HIBPErrorTypes.NETWORK_ERROR:
          userMessage = 'Network connection issue - password check skipped';
          shouldFallback = true;
          break;
          
        case HIBPErrorTypes.TIMEOUT_ERROR:
          userMessage = 'Password check timed out - continuing with validation';
          shouldFallback = true;
          break;
          
        case HIBPErrorTypes.RATE_LIMIT_ERROR:
          userMessage = 'Too many requests - password check temporarily disabled';
          shouldFallback = true;
          setIsServiceAvailable(false);
          break;
          
        case HIBPErrorTypes.API_ERROR:
          userMessage = 'Password security service temporarily unavailable';
          shouldFallback = true;
          break;
          
        case HIBPErrorTypes.PARSE_ERROR:
          userMessage = 'Password check failed - continuing with other validations';
          shouldFallback = true;
          break;
          
        default:
          userMessage = 'Password security check encountered an issue';
          shouldFallback = true;
      }
    }

    // Requirement 5.4: Proper error logging without exposing sensitive information
    console.warn(`HIBP check failed: ${logMessage}`);

    return {
      shouldFallback,
      userMessage,
      errorType: error instanceof HIBPError ? error.type : 'UNKNOWN_ERROR'
    };
  }, []);

  /**
   * Checks if a password has been compromised with comprehensive error handling
   * @param {string} password - The password to check
   * @returns {Promise<boolean>} True if compromised, false if safe or check failed
   */
  const checkPassword = useCallback(async (password) => {
    // Don't check if password doesn't meet minimum requirements
    if (!hibpChecker.shouldCheck(password)) {
      setLastCheckResult({ checked: false, reason: 'minimum_requirements_not_met' });
      return false;
    }

    // Don't check if service is marked as unavailable
    if (!isServiceAvailable) {
      setLastCheckResult({ checked: false, reason: 'service_unavailable' });
      return false;
    }

    // Cancel any existing request
    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
    }

    // Create new request tracking object
    const requestId = { cancelled: false, timestamp: Date.now() };
    currentRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const result = await hibpChecker.checkPassword(password);
      const isCompromised = result.isCompromised;

      // Check if this request was cancelled while waiting
      if (requestId.cancelled) {
        setLastCheckResult({ checked: false, reason: 'request_cancelled' });
        return false; // Return safe default for cancelled requests
      }

      // Successful check (including fallback)
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
      setLastCheckResult({ 
        checked: true, 
        compromised: isCompromised, 
        timestamp: Date.now(),
        requestId: result.requestId,
        usedFallback: result.usedFallback || false,
        fallbackReason: result.fallbackReason || null
      });
      
      // Update performance metrics
      setPerformanceMetrics(hibpChecker.getMetrics());
      
      return isCompromised;

    } catch (err) {
      // Check if this request was cancelled while waiting
      if (requestId.cancelled) {
        setLastCheckResult({ checked: false, reason: 'request_cancelled' });
        return false; // Return safe default for cancelled requests
      }

      // Handle the error with appropriate fallback behavior
      const errorHandling = handleHIBPError(err);
      
      setError({
        message: errorHandling.userMessage,
        type: errorHandling.errorType,
        timestamp: Date.now(),
        canRetry: retryCount < maxRetries && isServiceAvailable
      });
      
      setIsLoading(false);
      setRetryCount(prev => prev + 1);
      
      // Requirement 3.4: Graceful fallback behavior when external services are unavailable
      setLastCheckResult({ 
        checked: false, 
        reason: 'api_error', 
        error: errorHandling.errorType,
        fallback: errorHandling.shouldFallback 
      });

      // Return false (not compromised) as fallback when API fails
      // This allows password creation to continue when external service is unavailable
      return false;
    }
  }, [isServiceAvailable, retryCount, maxRetries, handleHIBPError]);

  /**
   * Manually retry the last failed check
   */
  const retryCheck = useCallback(async (password) => {
    if (retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached for HIBP check');
      return false;
    }

    return await checkPassword(password);
  }, [checkPassword, retryCount, maxRetries]);

  /**
   * Cancels any ongoing HIBP check
   */
  const cancelCheck = useCallback(() => {
    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
      
      // Cancel the actual network request if it has a request ID
      if (currentRequestRef.current.requestId) {
        hibpChecker.cancelRequest(currentRequestRef.current.requestId);
      }
      
      currentRequestRef.current = null;
    }
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Resets the error state and retry count
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * Resets all state to initial values
   */
  const resetState = useCallback(() => {
    cancelCheck();
    setError(null);
    setRetryCount(0);
    setLastCheckResult(null);
    setIsServiceAvailable(true);
  }, [cancelCheck]);

  /**
   * Gets a user-friendly status message based on current state
   */
  const getStatusMessage = useCallback(() => {
    if (isLoading) {
      return 'Checking password security...';
    }
    
    if (error) {
      return error.message;
    }
    
    if (!isServiceAvailable) {
      return 'Password security check temporarily disabled';
    }
    
    if (lastCheckResult) {
      if (lastCheckResult.checked) {
        if (lastCheckResult.usedFallback) {
          return lastCheckResult.compromised 
            ? 'Password rejected by local security rules'
            : 'Password passed local security validation';
        } else {
          return lastCheckResult.compromised 
            ? 'Password found in security breach database'
            : 'Password not found in known breaches';
        }
      } else {
        switch (lastCheckResult.reason) {
          case 'minimum_requirements_not_met':
            return 'Password too short for security check';
          case 'service_unavailable':
            return 'Security check service unavailable';
          case 'request_cancelled':
            return 'Security check cancelled';
          case 'api_error':
            return 'Security check failed - password allowed';
          default:
            return 'Security check not performed';
        }
      }
    }
    
    return 'Ready to check password security';
  }, [isLoading, error, isServiceAvailable, lastCheckResult]);

  /**
   * Gets current performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    return performanceMetrics || hibpChecker.getMetrics();
  }, [performanceMetrics]);

  /**
   * Clears HIBP cache and resets metrics
   */
  const clearCache = useCallback(() => {
    hibpChecker.clearCache();
    setPerformanceMetrics(null);
  }, []);

  /**
   * Resets the circuit breaker to allow retries
   */
  const resetCircuitBreaker = useCallback(() => {
    hibpChecker.resetCircuitBreaker();
    setIsServiceAvailable(true);
    setRetryCount(0);
  }, []);

  /**
   * Clears the negative cache to allow retry of previously failed requests
   */
  const clearNegativeCache = useCallback(() => {
    hibpChecker.clearNegativeCache();
  }, []);

  /**
   * Gets detailed service status including circuit breaker and cache info
   */
  const getServiceStatus = useCallback(() => {
    const metrics = hibpChecker.getMetrics();
    return {
      isAvailable: isServiceAvailable,
      circuitBreakerState: metrics.circuitBreakerState,
      cacheSize: metrics.cacheSize,
      negativeCacheSize: metrics.negativeCacheSize,
      fallbackRate: metrics.fallbackRate,
      retryCount,
      hasRecentFailures: metrics.circuitBreakerFailures > 0
    };
  }, [isServiceAvailable, retryCount]);

  return {
    // Core functionality
    checkPassword,
    retryCheck,
    cancelCheck,
    clearError,
    resetState,
    
    // State information
    isLoading,
    error,
    lastCheckResult,
    retryCount,
    isServiceAvailable,
    
    // Computed properties
    hasActiveRequest: currentRequestRef.current !== null,
    canRetry: error && retryCount < maxRetries && isServiceAvailable,
    hasRecentResult: lastCheckResult && lastCheckResult.timestamp && 
                    (Date.now() - lastCheckResult.timestamp) < 60000, // 1 minute
    usedFallback: lastCheckResult?.usedFallback || false,
    
    // Performance monitoring
    performanceMetrics,
    getPerformanceMetrics,
    clearCache,
    
    // Enhanced resilience features
    resetCircuitBreaker,
    clearNegativeCache,
    getServiceStatus,
    
    // User-friendly status
    getStatusMessage
  };
};

export default useHIBPCheck;