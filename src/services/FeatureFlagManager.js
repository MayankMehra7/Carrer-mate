/**
 * Feature Flag Manager with Caching and Fallbacks
 * Provides reliable feature flag management with offline capabilities
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { errorHandlerRegistry } from '../utils/ErrorHandlerRegistry.js';
import { ErrorCategory } from '../utils/errorHandling.js';

/**
 * Feature flag model interface
 */
export class FeatureFlag {
  constructor(name, enabled = false, defaultValue = false, source = 'default') {
    this.name = name;
    this.enabled = enabled;
    this.defaultValue = defaultValue;
    this.lastUpdated = new Date();
    this.source = source; // 'remote', 'cache', or 'default'
  }

  /**
   * Create a feature flag from API response
   * @param {Object} apiData - API response data
   * @returns {FeatureFlag} Feature flag instance
   */
  static fromApiResponse(apiData) {
    return new FeatureFlag(
      apiData.name,
      apiData.enabled,
      apiData.defaultValue || false,
      'remote'
    );
  }

  /**
   * Create a feature flag from cache data
   * @param {Object} cacheData - Cached flag data
   * @returns {FeatureFlag} Feature flag instance
   */
  static fromCache(cacheData) {
    const flag = new FeatureFlag(
      cacheData.name,
      cacheData.enabled,
      cacheData.defaultValue,
      'cache'
    );
    flag.lastUpdated = new Date(cacheData.lastUpdated);
    return flag;
  }

  /**
   * Convert to cache-friendly format
   * @returns {Object} Cache data
   */
  toCacheData() {
    return {
      name: this.name,
      enabled: this.enabled,
      defaultValue: this.defaultValue,
      lastUpdated: this.lastUpdated.toISOString(),
      source: this.source
    };
  }

  /**
   * Check if flag is expired based on TTL
   * @param {number} ttlMs - TTL in milliseconds
   * @returns {boolean} True if expired
   */
  isExpired(ttlMs) {
    const now = new Date();
    const ageMs = now.getTime() - this.lastUpdated.getTime();
    return ageMs > ttlMs;
  }
}

/**
 * TTL-based cache for feature flags
 */
class FeatureFlagCache {
  constructor(defaultTtlMs = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get a flag from cache if not expired
   * @param {string} flagName - Flag name
   * @param {number} ttlMs - Optional TTL override
   * @returns {FeatureFlag|null} Cached flag or null
   */
  get(flagName, ttlMs = this.defaultTtlMs) {
    const cached = this.cache.get(flagName);
    
    if (!cached) {
      this.missCount++;
      return null;
    }

    if (cached.isExpired(ttlMs)) {
      this.cache.delete(flagName);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return cached;
  }

  /**
   * Store a flag in cache
   * @param {FeatureFlag} flag - Flag to cache
   */
  set(flag) {
    // Update source to indicate it's now cached
    const cachedFlag = new FeatureFlag(
      flag.name,
      flag.enabled,
      flag.defaultValue,
      flag.source === 'remote' ? 'cache' : flag.source
    );
    cachedFlag.lastUpdated = flag.lastUpdated;
    
    this.cache.set(flag.name, cachedFlag);
  }

  /**
   * Get all cached flags
   * @returns {Map<string, FeatureFlag>} All cached flags
   */
  getAll() {
    return new Map(this.cache);
  }

  /**
   * Clear expired flags from cache
   * @param {number} ttlMs - TTL in milliseconds
   * @returns {number} Number of flags cleared
   */
  clearExpired(ttlMs = this.defaultTtlMs) {
    let clearedCount = 0;
    
    for (const [flagName, flag] of this.cache) {
      if (flag.isExpired(ttlMs)) {
        this.cache.delete(flagName);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Clear all cached flags
   */
  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) : 0,
      totalRequests
    };
  }
}

/**
 * Feature Flag Manager with caching and fallback capabilities
 * Handles feature flag retrieval with graceful degradation
 */
export class FeatureFlagManager {
  constructor(options = {}) {
    // Use environment variable for API endpoint with fallback
    const baseApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    this.apiEndpoint = options.apiEndpoint || `${baseApiUrl}/api/feature-flags`;
    this.cache = new FeatureFlagCache(options.cacheTtlMs);
    this.defaultFlags = new Map();
    this.requestTimeout = options.requestTimeout || 3000; // Reduced timeout for faster fallback
    this.retryAttempts = options.retryAttempts || 1; // Reduced retries for faster fallback
    this.retryDelay = options.retryDelay || 500;
    
    // Service health tracking
    this.serviceHealthy = true;
    this.lastServiceCheck = null;
    this.serviceCheckInterval = options.serviceCheckInterval || 30000; // 30 seconds
    
    // Performance tracking
    this.requestCount = 0;
    this.errorCount = 0;
    this.fallbackCount = 0;
    
    // Initialize periodic cache cleanup
    this.startCacheCleanup();
  }

  /**
   * Set default flag values for fallback scenarios
   * Requirement 3.1: Use default flag values when remote service is unavailable
   * @param {Object} defaults - Default flag values
   */
  setDefaultFlags(defaults) {
    this.defaultFlags.clear();
    
    for (const [flagName, enabled] of Object.entries(defaults)) {
      const flag = new FeatureFlag(flagName, enabled, enabled, 'default');
      this.defaultFlags.set(flagName, flag);
    }

    console.info(`Set ${this.defaultFlags.size} default feature flags`);
  }

  /**
   * Get a single feature flag with caching and fallback
   * Requirement 3.2: Log errors and apply fallback configuration
   * Requirement 3.3: Cache successful flag retrievals
   * @param {string} flagName - Name of the feature flag
   * @param {Object} options - Request options
   * @returns {Promise<boolean>} Flag enabled status
   */
  async getFlag(flagName, options = {}) {
    const operationId = `getFlag_${flagName}_${Date.now()}`;
    
    try {
      this.requestCount++;

      // Try cache first (Requirement 3.3)
      const cachedFlag = this.cache.get(flagName, options.cacheTtlMs);
      if (cachedFlag) {
        console.debug(`Feature flag '${flagName}' retrieved from cache: ${cachedFlag.enabled}`);
        return cachedFlag.enabled;
      }

      // In development or when API is not available, skip remote service calls and use defaults immediately
      const isDevelopment = process.env.NODE_ENV === 'development' || (typeof __DEV__ !== 'undefined' && __DEV__);
      const isWebEnvironment = typeof window !== 'undefined';
      
      // Always use fallback in development or web environment to avoid API calls
      if (isDevelopment || isWebEnvironment) {
        console.debug(`Development/web mode: using default value for flag '${flagName}'`);
        return this.getFallbackValue(flagName);
      }

      // Fallback to default value (Requirement 3.1)
      return this.getFallbackValue(flagName);

    } catch (error) {
      // Handle unexpected errors
      const errorResult = errorHandlerRegistry.handleError(
        error,
        `FEATURE_FLAG_GET_${flagName}`,
        ErrorCategory.API
      );

      console.error(`Error getting feature flag '${flagName}':`, errorResult.userMessage);
      
      // Always fallback on error (Requirement 3.4)
      return this.getFallbackValue(flagName);
    }
  }

  /**
   * Get all feature flags with batch optimization
   * @param {Object} options - Request options
   * @returns {Promise<Object>} All feature flags as key-value pairs
   */
  async getAllFlags(options = {}) {
    try {
      this.requestCount++;

      // Try to get all flags from service
      if (this.serviceHealthy || this.shouldRetryService()) {
        try {
          const remoteFlags = await this.fetchAllFlagsFromService(options);
          if (remoteFlags && remoteFlags.size > 0) {
            // Cache all successful retrievals
            for (const flag of remoteFlags.values()) {
              this.cache.set(flag);
            }
            
            this.serviceHealthy = true;
            this.lastServiceCheck = new Date();
            
            // Convert to simple object
            const result = {};
            for (const [name, flag] of remoteFlags) {
              result[name] = flag.enabled;
            }
            
            console.debug(`Retrieved ${remoteFlags.size} feature flags from service`);
            return result;
          }
        } catch (error) {
          this.handleServiceError(error, 'getAllFlags');
        }
      }

      // Fallback: combine cached and default flags
      return this.getAllFallbackFlags();

    } catch (error) {
      const errorResult = errorHandlerRegistry.handleError(
        error,
        'FEATURE_FLAG_GET_ALL',
        ErrorCategory.API
      );

      console.error('Error getting all feature flags:', errorResult.userMessage);
      
      // Return fallback flags
      return this.getAllFallbackFlags();
    }
  }

  /**
   * Refresh flags from remote service
   * @param {Object} options - Refresh options
   * @returns {Promise<boolean>} Success status
   */
  async refreshFlags(options = {}) {
    try {
      console.info('Refreshing feature flags from service...');
      
      const remoteFlags = await this.fetchAllFlagsFromService(options);
      if (remoteFlags && remoteFlags.size > 0) {
        // Clear cache and repopulate with fresh data
        this.cache.clear();
        
        for (const flag of remoteFlags.values()) {
          this.cache.set(flag);
        }
        
        this.serviceHealthy = true;
        this.lastServiceCheck = new Date();
        
        console.info(`Refreshed ${remoteFlags.size} feature flags`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.handleServiceError(error, 'refreshFlags');
      return false;
    }
  }

  /**
   * Fetch a single flag from remote service
   * @param {string} flagName - Flag name
   * @param {Object} options - Request options
   * @returns {Promise<FeatureFlag|null>} Remote flag or null
   */
  async fetchFlagFromService(flagName, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.apiEndpoint}/${flagName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON (e.g., HTML error page), throw a more specific error
        const text = await response.text();
        throw new Error(`Invalid JSON response from feature flag service: ${text.substring(0, 100)}...`);
      }
      
      if (data && typeof data.enabled === 'boolean') {
        return FeatureFlag.fromApiResponse({
          name: flagName,
          enabled: data.enabled,
          defaultValue: data.defaultValue
        });
      }

      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fetch all flags from remote service
   * @param {Object} options - Request options
   * @returns {Promise<Map<string, FeatureFlag>|null>} Remote flags or null
   */
  async fetchAllFlagsFromService(options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON (e.g., HTML error page), throw a more specific error
        const text = await response.text();
        throw new Error(`Invalid JSON response from feature flag service: ${text.substring(0, 100)}...`);
      }
      
      if (data && Array.isArray(data.flags)) {
        const flagMap = new Map();
        
        for (const flagData of data.flags) {
          if (flagData.name && typeof flagData.enabled === 'boolean') {
            const flag = FeatureFlag.fromApiResponse(flagData);
            flagMap.set(flag.name, flag);
          }
        }
        
        return flagMap;
      }

      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get fallback value for a flag
   * @param {string} flagName - Flag name
   * @returns {boolean} Fallback value
   */
  getFallbackValue(flagName) {
    this.fallbackCount++;
    
    // Try cached value first
    const cachedFlag = this.cache.get(flagName, Infinity); // Ignore TTL for fallback
    if (cachedFlag) {
      console.debug(`Using cached fallback for flag '${flagName}': ${cachedFlag.enabled}`);
      return cachedFlag.enabled;
    }

    // Use default value
    const defaultFlag = this.defaultFlags.get(flagName);
    if (defaultFlag) {
      console.debug(`Using default fallback for flag '${flagName}': ${defaultFlag.enabled}`);
      return defaultFlag.enabled;
    }

    // Ultimate fallback: false (conservative approach)
    console.warn(`No fallback found for flag '${flagName}', using false`);
    return false;
  }

  /**
   * Get all fallback flags (cached + defaults)
   * @returns {Object} All fallback flags
   */
  getAllFallbackFlags() {
    this.fallbackCount++;
    
    const result = {};
    
    // Start with default flags
    for (const [name, flag] of this.defaultFlags) {
      result[name] = flag.enabled;
    }
    
    // Override with cached flags (ignore TTL for fallback)
    for (const [name, flag] of this.cache.getAll()) {
      result[name] = flag.enabled;
    }
    
    console.debug(`Using fallback flags: ${Object.keys(result).length} flags available`);
    return result;
  }

  /**
   * Handle service errors with appropriate logging and health tracking
   * @param {Error} error - Service error
   * @param {string} context - Operation context
   */
  handleServiceError(error, context) {
    this.errorCount++;
    this.serviceHealthy = false;
    this.lastServiceCheck = new Date();

    const errorResult = errorHandlerRegistry.handleError(
      error,
      `FEATURE_FLAG_SERVICE_${context}`,
      ErrorCategory.API
    );

    console.warn(`Feature flag service error (${context}):`, errorResult.userMessage);
    
    // Log specific error types for monitoring
    if (error.name === 'AbortError') {
      console.warn('Feature flag service request timed out');
    } else if (error.message.includes('Failed to fetch')) {
      console.warn('Feature flag service unreachable');
    } else if (error.message.includes('429')) {
      console.warn('Feature flag service rate limited');
    }
  }

  /**
   * Check if we should retry the service after it was marked unhealthy
   * @returns {boolean} True if should retry
   */
  shouldRetryService() {
    if (!this.lastServiceCheck) {
      return true;
    }

    const timeSinceLastCheck = Date.now() - this.lastServiceCheck.getTime();
    return timeSinceLastCheck > this.serviceCheckInterval;
  }

  /**
   * Start periodic cache cleanup
   */
  startCacheCleanup() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const clearedCount = this.cache.clearExpired();
      if (clearedCount > 0) {
        console.debug(`Cleared ${clearedCount} expired feature flags from cache`);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get manager statistics and health information
   * @returns {Object} Manager statistics
   */
  getStats() {
    return {
      serviceHealthy: this.serviceHealthy,
      lastServiceCheck: this.lastServiceCheck,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      fallbackCount: this.fallbackCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0,
      fallbackRate: this.requestCount > 0 ? (this.fallbackCount / this.requestCount) : 0,
      cache: this.cache.getStats(),
      defaultFlagsCount: this.defaultFlags.size,
      configuration: {
        apiEndpoint: this.apiEndpoint,
        requestTimeout: this.requestTimeout,
        retryAttempts: this.retryAttempts,
        serviceCheckInterval: this.serviceCheckInterval
      }
    };
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.fallbackCount = 0;
    this.cache.clear();
  }

  /**
   * Manually set service health status
   * @param {boolean} healthy - Service health status
   */
  setServiceHealth(healthy) {
    this.serviceHealthy = healthy;
    this.lastServiceCheck = new Date();
    console.info(`Feature flag service health set to: ${healthy}`);
  }

  /**
   * Check if a flag exists in any source (cache, defaults)
   * @param {string} flagName - Flag name to check
   * @returns {boolean} True if flag exists
   */
  hasFlag(flagName) {
    return this.cache.get(flagName, Infinity) !== null || this.defaultFlags.has(flagName);
  }

  /**
   * Get flag source information
   * @param {string} flagName - Flag name
   * @returns {string|null} Flag source or null if not found
   */
  getFlagSource(flagName) {
    const cachedFlag = this.cache.get(flagName);
    if (cachedFlag) {
      return cachedFlag.source;
    }

    if (this.defaultFlags.has(flagName)) {
      return 'default';
    }

    return null;
  }
}

// Create and export singleton instance with default flags
export const featureFlagManager = new FeatureFlagManager();

// Set default feature flags for graceful fallback
featureFlagManager.setDefaultFlags({
  password_validation_hibp: true, // Enable HIBP validation by default
  oauth_google_enabled: true,
  oauth_github_enabled: true,
  enhanced_password_validation: true,
  real_time_validation: true
});

export default featureFlagManager;