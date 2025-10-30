/**
 * Unit tests for usePasswordValidation hook
 * Tests password validation hook with various scenarios and state management
 */

import { act, renderHook } from '@testing-library/react-native';
import { usePasswordValidation } from '../usePasswordValidation';

// Mock the dependencies
jest.mock('../useDebounce', () => ({
  useDebounce: jest.fn((value) => value) // Return value immediately for testing
}));

jest.mock('../useHIBPCheck', () => ({
  useHIBPCheck: jest.fn(() => ({
    checkPassword: jest.fn(),
    error: null,
    hasActiveRequest: false
  }))
}));

jest.mock('../usePasswordValidationState', () => ({
  usePasswordValidationState: jest.fn(() => ({
    state: {
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        noPersonalInfo: true,
        notCompromised: null
      },
      isValid: false,
      isCheckingHIBP: false,
      errors: [],
      summary: { metRequirements: 0, totalRequirements: 7, isValid: false, percentComplete: 0 }
    },
    updateRequirements: jest.fn(),
    updateRequirement: jest.fn(),
    setHIBPChecking: jest.fn(),
    setHIBPResult: jest.fn(),
    setHIBPUnavailable: jest.fn(),
    resetState: jest.fn(),
    clearErrors: jest.fn(),
    getRequirementStatus: jest.fn(),
    hasErrors: false,
    errorCount: 0,
    progressPercentage: 0,
    metRequirementsCount: 0,
    totalRequirementsCount: 7,
    isComplexityValid: false,
    hasMinimumLength: false,
    isHIBPChecked: false,
    isHIBPSafe: false,
    isHIBPCompromised: false,
    requirementStatus: {},
    getStateSnapshot: jest.fn(),
    getValidationSummary: jest.fn(),
    hasPasswordChanged: jest.fn()
  }))
}));

import { useDebounce } from '../useDebounce';
import { useHIBPCheck } from '../useHIBPCheck';
import { usePasswordValidationState } from '../usePasswordValidationState';

describe('usePasswordValidation hook', () => {
  let mockValidationState;
  let mockHIBPCheck;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock validation state
    mockValidationState = {
      state: {
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
          noPersonalInfo: true,
          notCompromised: null
        },
        isValid: false,
        isCheckingHIBP: false,
        errors: [],
        summary: { metRequirements: 0, totalRequirements: 7, isValid: false, percentComplete: 0 }
      },
      updateRequirements: jest.fn(),
      updateRequirement: jest.fn(),
      setHIBPChecking: jest.fn(),
      setHIBPResult: jest.fn(),
      setHIBPUnavailable: jest.fn(),
      resetState: jest.fn(),
      clearErrors: jest.fn(),
      getRequirementStatus: jest.fn(),
      hasErrors: false,
      errorCount: 0,
      progressPercentage: 0,
      metRequirementsCount: 0,
      totalRequirementsCount: 7,
      isComplexityValid: false,
      hasMinimumLength: false,
      isHIBPChecked: false,
      isHIBPSafe: false,
      isHIBPCompromised: false,
      requirementStatus: {},
      getStateSnapshot: jest.fn(),
      getValidationSummary: jest.fn(),
      hasPasswordChanged: jest.fn()
    };

    mockHIBPCheck = {
      checkPassword: jest.fn(),
      error: null,
      hasActiveRequest: false
    };

    usePasswordValidationState.mockReturnValue(mockValidationState);
    useHIBPCheck.mockReturnValue(mockHIBPCheck);
  });

  describe('Basic functionality', () => {
    test('should initialize with default state', () => {
      const { result } = renderHook(() => usePasswordValidation(''));

      expect(result.current.requirements).toBeDefined();
      expect(result.current.isValid).toBe(false);
      expect(result.current.isCheckingHIBP).toBe(false);
      expect(result.current.errors).toEqual([]);
    });

    test('should update requirements when password changes', () => {
      const { result, rerender } = renderHook(
        ({ password, username, email }) => usePasswordValidation(password, username, email),
        { initialProps: { password: '', username: '', email: '' } }
      );

      // Change password
      rerender({ password: 'NewPassword123!', username: '', email: '' });

      expect(mockValidationState.updateRequirements).toHaveBeenCalled();
    });

    test('should update requirements when username changes', () => {
      const { result, rerender } = renderHook(
        ({ password, username, email }) => usePasswordValidation(password, username, email),
        { initialProps: { password: 'Password123!', username: '', email: '' } }
      );

      // Change username
      rerender({ password: 'Password123!', username: 'newuser', email: '' });

      expect(mockValidationState.updateRequirements).toHaveBeenCalled();
    });

    test('should update requirements when email changes', () => {
      const { result, rerender } = renderHook(
        ({ password, username, email }) => usePasswordValidation(password, username, email),
        { initialProps: { password: 'Password123!', username: '', email: '' } }
      );

      // Change email
      rerender({ password: 'Password123!', username: '', email: 'user@example.com' });

      expect(mockValidationState.updateRequirements).toHaveBeenCalled();
    });
  });

  describe('HIBP integration', () => {
    test('should trigger HIBP check for valid passwords', async () => {
      // Mock that password meets complexity requirements
      mockValidationState.state.requirements = {
        length: true,
        uppercase: true,
        lowercase: true,
        number: true,
        special: true,
        noPersonalInfo: true,
        notCompromised: null
      };

      mockHIBPCheck.checkPassword.mockResolvedValue(false);

      const { result } = renderHook(() => 
        usePasswordValidation('ValidPassword123!', 'user', 'user@example.com')
      );

      // Wait for debounced effect
      await act(async () => {
        // Simulate debounce completion
      });

      expect(mockValidationState.setHIBPChecking).toHaveBeenCalledWith(true);
    });

    test('should not trigger HIBP check for short passwords', () => {
      const { result } = renderHook(() => 
        usePasswordValidation('short', 'user', 'user@example.com')
      );

      expect(mockHIBPCheck.checkPassword).not.toHaveBeenCalled();
    });

    test('should handle HIBP check success', async () => {
      mockHIBPCheck.checkPassword.mockResolvedValue(false);

      const { result } = renderHook(() => 
        usePasswordValidation('ValidPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      expect(mockValidationState.setHIBPResult).toHaveBeenCalledWith(false);
    });

    test('should handle HIBP check failure gracefully', async () => {
      mockHIBPCheck.checkPassword.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => 
        usePasswordValidation('ValidPassword123!', 'user', 'user@example.com')
      );

      await act(async () => {
        await result.current.recheckHIBP();
      });

      expect(mockValidationState.setHIBPUnavailable).toHaveBeenCalled();
    });

    test('should reset HIBP status for passwords below minimum length', () => {
      const { result, rerender } = renderHook(
        ({ password }) => usePasswordValidation(password, 'user', 'user@example.com'),
        { initialProps: { password: 'ValidPassword123!' } }
      );

      // Change to short password
      rerender({ password: 'short' });

      expect(mockValidationState.updateRequirement).toHaveBeenCalledWith('notCompromised', null);
      expect(mockValidationState.setHIBPChecking).toHaveBeenCalledWith(false);
    });
  });

  describe('Utility functions', () => {
    test('should provide recheckHIBP function', async () => {
      mockHIBPCheck.checkPassword.mockResolvedValue(false);

      const { result } = renderHook(() => 
        usePasswordValidation('ValidPassword123!', 'user', 'user@example.com')
      );

      expect(typeof result.current.recheckHIBP).toBe('function');

      await act(async () => {
        await result.current.recheckHIBP();
      });

      expect(mockHIBPCheck.checkPassword).toHaveBeenCalled();
    });

    test('should provide resetValidation function', () => {
      const { result } = renderHook(() => 
        usePasswordValidation('Password123!', 'user', 'user@example.com')
      );

      expect(typeof result.current.resetValidation).toBe('function');

      act(() => {
        result.current.resetValidation();
      });

      expect(mockValidationState.resetState).toHaveBeenCalled();
    });

    test('should provide getRequirementStatus function', () => {
      mockValidationState.getRequirementStatus.mockReturnValue(true);

      const { result } = renderHook(() => 
        usePasswordValidation('Password123!', 'user', 'user@example.com')
      );

      const status = result.current.getRequirementStatus('length');
      expect(mockValidationState.getRequirementStatus).toHaveBeenCalledWith('length');
    });

    test('should provide shouldCheckHIBP function', () => {
      const { result } = renderHook(() => 
        usePasswordValidation('ValidPassword123!', 'user', 'user@example.com')
      );

      expect(typeof result.current.shouldCheckHIBP).toBe('function');
      
      const shouldCheck = result.current.shouldCheckHIBP();
      expect(typeof shouldCheck).toBe('boolean');
    });
  });

  describe('State management integration', () => {
    test('should expose all validation state properties', () => {
      const { result } = renderHook(() => 
        usePasswordValidation('Password123!', 'user', 'user@example.com')
      );

      // Core validation state
      expect(result.current.requirements).toBeDefined();
      expect(result.current.isValid).toBeDefined();
      expect(result.current.isCheckingHIBP).toBeDefined();
      expect(result.current.errors).toBeDefined();
      expect(result.current.summary).toBeDefined();

      // Enhanced state properties
      expect(result.current.hasErrors).toBeDefined();
      expect(result.current.errorCount).toBeDefined();
      expect(result.current.progressPercentage).toBeDefined();
      expect(result.current.metRequirementsCount).toBeDefined();
      expect(result.current.totalRequirementsCount).toBeDefined();
    });

    test('should expose HIBP-specific properties', () => {
      const { result } = renderHook(() => 
        usePasswordValidation('Password123!', 'user', 'user@example.com')
      );

      expect(result.current.hibpError).toBeDefined();
      expect(result.current.hasActiveHIBPRequest).toBeDefined();
      expect(result.current.isHIBPChecked).toBeDefined();
      expect(result.current.isHIBPSafe).toBeDefined();
      expect(result.current.isHIBPCompromised).toBeDefined();
    });

    test('should clear errors when validation becomes valid', () => {
      mockValidationState.state.isValid = true;
      mockValidationState.hasErrors = true;

      const { result } = renderHook(() => 
        usePasswordValidation('ValidPassword123!', 'user', 'user@example.com')
      );

      expect(mockValidationState.clearErrors).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined password', () => {
      expect(() => {
        renderHook(() => usePasswordValidation(undefined, 'user', 'user@example.com'));
      }).not.toThrow();
    });

    test('should handle null username and email', () => {
      expect(() => {
        renderHook(() => usePasswordValidation('Password123!', null, null));
      }).not.toThrow();
    });

    test('should handle empty strings for all parameters', () => {
      expect(() => {
        renderHook(() => usePasswordValidation('', '', ''));
      }).not.toThrow();
    });

    test('should preserve HIBP result when updating other requirements', () => {
      mockValidationState.getRequirementStatus.mockReturnValue(true);

      const { result, rerender } = renderHook(
        ({ password }) => usePasswordValidation(password, 'user', 'user@example.com'),
        { initialProps: { password: 'Password123!' } }
      );

      // Change password slightly
      rerender({ password: 'Password123!!' });

      expect(mockValidationState.updateRequirements).toHaveBeenCalledWith(
        expect.objectContaining({
          notCompromised: true // Should preserve existing HIBP result
        }),
        'Password123!!'
      );
    });
  });

  describe('Performance considerations', () => {
    test('should debounce HIBP checks', () => {
      useDebounce.mockReturnValue('debouncedPassword');

      const { result } = renderHook(() => 
        usePasswordValidation('Password123!', 'user', 'user@example.com')
      );

      expect(useDebounce).toHaveBeenCalledWith('Password123!', 1000);
    });

    test('should not trigger unnecessary HIBP checks', () => {
      const { result, rerender } = renderHook(
        ({ password }) => usePasswordValidation(password, 'user', 'user@example.com'),
        { initialProps: { password: 'short' } }
      );

      // Multiple renders with short password
      rerender({ password: 'short1' });
      rerender({ password: 'short2' });

      expect(mockHIBPCheck.checkPassword).not.toHaveBeenCalled();
    });
  });
});