/**
 * usePasswordValidation hook - Main password validation interface
 * Integrates all validation rules, HIBP checking, and real-time state management
 * Uses static imports for Metro bundler compatibility
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { useCallback, useEffect, useState } from 'react';
// Static imports for Metro bundler compatibility
import { FeatureFlags } from '../config/featureFlags';
import { featureFlagManager } from '../services/FeatureFlagManager';
import { errorHandlerRegistry } from '../utils/ErrorHandlerRegistry';
import { ErrorCategory } from '../utils/errorHandling';
import {
    isPasswordComplexityValid,
    validatePasswordRequirements
} from '../utils/passwordValidation';
import { useDebounce } from './useDebounce';
import { useHIBPCheck } from './useHIBPCheck';
import { usePasswordValidationState } from './usePasswordValidationState';

// Performance monitoring functions - using no-op functions for React Native compatibility
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const usePerformanceMonitor = () => ({
  recordValidation: (duration, type) => {
    if (isDevelopment) {
      console.log(`Performance: ${type} validation took ${duration.toFixed(2)}ms`);
    }
  },
  recordHIBPCheck: (duration, wasSuccessful, wasCached) => {
    if (isDevelopment) {
      console.log(`Performance: HIBP check took ${duration.toFixed(2)}ms (success: ${wasSuccessful}, cached: ${wasCached})`);
    }
  },
  updateMemoryUsage: (memoryInfo) => {
    if (isDevelopment) {
      console.log('Performance: Memory usage updated', memoryInfo);
    }
  }
});

/**
 * Comprehensive password validation hook with real-time feedback
 * @param {string} password - The password to validate
 * @param {string} username - User's username for personal info checking
 * @param {string} email - User's email for personal info checking
 * @returns {Object} Validation state object with requirements, errors, and status
 */
export const usePasswordValidation = (password, username = '', email = '') => {
  // Requirement 4.4: Real-time validation state management using enhanced state hook
  const validationState = usePasswordValidationState();

  // Requirement 3.5: Debounce HIBP checks to minimize API calls (1000ms default)
  const debouncedPassword = useDebounce(password, 1000);
  const hibpCheck = useHIBPCheck();
  
  // Feature flag state for HIBP validation (Requirements: 3.1, 3.2, 3.3, 3.4)
  const [hibpEnabled, setHibpEnabled] = useState(true);
  
  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor();

  // Load HIBP feature flag on component mount
  useEffect(() => {
    const loadHIBPFeatureFlag = async () => {
      try {
        const enabled = await featureFlagManager.getFlag(FeatureFlags.PASSWORD_VALIDATION_HIBP);
        setHibpEnabled(enabled);
        
        if (!enabled) {
          console.info('HIBP password validation disabled by feature flag');
          // Set HIBP as unavailable but don't block validation
          validationState.setHIBPUnavailable();
        }
      } catch (error) {
        console.warn('Could not load HIBP feature flag, defaulting to enabled:', error);
        // Default to enabled if feature flag service is unavailable (Requirements: 3.4)
        setHibpEnabled(true);
      }
    };

    loadHIBPFeatureFlag();
  }, []);

  // Real-time validation for complexity requirements (Requirements 1.1-1.5, 2.1-2.4)
  useEffect(() => {
    const startTime = performance.now();
    
    const requirements = validatePasswordRequirements(password, username, email);
    
    // Preserve HIBP check result from current state
    const currentHIBPResult = validationState.getRequirementStatus('notCompromised');
    const updatedRequirements = {
      ...requirements,
      notCompromised: currentHIBPResult
    };
    
    // Update validation state with current requirements
    validationState.updateRequirements(updatedRequirements, password);
    
    // Record performance metrics
    const duration = performance.now() - startTime;
    performanceMonitor.recordValidation(duration, 'complexity');
  }, [password, username, email]);

  // HIBP check for debounced password - only check when minimum requirements are met and HIBP is enabled
  useEffect(() => {
    // Requirement 3.1: Only perform HIBP check when password meets basic requirements and feature is enabled
    if (hibpEnabled && 
        debouncedPassword && 
        debouncedPassword.length >= 10 && 
        isPasswordComplexityValid(debouncedPassword, username, email)) {
      
      checkPasswordWithHIBP(debouncedPassword);
    } else if (debouncedPassword && debouncedPassword.length < 10) {
      // Reset HIBP status for passwords that don't meet minimum length
      validationState.updateRequirement('notCompromised', null);
      validationState.setHIBPChecking(false);
    } else if (!hibpEnabled && debouncedPassword) {
      // HIBP is disabled by feature flag - mark as unavailable but don't block validation
      validationState.setHIBPUnavailable();
    }
  }, [debouncedPassword, username, email, hibpEnabled]);

  /**
   * Performs HIBP check with enhanced error handling and performance monitoring
   * @param {string} pwd - Password to check
   */
  const checkPasswordWithHIBP = useCallback(async (pwd) => {
    const startTime = performance.now();
    
    // Requirement 4.1: Add loading states for HIBP checks
    validationState.setHIBPChecking(true);
    
    try {
      // Requirement 3.1, 3.2: Check password against HIBP database
      const isCompromised = await hibpCheck.checkPassword(pwd);
      
      // Update HIBP result in state
      validationState.setHIBPResult(isCompromised);
      
      // Record successful HIBP check
      const duration = performance.now() - startTime;
      const metrics = hibpCheck.getPerformanceMetrics();
      const wasCached = metrics && metrics.cacheHits > 0;
      performanceMonitor.recordHIBPCheck(duration, true, wasCached);
      
      // Update memory usage metrics
      if (metrics) {
        performanceMonitor.updateMemoryUsage({
          cacheSize: metrics.cacheSize,
          activeRequests: metrics.activeRequests
        });
      }
      
    } catch (error) {
      // Requirement 3.4, 3.5: Enhanced error handling using centralized registry with static imports
      const errorResult = errorHandlerRegistry.handleError(error, 'HIBP_PASSWORD_CHECK', ErrorCategory.API);
      
      // Set appropriate state based on error handling result
      if (errorResult.shouldFallback) {
        // Graceful fallback - allow password creation to continue
        validationState.setHIBPUnavailable();
        console.info(`HIBP check failed gracefully: ${errorResult.userMessage}`);
      } else {
        // Set error state for user feedback
        validationState.setHIBPError(errorResult.userMessage);
      }
      
      // Record failed HIBP check with error context
      const duration = performance.now() - startTime;
      performanceMonitor.recordHIBPCheck(duration, false, false);
      
      // Log additional error context for debugging including performance metrics
      if (isDevelopment) {
        console.warn('HIBP Error Details:', {
          errorType: errorResult.category,
          severity: errorResult.severity,
          canRetry: errorResult.canRetry,
          userMessage: errorResult.userMessage,
          handlerUsed: errorResult.handlerUsed,
          performanceMetrics: errorResult.performanceMetrics
        });
      }
    }
  }, [hibpCheck, validationState, performanceMonitor]);

  /**
   * Manually trigger HIBP check (useful for retry scenarios)
   * Requirements: 3.4 - Respect feature flag settings
   */
  const recheckHIBP = useCallback(() => {
    if (hibpEnabled && password && isPasswordComplexityValid(password, username, email)) {
      checkPasswordWithHIBP(password);
    } else if (!hibpEnabled) {
      console.info('HIBP recheck skipped - feature disabled by flag');
      validationState.setHIBPUnavailable();
    }
  }, [password, username, email, checkPasswordWithHIBP, hibpEnabled]);

  /**
   * Reset validation state (useful when clearing form)
   */
  const resetValidation = useCallback(() => {
    validationState.resetState();
    
    // Cancel any ongoing HIBP check
    hibpCheck.cancelCheck();
  }, [hibpCheck, validationState]);

  /**
   * Get validation status for specific requirement
   * @param {string} requirement - The requirement to check
   * @returns {boolean|null} Validation status for the requirement
   */
  const getRequirementStatus = useCallback((requirement) => {
    return validationState.getRequirementStatus(requirement);
  }, [validationState]);

  /**
   * Check if password meets minimum requirements for HIBP check and feature is enabled
   * @returns {boolean} True if password should be checked against HIBP
   * Requirements: 3.4 - Consider feature flag status
   */
  const shouldCheckHIBP = useCallback(() => {
    return hibpEnabled && 
           password && 
           password.length >= 10 && 
           isPasswordComplexityValid(password, username, email);
  }, [password, username, email, hibpEnabled]);

  // Requirement 6.5: Clear errors immediately when requirements are satisfied
  useEffect(() => {
    if (validationState.state.isValid && validationState.hasErrors) {
      validationState.clearErrors();
    }
  }, [validationState]);

  return {
    // Core validation state (Requirements 4.1, 4.4, 5.4, 6.2, 6.5)
    requirements: validationState.state.requirements,
    isValid: validationState.state.isValid,
    isCheckingHIBP: validationState.state.isCheckingHIBP,
    errors: validationState.state.errors,
    summary: validationState.state.summary,
    
    // Additional state from HIBP hook
    hibpError: hibpCheck.error,
    hasActiveHIBPRequest: hibpCheck.hasActiveRequest,
    hibpEnabled, // Expose feature flag status
    
    // Enhanced state management properties
    hasErrors: validationState.hasErrors,
    errorCount: validationState.errorCount,
    progressPercentage: validationState.progressPercentage,
    metRequirementsCount: validationState.metRequirementsCount,
    totalRequirementsCount: validationState.totalRequirementsCount,
    isComplexityValid: validationState.isComplexityValid,
    hasMinimumLength: validationState.hasMinimumLength,
    isHIBPChecked: validationState.isHIBPChecked,
    isHIBPSafe: validationState.isHIBPSafe,
    isHIBPCompromised: validationState.isHIBPCompromised,
    requirementStatus: validationState.requirementStatus,
    
    // Utility functions
    recheckHIBP,
    resetValidation,
    getRequirementStatus,
    shouldCheckHIBP,
    
    // State management functions
    updateRequirement: validationState.updateRequirement,
    clearErrors: validationState.clearErrors,
    getStateSnapshot: validationState.getStateSnapshot,
    getValidationSummary: validationState.getValidationSummary,
    hasPasswordChanged: validationState.hasPasswordChanged
  };
};

export default usePasswordValidation;