/**
 * Performance monitoring utility for password validation operations
 * Tracks validation performance metrics and provides optimization insights
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      validationOperations: {
        total: 0,
        averageTime: 0,
        times: []
      },
      hibpChecks: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0,
        averageTime: 0,
        times: []
      },
      componentRenders: {
        passwordInput: 0,
        passwordRequirements: 0,
        totalRenders: 0
      },
      memoryUsage: {
        cacheSize: 0,
        activeRequests: 0
      }
    };
    
    this.maxStoredTimes = 100; // Limit stored times to prevent memory growth
    this.isEnabled = process.env.NODE_ENV === 'development'; // Only enable in development
  }

  /**
   * Records a validation operation performance metric
   * @param {number} duration - Duration in milliseconds
   * @param {string} type - Type of validation operation
   */
  recordValidation(duration, type = 'general') {
    if (!this.isEnabled) return;

    const metrics = this.metrics.validationOperations;
    metrics.total++;
    metrics.times.push(duration);

    // Keep only recent times
    if (metrics.times.length > this.maxStoredTimes) {
      metrics.times.shift();
    }

    // Calculate rolling average
    metrics.averageTime = metrics.times.reduce((sum, time) => sum + time, 0) / metrics.times.length;
  }

  /**
   * Records HIBP check performance metrics
   * @param {number} duration - Duration in milliseconds
   * @param {boolean} wasSuccessful - Whether the check was successful
   * @param {boolean} wasCached - Whether the result was from cache
   */
  recordHIBPCheck(duration, wasSuccessful = true, wasCached = false) {
    if (!this.isEnabled) return;

    const metrics = this.metrics.hibpChecks;
    metrics.total++;
    
    if (wasSuccessful) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }

    if (wasCached) {
      metrics.cached++;
    }

    metrics.times.push(duration);

    // Keep only recent times
    if (metrics.times.length > this.maxStoredTimes) {
      metrics.times.shift();
    }

    // Calculate rolling average
    metrics.averageTime = metrics.times.reduce((sum, time) => sum + time, 0) / metrics.times.length;
  }

  /**
   * Records component render count
   * @param {string} componentName - Name of the component
   */
  recordRender(componentName) {
    if (!this.isEnabled) return;

    const metrics = this.metrics.componentRenders;
    metrics.totalRenders++;

    if (metrics[componentName] !== undefined) {
      metrics[componentName]++;
    }
  }

  /**
   * Updates memory usage metrics
   * @param {Object} memoryInfo - Memory usage information
   */
  updateMemoryUsage(memoryInfo) {
    if (!this.isEnabled) return;

    this.metrics.memoryUsage = {
      ...this.metrics.memoryUsage,
      ...memoryInfo
    };
  }

  /**
   * Gets current performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      hibpChecks: {
        ...this.metrics.hibpChecks,
        successRate: this.metrics.hibpChecks.total > 0 
          ? (this.metrics.hibpChecks.successful / this.metrics.hibpChecks.total) * 100 
          : 0,
        cacheHitRate: this.metrics.hibpChecks.total > 0 
          ? (this.metrics.hibpChecks.cached / this.metrics.hibpChecks.total) * 100 
          : 0
      }
    };
  }

  /**
   * Gets performance summary for debugging
   * @returns {string} Formatted performance summary
   */
  getSummary() {
    const metrics = this.getMetrics();
    
    return `
Performance Summary:
==================
Validation Operations: ${metrics.validationOperations.total} (avg: ${metrics.validationOperations.averageTime.toFixed(2)}ms)
HIBP Checks: ${metrics.hibpChecks.total} (success: ${metrics.hibpChecks.successRate.toFixed(1)}%, cache hit: ${metrics.hibpChecks.cacheHitRate.toFixed(1)}%)
Component Renders: ${metrics.componentRenders.totalRenders}
  - PasswordInput: ${metrics.componentRenders.passwordInput}
  - PasswordRequirements: ${metrics.componentRenders.passwordRequirements}
Memory Usage:
  - Cache Size: ${metrics.memoryUsage.cacheSize}
  - Active Requests: ${metrics.memoryUsage.activeRequests}
    `;
  }

  /**
   * Detects performance issues and provides recommendations
   * @returns {Array} Array of performance recommendations
   */
  getRecommendations() {
    const metrics = this.getMetrics();
    const recommendations = [];

    // Check validation performance
    if (metrics.validationOperations.averageTime > 50) {
      recommendations.push({
        type: 'warning',
        category: 'validation',
        message: 'Validation operations are taking longer than expected (>50ms)',
        suggestion: 'Consider optimizing validation logic or debouncing input'
      });
    }

    // Check HIBP performance
    if (metrics.hibpChecks.averageTime > 2000) {
      recommendations.push({
        type: 'warning',
        category: 'hibp',
        message: 'HIBP checks are taking longer than expected (>2s)',
        suggestion: 'Check network connectivity or increase timeout values'
      });
    }

    // Check cache effectiveness
    if (metrics.hibpChecks.total > 10 && metrics.hibpChecks.cacheHitRate < 20) {
      recommendations.push({
        type: 'info',
        category: 'caching',
        message: 'Low cache hit rate detected',
        suggestion: 'Consider increasing cache size or expiry time'
      });
    }

    // Check render frequency
    const avgRendersPerValidation = metrics.componentRenders.totalRenders / Math.max(metrics.validationOperations.total, 1);
    if (avgRendersPerValidation > 5) {
      recommendations.push({
        type: 'warning',
        category: 'rendering',
        message: 'High render frequency detected',
        suggestion: 'Consider using React.memo or optimizing component dependencies'
      });
    }

    // Check success rate
    if (metrics.hibpChecks.total > 5 && metrics.hibpChecks.successRate < 80) {
      recommendations.push({
        type: 'error',
        category: 'reliability',
        message: 'Low HIBP check success rate',
        suggestion: 'Check network connectivity and API availability'
      });
    }

    return recommendations;
  }

  /**
   * Resets all metrics
   */
  reset() {
    this.metrics = {
      validationOperations: {
        total: 0,
        averageTime: 0,
        times: []
      },
      hibpChecks: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0,
        averageTime: 0,
        times: []
      },
      componentRenders: {
        passwordInput: 0,
        passwordRequirements: 0,
        totalRenders: 0
      },
      memoryUsage: {
        cacheSize: 0,
        activeRequests: 0
      }
    };
  }

  /**
   * Enables or disables performance monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 * @returns {Object} Performance monitoring utilities
 */
export const usePerformanceMonitor = () => {
  return {
    recordValidation: performanceMonitor.recordValidation.bind(performanceMonitor),
    recordHIBPCheck: performanceMonitor.recordHIBPCheck.bind(performanceMonitor),
    recordRender: performanceMonitor.recordRender.bind(performanceMonitor),
    updateMemoryUsage: performanceMonitor.updateMemoryUsage.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    getRecommendations: performanceMonitor.getRecommendations.bind(performanceMonitor),
    reset: performanceMonitor.reset.bind(performanceMonitor)
  };
};

/**
 * Higher-order component for automatic render tracking
 * @param {React.Component} Component - Component to wrap
 * @param {string} componentName - Name for tracking
 * @returns {React.Component} Wrapped component with render tracking
 */
export const withPerformanceTracking = (Component, componentName) => {
  return React.memo((props) => {
    performanceMonitor.recordRender(componentName);
    return <Component {...props} />;
  });
};

export default performanceMonitor;