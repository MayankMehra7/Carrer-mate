/**
 * useDebounce hook for optimizing HIBP API calls
 * Delays execution of expensive operations until user stops typing
 */

import { useEffect, useState } from 'react';

/**
 * Debounces a value by delaying updates until after a specified delay
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default 1000ms per requirements)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 1000) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if value changes before delay
    // This prevents unnecessary API calls when user is still typing
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
};

export default useDebounce;