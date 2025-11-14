/**
 * Network Utilities for OAuth Authentication
 * 
 * This module provides network error handling, retry logic, and offline state management
 * for OAuth authentication flows.
 */

import NetInfo from '@react-native-community/netinfo';
import { OAuthError, OAuthErrorTypes } from './oauthErrors';

// Network configuration
const NETWORK_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in milliseconds
  retryDelayMultiplier: 2, // Exponential backoff multiplier
  timeoutMs: 10000, // Request timeout
  offlineCheckInterval: 5000 // How often to check connectivity when offline
};

// Network state management
class NetworkStateManager {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.unsubscribe = null;
    this.init();
  }

  init() {
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners(this.isOnline);
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected && state.isInternetReachable;
      this.notifyListeners(this.isOnline);
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(isOnline) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.warn('Network state listener error:', error);
      }
    });
  }

  getNetworkState() {
    return this.isOnline;
  }

  async checkConnectivity() {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected && state.isInternetReachable;
      return this.isOnline;
    } catch (error) {
      console.warn('Failed to check network connectivity:', error);
      return false;
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }
}

// Global network state manager instance
export const networkStateManager = new NetworkStateManager();

// Retry utilities
export class RetryManager {
  /**
   * Execute a function with retry logic
   */
  static async executeWithRetry(
    asyncFunction,
    options = {},
    onRetry = null
  ) {
    const {
      maxRetries = NETWORK_CONFIG.maxRetries,
      retryDelay = NETWORK_CONFIG.retryDelay,
      retryDelayMultiplier = NETWORK_CONFIG.retryDelayMultiplier,
      shouldRetry = this.defaultShouldRetry,
      provider = null
    } = options;

    let lastError = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Check network connectivity before attempting
        if (!networkStateManager.getNetworkState()) {
          throw new OAuthError(
            OAuthErrorTypes.OFFLINE,
            null,
            { provider, attempt }
          );
        }

        const result = await asyncFunction();
        return result;

      } catch (error) {
        lastError = error;
        attempt++;

        // Don't retry if we've exceeded max attempts
        if (attempt > maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (!shouldRetry(error)) {
          break;
        }

        // Notify about retry attempt
        if (onRetry) {
          onRetry(attempt, maxRetries, error);
        }

        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(retryDelayMultiplier, attempt - 1);
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        console.log(`Retrying in ${Math.round(totalDelay)}ms (attempt ${attempt}/${maxRetries})`);
        
        await this.sleep(totalDelay);
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  /**
   * Default retry logic - determines if an error should be retried
   */
  static defaultShouldRetry(error) {
    if (error instanceof OAuthError) {
      const retryableTypes = [
        OAuthErrorTypes.NETWORK_ERROR,
        OAuthErrorTypes.TIMEOUT,
        OAuthErrorTypes.PROVIDER_UNAVAILABLE,
        OAuthErrorTypes.OFFLINE
      ];
      return retryableTypes.includes(error.type);
    }

    // Handle native errors
    if (error.message) {
      const retryableMessages = [
        'network request failed',
        'timeout',
        'connection refused',
        'network error',
        'fetch failed'
      ];
      
      const errorMessage = error.message.toLowerCase();
      return retryableMessages.some(msg => errorMessage.includes(msg));
    }

    return false;
  }

  /**
   * Sleep utility for delays
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Network-aware fetch wrapper
export class NetworkAwareFetch {
  /**
   * Enhanced fetch with network awareness and retry logic
   */
  static async fetch(url, options = {}, retryOptions = {}) {
    const {
      timeout = NETWORK_CONFIG.timeoutMs,
      ...fetchOptions
    } = options;

    const fetchWithTimeout = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new OAuthError(
            OAuthErrorTypes.TIMEOUT,
            `Request timed out after ${timeout}ms`,
            { url, timeout }
          );
        }
        
        // Handle network errors
        if (error.message.includes('Network request failed') || 
            error.message.includes('fetch failed')) {
          throw new OAuthError(
            OAuthErrorTypes.NETWORK_ERROR,
            'Network connection failed',
            { url, originalError: error.message }
          );
        }
        
        throw error;
      }
    };

    return RetryManager.executeWithRetry(
      fetchWithTimeout,
      {
        ...retryOptions,
        provider: retryOptions.provider || 'unknown'
      },
      retryOptions.onRetry
    );
  }
}

// OAuth-specific network utilities
export class OAuthNetworkUtils {
  /**
   * Check if OAuth providers are available
   */
  static async checkProviderAvailability(providers = ['google', 'github']) {
    const results = {};
    
    const checkProvider = async (provider) => {
      const endpoints = {
        google: 'https://accounts.google.com/.well-known/openid_configuration',
        github: 'https://api.github.com/meta'
      };

      try {
        const response = await NetworkAwareFetch.fetch(
          endpoints[provider],
          { method: 'GET' },
          { maxRetries: 1, provider }
        );
        
        return { available: true, status: response.status };
      } catch (error) {
        return { 
          available: false, 
          error: error.type || 'unknown_error',
          message: error.message 
        };
      }
    };

    // Check all providers concurrently
    const checks = providers.map(async provider => {
      const result = await checkProvider(provider);
      results[provider] = result;
    });

    await Promise.all(checks);
    return results;
  }

  /**
   * Wait for network connectivity
   */
  static async waitForConnectivity(timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      // If already online, resolve immediately
      if (networkStateManager.getNetworkState()) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        reject(new OAuthError(
          OAuthErrorTypes.TIMEOUT,
          'Timed out waiting for network connectivity',
          { timeoutMs }
        ));
      }, timeoutMs);

      const cleanup = networkStateManager.addListener((isOnline) => {
        if (isOnline) {
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        }
      });
    });
  }

  /**
   * Execute OAuth operation with network awareness
   */
  static async executeOAuthOperation(
    operation,
    provider,
    options = {}
  ) {
    const {
      waitForConnectivity = true,
      maxRetries = NETWORK_CONFIG.maxRetries,
      onRetry = null,
      onOffline = null
    } = options;

    try {
      // Wait for connectivity if offline
      if (waitForConnectivity && !networkStateManager.getNetworkState()) {
        if (onOffline) {
          onOffline();
        }
        
        await this.waitForConnectivity();
      }

      // Execute with retry logic
      return await RetryManager.executeWithRetry(
        operation,
        {
          maxRetries,
          provider,
          shouldRetry: (error) => {
            // Custom retry logic for OAuth operations
            if (error instanceof OAuthError) {
              const retryableTypes = [
                OAuthErrorTypes.NETWORK_ERROR,
                OAuthErrorTypes.TIMEOUT,
                OAuthErrorTypes.PROVIDER_UNAVAILABLE
              ];
              return retryableTypes.includes(error.type);
            }
            return RetryManager.defaultShouldRetry(error);
          }
        },
        onRetry
      );

    } catch (error) {
      // Enhance error with network context
      if (error instanceof OAuthError) {
        error.details = {
          ...error.details,
          networkState: networkStateManager.getNetworkState(),
          timestamp: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }
}

// Offline state management for OAuth
export class OfflineStateManager {
  constructor() {
    this.offlineQueue = [];
    this.isProcessingQueue = false;
    
    // Listen for network state changes
    networkStateManager.addListener((isOnline) => {
      if (isOnline && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Queue OAuth operation for when network is available
   */
  queueOperation(operation, provider, options = {}) {
    const queueItem = {
      id: Date.now() + Math.random(),
      operation,
      provider,
      options,
      timestamp: new Date().toISOString(),
      attempts: 0
    };

    this.offlineQueue.push(queueItem);
    return queueItem.id;
  }

  /**
   * Process queued operations when network is available
   */
  async processOfflineQueue() {
    if (this.isProcessingQueue || this.offlineQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const queue = [...this.offlineQueue];
      this.offlineQueue = [];

      for (const item of queue) {
        try {
          await OAuthNetworkUtils.executeOAuthOperation(
            item.operation,
            item.provider,
            item.options
          );
          
          console.log(`Successfully processed queued OAuth operation for ${item.provider}`);
        } catch (error) {
          console.warn(`Failed to process queued OAuth operation for ${item.provider}:`, error);
          
          // Re-queue if it's a retryable error and we haven't exceeded attempts
          if (item.attempts < 3 && RetryManager.defaultShouldRetry(error)) {
            item.attempts++;
            this.offlineQueue.push(item);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Clear all queued operations
   */
  clearQueue() {
    this.offlineQueue = [];
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.offlineQueue.length,
      isProcessing: this.isProcessingQueue,
      isOnline: networkStateManager.getNetworkState()
    };
  }
}

// Global offline state manager instance
export const offlineStateManager = new OfflineStateManager();

// Export network configuration for customization
export { NETWORK_CONFIG };

// Cleanup function for app shutdown
export const cleanup = () => {
  networkStateManager.destroy();
};