// src/hooks/useValidation.js
import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for handling field validation with debouncing
 * @param {string} type - The type of validation ('username' or 'email')
 * @param {string} value - The value to validate
 * @returns {object} Validation state object
 */
export const useValidation = (type, value) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    isValid: null,
    errorMessage: ''
  });

  // Debounce the value to avoid excessive API calls
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    // Only validate if we have a debounced value and it's not empty
    if (debouncedValue && debouncedValue.trim().length > 0) {
      validateField(type, debouncedValue.trim());
    } else {
      // Reset validation state if value is empty
      setValidationState({
        isValidating: false,
        isValid: null,
        errorMessage: ''
      });
    }
  }, [debouncedValue, type]);

  const validateField = async (fieldType, fieldValue) => {
    // Set loading state
    setValidationState({
      isValidating: true,
      isValid: null,
      errorMessage: ''
    });

    try {
      const result = await api.checkAvailability({
        type: fieldType,
        value: fieldValue
      });

      if (result.ok) {
        setValidationState({
          isValidating: false,
          isValid: result.data.available,
          errorMessage: result.data.available ? '' : `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} already exists`
        });
      } else {
        // Handle API error - allow form submission (server-side validation will catch it)
        setValidationState({
          isValidating: false,
          isValid: null,
          errorMessage: ''
        });
      }
    } catch (error) {
      console.log('Validation error:', error);
      // On network error, allow form submission (graceful degradation)
      setValidationState({
        isValidating: false,
        isValid: null,
        errorMessage: ''
      });
    }
  };

  return validationState;
};