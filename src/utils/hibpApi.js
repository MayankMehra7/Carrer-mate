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
    
    // Enhanced timeout and retry configuration for better resilience
    this.timeout = 8000; // 8-second timeout for HIBP API requests (increased for resilience)
    this.retryAttempts = 5; // Increased retry attempts for better resilience
    this.baseRetryDelay = 1000; // Base delay for exponential backoff
    this.maxRetryDelay = 16000; // Maximum delay between retries (increased)
    this.adaptiveTimeout = true; // Enable adaptive timeout based on network conditions
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Minimum 100ms between requests
    
    // Enhanced caching with longer expiry for better resilience
    this.cache = new Map();
    this.cacheMaxSize = 500; // Significantly increased cache size for better resilience
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes cache expiry for better resilience
    this.negativeCacheExpiry = 10 * 60 * 1000; // 10 minutes for failed requests
    this.negativeCache = new Map(); // Cache for failed requests to avoid repeated failures
    
    // Persistent cache for critical fallback scenarios
    this.persistentCache = new Map(); // Long-term cache for successful HIBP results
    this.persistentCacheExpiry = 24 * 60 * 60 * 1000; // 24 hours for persistent cache
    this.persistentCacheMaxSize = 1000; // Larger persistent cache
    
    // Request cancellation tracking
    this.activeRequests = new Map();
    this.requestIdCounter = 0;
    
    // Circuit breaker pattern for service resilience
    this.circuitBreaker = {
      failureCount: 0,
      failureThreshold: 5, // Open circuit after 5 consecutive failures
      resetTimeout: 30000, // 30 seconds before attempting to close circuit
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailureTime: 0
    };
    
    // Performance monitoring
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cancelledRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      circuitBreakerTrips: 0,
      fallbackActivations: 0
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
   * Calculates exponential backoff delay for retry attempts with enhanced jitter
   * @private
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  _calculateBackoffDelay(attempt) {
    const exponentialDelay = this.baseRetryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.2 * exponentialDelay; // Increased jitter to 20%
    const adaptiveMultiplier = this.circuitBreaker.failureCount > 0 ? 1.5 : 1; // Slower retry if failures
    return Math.min((exponentialDelay + jitter) * adaptiveMultiplier, this.maxRetryDelay);
  }

  /**
   * Calculates adaptive timeout based on recent performance
   * @private
   * @returns {number} Timeout in milliseconds
   */
  _getAdaptiveTimeout() {
    if (!this.adaptiveTimeout || this.metrics.responseTimes.length === 0) {
      return this.timeout;
    }
    
    // Calculate 95th percentile of recent response times
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95Time = sortedTimes[p95Index] || this.timeout;
    
    // Adaptive timeout is 2x the 95th percentile, but within bounds
    const adaptiveTimeout = Math.max(
      Math.min(p95Time * 2, this.timeout * 2), // Max 2x base timeout
      this.timeout * 0.5 // Min 0.5x base timeout
    );
    
    return adaptiveTimeout;
  }

  /**
   * Checks and updates circuit breaker state
   * @private
   * @returns {boolean} True if circuit is closed (requests allowed)
   */
  _checkCircuitBreaker() {
    const now = Date.now();
    
    switch (this.circuitBreaker.state) {
      case 'OPEN':
        // Check if enough time has passed to try half-open
        if (now - this.circuitBreaker.lastFailureTime >= this.circuitBreaker.resetTimeout) {
          this.circuitBreaker.state = 'HALF_OPEN';
          console.info('HIBP Circuit breaker moving to HALF_OPEN state');
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
      case 'CLOSED':
        return true;
        
      default:
        return true;
    }
  }

  /**
   * Records success for circuit breaker
   * @private
   */
  _recordCircuitBreakerSuccess() {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failureCount = 0;
      console.info('HIBP Circuit breaker closed - service recovered');
    } else if (this.circuitBreaker.state === 'CLOSED') {
      this.circuitBreaker.failureCount = 0;
    }
  }

  /**
   * Records failure for circuit breaker
   * @private
   */
  _recordCircuitBreakerFailure() {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.metrics.circuitBreakerTrips++;
      console.warn(`HIBP Circuit breaker opened after ${this.circuitBreaker.failureCount} failures`);
    }
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
    
    // Clean up regular cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
    
    // Clean up persistent cache
    for (const [key, entry] of this.persistentCache.entries()) {
      if (now - entry.timestamp > this.persistentCacheExpiry) {
        this.persistentCache.delete(key);
      }
    }
  }

  /**
   * Gets cached result for a password hash prefix with fallback to persistent cache
   * @private
   * @param {string} prefix - The SHA-1 prefix
   * @returns {Object|null} Cached result or null if not found/expired
   */
  _getCachedResult(prefix) {
    const now = Date.now();
    
    // Check regular cache first
    const entry = this.cache.get(prefix);
    if (entry && (now - entry.timestamp <= this.cacheExpiry)) {
      this.metrics.cacheHits++;
      return entry.data;
    }
    
    // If regular cache miss/expired, check persistent cache
    const persistentEntry = this.persistentCache.get(prefix);
    if (persistentEntry && (now - persistentEntry.timestamp <= this.persistentCacheExpiry)) {
      this.metrics.cacheHits++;
      // Promote to regular cache for faster access
      this._cacheResult(prefix, persistentEntry.data);
      return persistentEntry.data;
    }
    
    // Clean up expired entries
    if (entry && (now - entry.timestamp > this.cacheExpiry)) {
      this.cache.delete(prefix);
    }
    if (persistentEntry && (now - persistentEntry.timestamp > this.persistentCacheExpiry)) {
      this.persistentCache.delete(prefix);
    }
    
    this.metrics.cacheMisses++;
    return null;
  }

  /**
   * Checks if a prefix is in the negative cache (recent failure)
   * @private
   * @param {string} prefix - The SHA-1 prefix
   * @returns {boolean} True if recently failed and should not retry
   */
  _isNegativelyCached(prefix) {
    const entry = this.negativeCache.get(prefix);
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > this.negativeCacheExpiry) {
      this.negativeCache.delete(prefix);
      return false;
    }
    
    return true;
  }

  /**
   * Adds a prefix to the negative cache
   * @private
   * @param {string} prefix - The SHA-1 prefix that failed
   * @param {string} errorType - Type of error that occurred
   */
  _addToNegativeCache(prefix, errorType) {
    // Don't cache certain types of errors that might be transient
    if (errorType === HIBPErrorTypes.TIMEOUT_ERROR || 
        errorType === HIBPErrorTypes.NETWORK_ERROR) {
      return;
    }
    
    this.negativeCache.set(prefix, {
      timestamp: Date.now(),
      errorType
    });
    
    // Clean up negative cache if it gets too large
    if (this.negativeCache.size > 50) {
      const oldestKey = this.negativeCache.keys().next().value;
      this.negativeCache.delete(oldestKey);
    }
  }

  /**
   * Caches HIBP API response for future use in both regular and persistent cache
   * @private
   * @param {string} prefix - The SHA-1 prefix
   * @param {string} data - The API response data
   */
  _cacheResult(prefix, data) {
    const timestamp = Date.now();
    
    // Clean up regular cache if it's getting too large
    if (this.cache.size >= this.cacheMaxSize) {
      this._cleanupCache();
      
      // If still too large, remove oldest entries
      if (this.cache.size >= this.cacheMaxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    }
    
    // Store in regular cache
    this.cache.set(prefix, {
      data,
      timestamp
    });
    
    // Also store in persistent cache for long-term resilience
    this._cachePersistentResult(prefix, data, timestamp);
  }

  /**
   * Stores result in persistent cache for long-term resilience
   * @private
   * @param {string} prefix - The SHA-1 prefix
   * @param {string} data - The API response data
   * @param {number} timestamp - Timestamp of the result
   */
  _cachePersistentResult(prefix, data, timestamp) {
    // Clean up persistent cache if it's getting too large
    if (this.persistentCache.size >= this.persistentCacheMaxSize) {
      // Remove oldest entries from persistent cache
      const entriesToRemove = Math.floor(this.persistentCacheMaxSize * 0.1); // Remove 10%
      const sortedEntries = Array.from(this.persistentCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
        this.persistentCache.delete(sortedEntries[i][0]);
      }
    }
    
    this.persistentCache.set(prefix, {
      data,
      timestamp
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

      // Create AbortController for request cancellation with adaptive timeout
      const controller = new AbortController();
      const adaptiveTimeout = this._getAdaptiveTimeout();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, adaptiveTimeout);

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
   * Checks if a password has been compromised using HIBP API with enhanced fallback mechanisms
   * @param {string} password - The password to check
   * @returns {Promise<{isCompromised: boolean, requestId: number, usedFallback: boolean}>} Result with compromise status and fallback info
   * @throws {HIBPError} If API request fails after all retries and fallback is not available
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

      // Check circuit breaker state
      if (!this._checkCircuitBreaker()) {
        console.info('HIBP Circuit breaker is OPEN - using local fallback validation');
        this.metrics.fallbackActivations++;
        return this._performLocalFallbackValidation(password, requestId);
      }

      // Check negative cache to avoid repeated failures
      if (this._isNegativelyCached(prefix)) {
        console.info('HIBP prefix in negative cache - using local fallback validation');
        this.metrics.fallbackActivations++;
        return this._performLocalFallbackValidation(password, requestId);
      }

      let lastError = null;
      
      // Enhanced retry logic with exponential backoff
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
          
          // Record success for circuit breaker
          this._recordCircuitBreakerSuccess();
          
          // Requirement 5.4: Log successful check without exposing sensitive information
          const logMessage = `HIBP check completed for password hash prefix: ${prefix}`;
          auditPasswordLogging(logMessage, 'HIBPChecker.checkPassword');
          console.debug(logMessage);
          
          return { isCompromised, requestId, usedFallback: false };
          
        } catch (error) {
          lastError = error;
          
          // Record failure for circuit breaker
          this._recordCircuitBreakerFailure();
          
          // Don't retry for certain error types
          if (error instanceof HIBPError && 
              (error.type === HIBPErrorTypes.RATE_LIMIT_ERROR || 
               error.type === HIBPErrorTypes.PARSE_ERROR)) {
            // Add to negative cache for rate limits and parse errors
            this._addToNegativeCache(prefix, error.type);
            break;
          }
          
          // Wait before retry with exponential backoff (except on last attempt)
          if (attempt < this.retryAttempts) {
            const delay = this._calculateBackoffDelay(attempt);
            console.info(`HIBP retry attempt ${attempt + 1} after ${delay}ms delay`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All retries failed - use local fallback validation
      console.warn('HIBP check failed after all retries - using local fallback validation');
      this.metrics.fallbackActivations++;
      this._addToNegativeCache(prefix, lastError?.type || HIBPErrorTypes.UNKNOWN_ERROR);
      
      return this._performLocalFallbackValidation(password, requestId);
      
    } catch (error) {
      // Clean up request tracking
      this.activeRequests.delete(requestId);
      
      // Requirement 3.4: Log warning but allow graceful degradation
      // Requirement 5.4: Proper error logging without exposing sensitive information
      if (error instanceof HIBPError) {
        const logMessage = `HIBP check failed (${error.type}): ${error.message}`;
        auditPasswordLogging(logMessage, 'HIBPChecker.checkPassword.error');
        console.warn(logMessage);
        
        // Try local fallback validation as last resort
        console.info('Attempting local fallback validation after HIBP failure');
        this.metrics.fallbackActivations++;
        return this._performLocalFallbackValidation(password, requestId);
      } else {
        const logMessage = `HIBP check failed with unexpected error: ${error.message}`;
        auditPasswordLogging(logMessage, 'HIBPChecker.checkPassword.error');
        console.warn(logMessage);
        
        // Try local fallback validation as last resort
        console.info('Attempting local fallback validation after unexpected error');
        this.metrics.fallbackActivations++;
        return this._performLocalFallbackValidation(password, requestId);
      }
    }
  }

  /**
   * Performs enhanced local fallback validation when HIBP service is unavailable
   * Implements comprehensive password security rules as fallback mechanism
   * @private
   * @param {string} password - The password to validate locally
   * @param {number} requestId - Request ID for tracking
   * @returns {Object} Fallback validation result
   */
  _performLocalFallbackValidation(password, requestId) {
    // Enhanced local validation rules for when HIBP is unavailable
    const commonPatterns = [
      // Very common passwords that should be rejected
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^letmein/i,
      /^welcome/i,
      /^monkey/i,
      /^dragon/i,
      /^master/i,
      /^shadow/i,
      /^superman/i,
      /^michael/i,
      /^football/i,
      /^baseball/i,
      /^basketball/i,
      /^princess/i,
      /^trustno1/i,
      /^sunshine/i,
      /^iloveyou/i,
      /^charlie/i,
      /^robert/i,
      /^thomas/i,
      /^jordan/i,
      /^hunter/i,
      /^daniel/i,
      /^andrew/i,
      /^andrea/i,
      /^joshua/i,
      /^matthew/i,
      /^anthony/i,
      /^william/i,
      /^david/i,
      /^james/i,
      /^nicole/i,
      /^jessica/i,
      /^michelle/i,
      /^jennifer/i,
      /^amanda/i,
      /^melissa/i,
      /^sarah/i,
      /^heather/i,
      /^nicole/i,
      
      // Sequential patterns
      /^(abc|def|ghi|jkl|mno|pqr|stu|vwx|xyz)/i,
      /^(012|123|234|345|456|567|678|789|890)/,
      /^(987|876|765|654|543|432|321|210)/,
      
      // Keyboard patterns (enhanced)
      /^(qwe|asd|zxc|wer|sdf|xcv|ert|dfg|cvb|rty|fgh|vbn|tyu|ghj|bnm)/i,
      /^(poi|lkj|mnb|oiu|kjh|nbv|iuy|jhg|vcx|uyt|hgf|cxz)/i,
      /^(qaz|wsx|edc|rfv|tgb|yhn|ujm|ik)/i,
      
      // Repeated characters (more than 2 in a row for better security)
      /(.)\1{2,}/,
      
      // Simple substitutions that are still weak
      /^p@ssw0rd/i,
      /^passw0rd/i,
      /^p@ssword/i,
      /^1234567/,
      /^abcdef/i,
      /^@dmin/i,
      /^@dministrator/i,
      /^l3tm31n/i,
      /^w3lc0m3/i,
      /^m0nk3y/i,
      /^dr@g0n/i,
      /^m@st3r/i,
      /^sh@d0w/i,
      /^sup3rm@n/i,
      /^f00tb@ll/i,
      /^b@s3b@ll/i,
      /^b@sk3tb@ll/i,
      
      // Date patterns (years, months, days)
      /19\d{2}|20\d{2}/,
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /^(mon|tue|wed|thu|fri|sat|sun)/i,
      
      // Company/brand names
      /^(google|facebook|twitter|instagram|linkedin|microsoft|apple|amazon|netflix|spotify)/i,
      /^(gmail|yahoo|hotmail|outlook|aol)/i,
      
      // Simple number sequences
      /^0+$/,
      /^1+$/,
      /^(01|10|11|00)+$/,
      
      // Phone number patterns
      /^\d{3}-?\d{3}-?\d{4}$/,
      /^\(\d{3}\)\s?\d{3}-?\d{4}$/,
      
      // Simple words with numbers at end
      /^(love|hate|like|cool|nice|good|best|test|user|guest|temp|demo)\d*$/i
    ];
    
    // Check against common patterns
    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    
    // Enhanced entropy analysis
    const uniqueChars = new Set(password.toLowerCase()).size;
    const entropyRatio = uniqueChars / password.length;
    const hasLowEntropy = entropyRatio < 0.5; // Increased threshold for better security
    
    // Character set diversity analysis
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const charSetCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    const hasInsufficientCharSets = charSetCount < 3;
    
    // Dictionary word detection (basic)
    const commonWords = [
      'password', 'admin', 'user', 'guest', 'test', 'demo', 'temp', 'login', 'access',
      'secret', 'private', 'public', 'system', 'server', 'database', 'backup', 'config',
      'default', 'root', 'super', 'power', 'master', 'chief', 'manager', 'director',
      'company', 'business', 'office', 'work', 'home', 'family', 'friend', 'love',
      'money', 'cash', 'bank', 'credit', 'card', 'account', 'number', 'phone', 'email',
      'address', 'street', 'city', 'state', 'country', 'world', 'earth', 'space',
      'time', 'date', 'year', 'month', 'week', 'day', 'hour', 'minute', 'second',
      'first', 'last', 'middle', 'initial', 'name', 'title', 'position', 'job',
      'career', 'professional', 'personal', 'social', 'network', 'internet', 'web',
      'site', 'page', 'link', 'click', 'button', 'menu', 'option', 'setting'
    ];
    
    const lowerPassword = password.toLowerCase();
    const containsCommonWord = commonWords.some(word => 
      lowerPassword.includes(word) && word.length >= 4
    );
    
    // Keyboard walk detection (enhanced)
    const keyboardWalks = [
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz',
      '1234567890', '0987654321',
      'qazwsxedc', 'rfvtgbyhn', 'ujmik',
      'plokijuhygtfrdeswaq', 'mnbvcxzasdfghjklpoiuytrewq'
    ];
    
    const hasKeyboardWalk = keyboardWalks.some(walk => {
      for (let i = 0; i <= walk.length - 4; i++) {
        const segment = walk.substring(i, i + 4);
        if (lowerPassword.includes(segment)) {
          return true;
        }
      }
      return false;
    });
    
    // Repetitive pattern detection
    const hasRepetitivePattern = /^(.{1,3})\1{2,}$/.test(password);
    
    // Length-based security assessment
    const isTooShort = password.length < 12;
    const isVeryShort = password.length < 8;
    
    // Calculate overall security score
    let securityScore = 0;
    
    // Positive factors
    if (password.length >= 12) securityScore += 2;
    if (password.length >= 16) securityScore += 1;
    if (charSetCount >= 3) securityScore += 2;
    if (charSetCount === 4) securityScore += 1;
    if (entropyRatio >= 0.6) securityScore += 2;
    if (!hasKeyboardWalk) securityScore += 1;
    if (!hasRepetitivePattern) securityScore += 1;
    
    // Negative factors
    if (hasCommonPattern) securityScore -= 5;
    if (containsCommonWord) securityScore -= 3;
    if (hasLowEntropy) securityScore -= 2;
    if (hasInsufficientCharSets) securityScore -= 2;
    if (hasKeyboardWalk) securityScore -= 2;
    if (hasRepetitivePattern) securityScore -= 3;
    if (isVeryShort) securityScore -= 4;
    if (isTooShort) securityScore -= 2;
    
    // Determine if password should be considered compromised
    const isCompromised = securityScore < 3 || hasCommonPattern || isVeryShort;
    
    // Determine primary reason for rejection/acceptance
    let fallbackReason = 'passed_local_checks';
    if (hasCommonPattern) {
      fallbackReason = 'common_pattern';
    } else if (isVeryShort) {
      fallbackReason = 'too_short';
    } else if (containsCommonWord) {
      fallbackReason = 'common_word';
    } else if (hasKeyboardWalk) {
      fallbackReason = 'keyboard_pattern';
    } else if (hasRepetitivePattern) {
      fallbackReason = 'repetitive_pattern';
    } else if (hasLowEntropy) {
      fallbackReason = 'low_entropy';
    } else if (hasInsufficientCharSets) {
      fallbackReason = 'insufficient_character_sets';
    }
    
    console.info(`Enhanced local fallback validation: ${isCompromised ? 'REJECTED' : 'ACCEPTED'} ` +
                `(score: ${securityScore}, entropy: ${entropyRatio.toFixed(2)}, ` +
                `charSets: ${charSetCount}, reason: ${fallbackReason})`);
    
    return {
      isCompromised,
      requestId,
      usedFallback: true,
      fallbackReason,
      securityScore,
      entropyRatio,
      charSetCount,
      validationDetails: {
        hasCommonPattern,
        containsCommonWord,
        hasKeyboardWalk,
        hasRepetitivePattern,
        hasLowEntropy,
        hasInsufficientCharSets,
        isTooShort,
        isVeryShort
      }
    };
  }

  /**
   * Gets performance metrics for monitoring
   * @returns {Object} Performance metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      persistentCacheSize: this.persistentCache.size,
      negativeCacheSize: this.negativeCache.size,
      activeRequests: this.activeRequests.size,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failureCount,
      cacheHitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 
        : 0,
      failureRate: this.metrics.totalRequests > 0 
        ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
        : 0,
      fallbackRate: this.metrics.totalRequests > 0 
        ? (this.metrics.fallbackActivations / this.metrics.totalRequests) * 100 
        : 0,
      totalCacheSize: this.cache.size + this.persistentCache.size
    };
  }

  /**
   * Clears all cached results and resets metrics
   * @param {boolean} includePersistent - Whether to clear persistent cache as well
   */
  clearCache(includePersistent = false) {
    this.cache.clear();
    this.negativeCache.clear();
    
    if (includePersistent) {
      this.persistentCache.clear();
    }
    
    // Reset circuit breaker
    this.circuitBreaker = {
      failureCount: 0,
      failureThreshold: 5,
      resetTimeout: 30000,
      state: 'CLOSED',
      lastFailureTime: 0
    };
    
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cancelledRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      circuitBreakerTrips: 0,
      fallbackActivations: 0
    };
  }

  /**
   * Manually resets the circuit breaker to closed state
   */
  resetCircuitBreaker() {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = 0;
    console.info('HIBP Circuit breaker manually reset to CLOSED state');
  }

  /**
   * Clears only the negative cache (allows retry of previously failed requests)
   */
  clearNegativeCache() {
    this.negativeCache.clear();
    console.info('HIBP Negative cache cleared - failed requests can be retried');
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