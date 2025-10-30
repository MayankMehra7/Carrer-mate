/**
 * Have I Been Pwned (HIBP) API integration utility
 * Implements k-anonymity password checking per requirements
 */

import CryptoJS from 'crypto-js';

// Security audit functions - using no-op functions for React Native compatibility
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const auditHTTPSEnforcement = (url, context) => {
  // In development, we can add console warnings
  if (isDevelopment && url && !url.startsWith('https://') && !url.includes('localhost')) {
    console.warn(`Security Warning: Non-HTTPS URL detected: ${url} (Context: ${context})`);
  }
  return false;
};

const auditPasswordLogging = (message, context) => {
  // In development, we can add console warnings for password patterns
  if (isDevelopment && message) {
    const passwordPatterns = [
      /password\s*[:=]\s*['"]\w+['"]/i,
      /pwd\s*[:=]\s*['"]\w+['"]/i,
      /"password"\s*:\s*"[^"]+"/i
    ];
    
    for (const pattern of passwordPatterns) {
      if (pattern.test(message)) {
        console.warn(`Security Warning: Potential password logging detected (Context: ${context})`);
        return true;
      }
    }
  }
  return false;
};

/**
 * Error types for HIBP API failures
 */
export const HIBPErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Custom error class for HIBP API errors
 */
export class HIBPError extends Error {
  constructor(message, type = HIBPErrorTypes.UNKNOWN_ERROR, originalError = null) {
    super(message);
    this.name = 'HIBPError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * HIBPChecker class for checking passwords against the HIBP database
 * Uses k-anonymity to protect user privacy with comprehensive error handling
 * Includes performance optimizations: caching, request cancellation, and monitoring
 */
export class HIBPChecker {
  constructor() {
    this.baseUrl = 'https://api.pwnedpasswords.com/range/';
    
    // Requirement 5.4: Verify HTTPS enforcement for all API communications
    auditHTTPSEnforcement(this.baseUrl, 'HIBPChecker constructor');
    
    // Requirement 3.5: 5-second timeout for HIBP API requests
    this.timeout = 5000;
    this.retryAttempts = 2;
    this.retryDelay = 1000; // 1 second between retries
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Minimum 100ms between requests
    
    // Performance optimization: HIBP result caching
    this.cache = new Map();
    this.cacheMaxSize = 100; // Maximum cached results
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache expiry
    
    // Request cancellation tracking
    this.activeRequests = new Map();
    this.requestIdCounter = 0;
    
    // Performance monitoring
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cancelledRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  /**
   * Implements rate limiting to prevent API abuse
   * @private
   */
  async _enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Determines the error type based on the error object
   * @private
   * @param {Error} error - The error to categorize
   * @returns {string} The error type
   */
  _categorizeError(error) {
    if (error.name === 'AbortError') {
      return HIBPErrorTypes.TIMEOUT_ERROR;
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return HIBPErrorTypes.NETWORK_ERROR;
    }
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return HIBPErrorTypes.RATE_LIMIT_ERROR;
    }
    
    if (error.message.includes('HIBP API error')) {
      return HIBPErrorTypes.API_ERROR;
    }
    
    return HIBPErrorTypes.UNKNOWN_ERROR;
  }

  /**
   * Cleans up expired cache entries to prevent memory leaks
   * @private
   */
  _cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets cached result for a password hash prefix
   * @private
   * @param {string} prefix - The SHA-1 prefix
   * @returns {Object|null} Cached result or null if not found/expired
   */
  _getCachedResult(prefix) {
    const entry = this.cache.get(prefix);
    if (!entry) {
      this.metrics.cacheMisses++;
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(prefix);
      this.metrics.cacheMisses++;
      return null;
    }
    
    this.metrics.cacheHits++;
    return entry.data;
  }

  /**
   * Caches HIBP API response for future use
   * @private
   * @param {string} prefix - The SHA-1 prefix
   * @param {string} data - The API response data
   */
  _cacheResult(prefix, data) {
    // Clean up cache if it's getting too large
    if (this.cache.size >= this.cacheMaxSize) {
      this._cleanupCache();
      
      // If still too large, remove oldest entries
      if (this.cache.size >= this.cacheMaxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(prefix, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generates unique request ID for cancellation tracking
   * @private
   * @returns {number} Unique request ID
   */
  _generateRequestId() {
    return ++this.requestIdCounter;
  }

  /**
   * Records performance metrics for monitoring
   * @private
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} wasSuccessful - Whether the request was successful
   */
  _recordMetrics(responseTime, wasSuccessful = true) {
    this.metrics.totalRequests++;
    
    if (!wasSuccessful) {
      this.metrics.failedRequests++;
    }
    
    // Track response times for average calculation
    this.metrics.responseTimes.push(responseTime);
    
    // Keep only last 100 response times to prevent memory growth
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Calculate rolling average
    this.metrics.averageResponseTime = 
      this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / 
      this.metrics.responseTimes.length;
  }

  /**
   * Performs a single HIBP API request with comprehensive error handling and caching
   * @private
   * @param {string} prefix - The SHA-1 prefix to query
   * @param {number} requestId - Unique request ID for cancellation tracking
   * @returns {Promise<string>} The API response text
   */
  async _makeRequest(prefix, requestId) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cachedResult = this._getCachedResult(prefix);
      if (cachedResult) {
        this._recordMetrics(Date.now() - startTime);
        return cachedResult;
      }

      // Requirement 3.5: Enforce rate limiting
      await this._enforceRateLimit();

      // Check if request was cancelled before making network call
      if (!this.activeRequests.has(requestId)) {
        this.metrics.cancelledRequests++;
        throw new HIBPError('Request was cancelled', HIBPErrorTypes.TIMEOUT_ERROR);
      }

      // Create AbortController for request cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      // Store controller for potential cancellation
      if (this.activeRequests.has(requestId)) {
        this.activeRequests.set(requestId, controller);
      }

      // Query HIBP API with k-anonymity for privacy protection
      const response = await fetch(`${this.baseUrl}${prefix}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CareerMate-App-Password-Checker',
          'Accept': 'text/plain'
        }
      });

      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (response.status === 429) {
        throw new HIBPError(
          'Rate limit exceeded. Please try again later.',
          HIBPErrorTypes.RATE_LIMIT_ERROR
        );
      }

      if (response.status === 503) {
        throw new HIBPError(
          'HIBP service temporarily unavailable.',
          HIBPErrorTypes.API_ERROR
        );
      }

      if (!response.ok) {
        throw new HIBPError(
          `HIBP API error: ${response.status} ${response.statusText}`,
          HIBPErrorTypes.API_ERROR
        );
      }

      const data = await response.text();
      
      if (!data || typeof data !== 'string') {
        throw new HIBPError(
          'Invalid response format from HIBP API',
          HIBPErrorTypes.PARSE_ERROR
        );
      }

      // Cache successful result
      this._cacheResult(prefix, data);
      
      // Record successful metrics
      this._recordMetrics(Date.now() - startTime, true);

      return data;
      
    } catch (error) {
      // Record failed metrics
      this._recordMetrics(Date.now() - startTime, false);
      
      // Re-throw HIBPError instances as-is
      if (error instanceof HIBPError) {
        throw error;
      }
      
      // Categorize and wrap other errors
      const errorType = this._categorizeError(error);
      let message = 'HIBP API request failed';
      
      switch (errorType) {
        case HIBPErrorTypes.TIMEOUT_ERROR:
          message = 'Request timed out. Please check your internet connection.';
          break;
        case HIBPErrorTypes.NETWORK_ERROR:
          message = 'Network error. Please check your internet connection.';
          break;
        default:
          message = `Unexpected error: ${error.message}`;
      }
      
      throw new HIBPError(message, errorType, error);
    } finally {
      // Clean up request tracking
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Cancels an active HIBP request by request ID
   * @param {number} requestId - The request ID to cancel
   * @returns {boolean} True if request was cancelled, false if not found
   */
  cancelRequest(requestId) {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      this.metrics.cancelledRequests++;
      return true;
    }
    return false;
  }

  /**
   * Cancels all active HIBP requests
   * @returns {number} Number of requests cancelled
   */
  cancelAllRequests() {
    let cancelledCount = 0;
    for (const [requestId, controller] of this.activeRequests.entries()) {
      controller.abort();
      this.activeRequests.delete(requestId);
      cancelledCount++;
    }
    this.metrics.cancelledRequests += cancelledCount;
    return cancelledCount;
  }

  /**
   * Checks if a password has been compromised using HIBP API with retry logic and performance optimizations
   * @param {string} password - The password to check
   * @returns {Promise<{isCompromised: boolean, requestId: number}>} Result with compromise status and request ID
   * @throws {HIBPError} If API request fails after all retries
   */
  async checkPassword(password) {
    // Input validation
    if (!password || typeof password !== 'string') {
      throw new HIBPError('Invalid password provided', HIBPErrorTypes.UNKNOWN_ERROR);
    }

    const requestId = this._generateRequestId();
    this.activeRequests.set(requestId, null); // Placeholder until AbortController is created

    try {
      // Requirement 3.3: Use SHA-1 hashing with k-anonymity (first 5 characters)
      const sha1Hash = CryptoJS.SHA1(password).toString().toUpperCase();
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      let lastError = null;
      
      // Retry logic for transient failures
      for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
        try {
          // Check if request was cancelled
          if (!this.activeRequests.has(requestId)) {
            throw new HIBPError('Request was cancelled', HIBPErrorTypes.TIMEOUT_ERROR);
          }

          const data = await this._makeRequest(prefix, requestId);
          
          // Parse response and check if our suffix appears
          const hashes = data.split('\n');
          
          // Check if our suffix appears in the response
          const isCompromised = hashes.some(line => {
            const [hashSuffix] = line.split(':');
            return hashSuffix && hashSuffix.trim() === suffix;
          });
          
          // Requirement 5.4: Log successful check without exposing sensitive information
          const logMessage = `HIBP check completed for password hash prefix: ${prefix}`;
          auditPasswordLogging(logMessage, 'HIBPChecker.checkPassword');
          console.debug(logMessage);
          
          return { isCompromised, requestId };
          
        } catch (error) {
          lastError = error;
          
          // Don't retry for certain error types
          if (error instanceof HIBPError && 
              (error.type === HIBPErrorTypes.RATE_LIMIT_ERROR || 
               error.type === HIBPErrorTypes.PARSE_ERROR ||
               error.type === HIBPErrorTypes.TIMEOUT_ERROR)) {
            break;
          }
          
          // Wait before retry (except on last attempt)
          if (attempt < this.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          }
        }
      }
      
      // All retries failed
      throw lastError;
      
    } catch (error) {
      // Clean up request tracking
      this.activeRequests.delete(requestId);
      
      // Requirement 3.4: Log warning but allow graceful degradation
      // Requirement 5.4: Proper error logging without exposing sensitive information
      if (error instanceof HIBPError) {
        const logMessage = `HIBP check failed (${error.type}): ${error.message}`;
        auditPasswordLogging(logMessage, 'HIBPChecker.checkPassword.error');
        console.warn(logMessage);
        throw error;
      } else {
        const logMessage = `HIBP check failed with unexpected error: ${error.message}`;
        auditPasswordLogging(logMessage, 'HIBPChecker.checkPassword.error');
        console.warn(logMessage);
        throw new HIBPError(
          'Unexpected error during password check',
          HIBPErrorTypes.UNKNOWN_ERROR,
          error
        );
      }
    }
  }

  /**
   * Gets performance metrics for monitoring
   * @returns {Object} Performance metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      cacheHitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 
        : 0,
      failureRate: this.metrics.totalRequests > 0 
        ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
        : 0
    };
  }

  /**
   * Clears all cached results and resets metrics
   */
  clearCache() {
    this.cache.clear();
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cancelledRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  /**
   * Validates that a password is suitable for HIBP checking
   * @param {string} password - The password to validate
   * @returns {boolean} True if password should be checked
   */
  shouldCheck(password) {
    return password && typeof password === 'string' && password.length >= 10;
  }
}

/**
 * Singleton instance of HIBPChecker for reuse across the app
 */
export const hibpChecker = new HIBPChecker();

/**
 * Convenience function for checking a single password
 * @param {string} password - The password to check
 * @returns {Promise<boolean>} True if compromised, false if safe
 */
export const checkPasswordCompromised = async (password) => {
  return await hibpChecker.checkPassword(password);
};