/**
 * Network-Aware OAuth Hook
 * 
 * This hook provides network-aware OAuth operations with retry logic,
 * offline state management, and user feedback.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    networkStateManager,
    OAuthNetworkUtils,
    offlineStateManager
} from '../utils/networkUtils';
import { OAuthErrorHandler, OAuthErrorTypes } from '../utils/oauthErrors';

export const useNetworkAwareOAuth = () => {
  const [isOnline, setIsOnline] = useState(networkStateManager.getNetworkState());
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [maxRetries, setMaxRetries] = useState(3);
  const [providerAvailability, setProviderAvailability] = useState({});
  const [isCheckingProviders, setIsCheckingProviders] = useState(false);
  
  const retryTimeoutRef = useRef(null);
  const availabilityCheckRef = useRef(null);

  // Listen to network state changes
  useEffect(() => {
    const unsubscribe = networkStateManager.addListener(setIsOnline);
    return unsubscribe;
  }, []);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (availabilityCheckRef.current) {
        clearTimeout(availabilityCheckRef.current);
      }
    };
  }, []);

  /**
   * Check provider availability
   */
  const checkProviderAvailability = useCallback(async (providers = ['google', 'github']) => {
    if (isCheckingProviders) return providerAvailability;
    
    setIsCheckingProviders(true);
    
    try {
      const availability = await OAuthNetworkUtils.checkProviderAvailability(providers);
      setProviderAvailability(availability);
      return availability;
    } catch (error) {
      console.warn('Failed to check provider availability:', error);
      return providerAvailability;
    } finally {
      setIsCheckingProviders(false);
    }
  }, [isCheckingProviders, providerAvailability]);

  /**
   * Execute OAuth operation with network awareness and retry logic
   */
  const executeOAuthOperation = useCallback(async (
    operation,
    provider,
    options = {}
  ) => {
    const {
      showRetryFeedback = true,
      waitForConnectivity = true,
      customRetryLogic = null,
      onRetryAttempt = null,
      onOffline = null,
      onProviderUnavailable = null
    } = options;

    // Reset retry state
    setIsRetrying(false);
    setRetryAttempt(0);

    const handleRetry = (attempt, maxAttempts, error) => {
      if (showRetryFeedback) {
        setIsRetrying(true);
        setRetryAttempt(attempt);
        setMaxRetries(maxAttempts);
      }
      
      if (onRetryAttempt) {
        onRetryAttempt(attempt, maxAttempts, error);
      }
    };

    const handleOffline = () => {
      if (onOffline) {
        onOffline();
      }
    };

    try {
      const result = await OAuthNetworkUtils.executeOAuthOperation(
        operation,
        provider,
        {
          ...options,
          onRetry: handleRetry,
          onOffline: handleOffline
        }
      );

      // Reset retry state on success
      setIsRetrying(false);
      setRetryAttempt(0);
      
      return result;

    } catch (error) {
      // Reset retry state on final failure
      setIsRetrying(false);
      setRetryAttempt(0);

      // Handle provider unavailable
      if (error.type === OAuthErrorTypes.PROVIDER_UNAVAILABLE && onProviderUnavailable) {
        onProviderUnavailable(provider, error);
      }

      throw error;
    }
  }, []);

  /**
   * Wait for network connectivity with user feedback
   */
  const waitForConnectivity = useCallback(async (timeoutMs = 30000) => {
    if (isOnline) return true;

    try {
      await OAuthNetworkUtils.waitForConnectivity(timeoutMs);
      return true;
    } catch (error) {
      throw OAuthErrorHandler.createError(error);
    }
  }, [isOnline]);

  /**
   * Queue OAuth operation for offline execution
   */
  const queueOfflineOperation = useCallback((operation, provider, options = {}) => {
    return offlineStateManager.queueOperation(operation, provider, options);
  }, []);

  /**
   * Get network and retry state
   */
  const getNetworkState = useCallback(() => {
    return {
      isOnline,
      isRetrying,
      retryAttempt,
      maxRetries,
      providerAvailability,
      isCheckingProviders,
      queueStatus: offlineStateManager.getQueueStatus()
    };
  }, [isOnline, isRetrying, retryAttempt, maxRetries, providerAvailability, isCheckingProviders]);

  /**
   * Retry a failed operation manually
   */
  const retryOperation = useCallback(async (operation, provider, options = {}) => {
    // Check connectivity first
    if (!isOnline) {
      try {
        await waitForConnectivity();
      } catch (error) {
        throw OAuthErrorHandler.createError(error, provider);
      }
    }

    return executeOAuthOperation(operation, provider, {
      ...options,
      maxRetries: 1 // Single retry attempt
    });
  }, [isOnline, waitForConnectivity, executeOAuthOperation]);

  /**
   * Create a network-aware OAuth function
   */
  const createNetworkAwareOAuth = useCallback((oauthFunction, provider) => {
    return async (...args) => {
      const operation = () => oauthFunction(...args);
      return executeOAuthOperation(operation, provider);
    };
  }, [executeOAuthOperation]);

  return {
    // Network state
    isOnline,
    isRetrying,
    retryAttempt,
    maxRetries,
    providerAvailability,
    isCheckingProviders,
    
    // Operations
    executeOAuthOperation,
    waitForConnectivity,
    queueOfflineOperation,
    retryOperation,
    checkProviderAvailability,
    createNetworkAwareOAuth,
    
    // State getters
    getNetworkState
  };
};

/**
 * Hook for provider-specific network-aware OAuth
 */
export const useProviderNetworkAwareOAuth = (provider) => {
  const networkOAuth = useNetworkAwareOAuth();
  
  const executeProviderOperation = useCallback(async (operation, options = {}) => {
    return networkOAuth.executeOAuthOperation(operation, provider, options);
  }, [networkOAuth, provider]);

  const retryProviderOperation = useCallback(async (operation, options = {}) => {
    return networkOAuth.retryOperation(operation, provider, options);
  }, [networkOAuth, provider]);

  const createProviderOAuth = useCallback((oauthFunction) => {
    return networkOAuth.createNetworkAwareOAuth(oauthFunction, provider);
  }, [networkOAuth, provider]);

  const checkProviderAvailability = useCallback(async () => {
    const availability = await networkOAuth.checkProviderAvailability([provider]);
    return availability[provider];
  }, [networkOAuth, provider]);

  return {
    ...networkOAuth,
    executeProviderOperation,
    retryProviderOperation,
    createProviderOAuth,
    checkProviderAvailability,
    provider
  };
};

export default useNetworkAwareOAuth;