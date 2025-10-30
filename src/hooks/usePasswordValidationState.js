/**
 * usePasswordValidationState - Comprehensive validation state management
 * Handles all aspects of password validation state including loading, errors, and status
 */

import { useCallback, useMemo, useState } from 'react';
import {
    generateErrorMessages,
    getValidationSummary
} from '../utils/passwordValidation';

/**
 * Initial validation state structure
 */
const createInitialState = () => ({
  requirements: {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noPersonalInfo: false,
    notCompromised: null // null = not checked, true = safe, false = compromised
  },
  isValid: false,
  isCheckingHIBP: false,
  errors: [],
  summary: {
    metRequirements: 0,
    totalRequirements: 7,
    isValid: false,
    percentComplete: 0
  },
  lastCheckedPassword: null,
  validationTimestamp: null
});

/**
 * Hook for managing comprehensive password validation state
 * @returns {Object} State management object with state and update functions
 */
export const usePasswordValidationState = () => {
  const [state, setState] = useState(createInitialState);

  /**
   * Updates password requirements and recalculates validation state
   * @param {Object} requirements - New requirements object
   * @param {string} password - Current password for tracking
   */
  const updateRequirements = useCallback((requirements, password = null) => {
    setState(prevState => {
      const errors = generateErrorMessages(requirements);
      const summary = getValidationSummary(requirements);
      
      return {
        ...prevState,
        requirements,
        errors,
        summary,
        isValid: summary.isValid && errors.length === 0,
        lastCheckedPassword: password,
        validationTimestamp: Date.now()
      };
    });
  }, []);

  /**
   * Updates HIBP checking status
   * @param {boolean} isChecking - Whether HIBP check is in progress
   */
  const setHIBPChecking = useCallback((isChecking) => {
    setState(prevState => ({
      ...prevState,
      isCheckingHIBP: isChecking,
      // Reset notCompromised to null when starting check
      ...(isChecking && {
        requirements: {
          ...prevState.requirements,
          notCompromised: null
        }
      })
    }));
  }, []);

  /**
   * Updates HIBP check result
   * @param {boolean} isCompromised - Whether password is compromised
   */
  const setHIBPResult = useCallback((isCompromised) => {
    setState(prevState => {
      const newRequirements = {
        ...prevState.requirements,
        notCompromised: !isCompromised
      };
      
      const errors = generateErrorMessages(newRequirements);
      const summary = getValidationSummary(newRequirements);
      
      return {
        ...prevState,
        requirements: newRequirements,
        isCheckingHIBP: false,
        errors,
        summary,
        isValid: summary.isValid && errors.length === 0,
        validationTimestamp: Date.now()
      };
    });
  }, []);

  /**
   * Sets HIBP check as failed/unavailable (graceful fallback)
   */
  const setHIBPUnavailable = useCallback(() => {
    setState(prevState => {
      const newRequirements = {
        ...prevState.requirements,
        notCompromised: true // Allow password when HIBP fails
      };
      
      const errors = generateErrorMessages(newRequirements);
      const summary = getValidationSummary(newRequirements);
      
      return {
        ...prevState,
        requirements: newRequirements,
        isCheckingHIBP: false,
        errors,
        summary,
        isValid: summary.isValid && errors.length === 0,
        validationTimestamp: Date.now()
      };
    });
  }, []);

  /**
   * Resets validation state to initial values
   */
  const resetState = useCallback(() => {
    setState(createInitialState());
  }, []);

  /**
   * Updates a specific requirement
   * @param {string} requirement - The requirement key to update
   * @param {boolean|null} value - The new value for the requirement
   */
  const updateRequirement = useCallback((requirement, value) => {
    setState(prevState => {
      const newRequirements = {
        ...prevState.requirements,
        [requirement]: value
      };
      
      const errors = generateErrorMessages(newRequirements);
      const summary = getValidationSummary(newRequirements);
      
      return {
        ...prevState,
        requirements: newRequirements,
        errors,
        summary,
        isValid: summary.isValid && errors.length === 0,
        validationTimestamp: Date.now()
      };
    });
  }, []);

  /**
   * Clears all errors (useful when requirements are satisfied)
   */
  const clearErrors = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      errors: []
    }));
  }, []);

  /**
   * Sets loading state for any validation operation
   * @param {boolean} isLoading - Whether validation is in progress
   */
  const setLoading = useCallback((isLoading) => {
    setState(prevState => ({
      ...prevState,
      isCheckingHIBP: isLoading
    }));
  }, []);

  // Memoized computed values for performance
  const computedValues = useMemo(() => ({
    // Requirement 4.1: Overall validation status calculation
    hasErrors: state.errors.length > 0,
    errorCount: state.errors.length,
    
    // Progress tracking
    progressPercentage: state.summary.percentComplete,
    metRequirementsCount: state.summary.metRequirements,
    totalRequirementsCount: state.summary.totalRequirements,
    
    // Status checks
    isComplexityValid: state.requirements.length &&
                      state.requirements.uppercase &&
                      state.requirements.lowercase &&
                      state.requirements.number &&
                      state.requirements.special &&
                      state.requirements.noPersonalInfo,
    
    hasMinimumLength: state.requirements.length,
    
    // HIBP status
    isHIBPChecked: state.requirements.notCompromised !== null,
    isHIBPSafe: state.requirements.notCompromised === true,
    isHIBPCompromised: state.requirements.notCompromised === false,
    
    // Timing information
    isRecentlyValidated: state.validationTimestamp && 
                        (Date.now() - state.validationTimestamp) < 5000, // 5 seconds
    
    // Individual requirement status
    requirementStatus: {
      length: state.requirements.length,
      uppercase: state.requirements.uppercase,
      lowercase: state.requirements.lowercase,
      number: state.requirements.number,
      special: state.requirements.special,
      noPersonalInfo: state.requirements.noPersonalInfo,
      notCompromised: state.requirements.notCompromised
    }
  }), [state]);

  /**
   * Gets status for a specific requirement
   * @param {string} requirement - The requirement to check
   * @returns {boolean|null} Status of the requirement
   */
  const getRequirementStatus = useCallback((requirement) => {
    return state.requirements[requirement];
  }, [state.requirements]);

  /**
   * Checks if validation state has changed since last check
   * @param {string} password - Current password to compare
   * @returns {boolean} True if password has changed since last validation
   */
  const hasPasswordChanged = useCallback((password) => {
    return state.lastCheckedPassword !== password;
  }, [state.lastCheckedPassword]);

  return {
    // Current state
    state,
    
    // Computed values
    ...computedValues,
    
    // State update functions
    updateRequirements,
    updateRequirement,
    setHIBPChecking,
    setHIBPResult,
    setHIBPUnavailable,
    setLoading,
    clearErrors,
    resetState,
    
    // Utility functions
    getRequirementStatus,
    hasPasswordChanged,
    
    // State snapshots for debugging
    getStateSnapshot: () => ({ ...state }),
    getValidationSummary: () => ({ ...state.summary })
  };
};

export default usePasswordValidationState;