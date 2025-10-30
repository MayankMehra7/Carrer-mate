/**
 * Unit tests for password validation utilities
 * Tests all password validation logic with various input combinations
 */

import {
    checkLowercaseRequirement,
    checkNumberRequirement,
    checkPasswordLength,
    checkPersonalInfoRequirement,
    checkSpecialCharacterRequirement,
    checkUppercaseRequirement,
    generateErrorMessages,
    getValidationSummary,
    isPasswordComplexityValid,
    validatePassword,
    validatePasswordRequirements
} from '../passwordValidation';

describe('Password Validation Utilities', () => {
  
  describe('validatePasswordRequirements', () => {
    test('should validate all requirements for a strong password', () => {
      const password = 'StrongPass123!';
      const result = validatePasswordRequirements(password);
      
      expect(result.length).toBe(true);
      expect(result.uppercase).toBe(true);
      expect(result.lowercase).toBe(true);
      expect(result.number).toBe(true);
      expect(result.special).toBe(true);
      expect(result.noPersonalInfo).toBe(true);
      expect(result.notCompromised).toBe(null); // Initially null
    });

    test('should fail length requirement for short passwords', () => {
      const password = 'Short1!';
      const result = validatePasswordRequirements(password);
      
      expect(result.length).toBe(false);
    });

    test('should fail uppercase requirement', () => {
      const password = 'lowercase123!';
      const result = validatePasswordRequirements(password);
      
      expect(result.uppercase).toBe(false);
    });

    test('should fail lowercase requirement', () => {
      const password = 'UPPERCASE123!';
      const result = validatePasswordRequirements(password);
      
      expect(result.lowercase).toBe(false);
    });

    test('should fail number requirement', () => {
      const password = 'NoNumbers!';
      const result = validatePasswordRequirements(password);
      
      expect(result.number).toBe(false);
    });

    test('should fail special character requirement', () => {
      const password = 'NoSpecialChars123';
      const result = validatePasswordRequirements(password);
      
      expect(result.special).toBe(false);
    });

    test('should detect username in password (case insensitive)', () => {
      const password = 'MyUserName123!';
      const username = 'myusername';
      const result = validatePasswordRequirements(password, username);
      
      expect(result.noPersonalInfo).toBe(false);
    });

    test('should detect email username in password', () => {
      const password = 'john.doe123!';
      const email = 'john.doe@example.com';
      const result = validatePasswordRequirements(password, '', email);
      
      expect(result.noPersonalInfo).toBe(false);
    });

    test('should detect full email in password', () => {
      const password = 'test@example.com123!';
      const email = 'test@example.com';
      const result = validatePasswordRequirements(password, '', email);
      
      expect(result.noPersonalInfo).toBe(false);
    });
  });

  describe('Individual requirement checks', () => {
    describe('checkPasswordLength', () => {
      test('should pass for passwords >= 10 characters', () => {
        expect(checkPasswordLength('1234567890')).toBe(true);
        expect(checkPasswordLength('VeryLongPassword123!')).toBe(true);
      });

      test('should fail for passwords < 10 characters', () => {
        expect(checkPasswordLength('123456789')).toBe(false);
        expect(checkPasswordLength('short')).toBe(false);
        expect(checkPasswordLength('')).toBe(false);
      });
    });

    describe('checkUppercaseRequirement', () => {
      test('should pass for passwords with uppercase letters', () => {
        expect(checkUppercaseRequirement('Password')).toBe(true);
        expect(checkUppercaseRequirement('ALLCAPS')).toBe(true);
        expect(checkUppercaseRequirement('mixedCASE')).toBe(true);
      });

      test('should fail for passwords without uppercase letters', () => {
        expect(checkUppercaseRequirement('lowercase')).toBe(false);
        expect(checkUppercaseRequirement('123456')).toBe(false);
        expect(checkUppercaseRequirement('!@#$%')).toBe(false);
      });
    });

    describe('checkLowercaseRequirement', () => {
      test('should pass for passwords with lowercase letters', () => {
        expect(checkLowercaseRequirement('password')).toBe(true);
        expect(checkLowercaseRequirement('MIXED')).toBe(false);
        expect(checkLowercaseRequirement('mixedCase')).toBe(true);
      });

      test('should fail for passwords without lowercase letters', () => {
        expect(checkLowercaseRequirement('UPPERCASE')).toBe(false);
        expect(checkLowercaseRequirement('123456')).toBe(false);
        expect(checkLowercaseRequirement('!@#$%')).toBe(false);
      });
    });

    describe('checkNumberRequirement', () => {
      test('should pass for passwords with numbers', () => {
        expect(checkNumberRequirement('password1')).toBe(true);
        expect(checkNumberRequirement('123')).toBe(true);
        expect(checkNumberRequirement('mix3d')).toBe(true);
      });

      test('should fail for passwords without numbers', () => {
        expect(checkNumberRequirement('password')).toBe(false);
        expect(checkNumberRequirement('UPPERCASE')).toBe(false);
        expect(checkNumberRequirement('!@#$%')).toBe(false);
      });
    });

    describe('checkSpecialCharacterRequirement', () => {
      test('should pass for passwords with allowed special characters', () => {
        const specialChars = '~`!@#$%^&*()_=-+/?><\\|{}[].,';
        for (const char of specialChars) {
          expect(checkSpecialCharacterRequirement(`password${char}`)).toBe(true);
        }
      });

      test('should fail for passwords without special characters', () => {
        expect(checkSpecialCharacterRequirement('password123')).toBe(false);
        expect(checkSpecialCharacterRequirement('Password123')).toBe(false);
      });

      test('should fail for passwords with disallowed special characters', () => {
        expect(checkSpecialCharacterRequirement('password"')).toBe(false);
        expect(checkSpecialCharacterRequirement("password'")).toBe(false);
      });
    });

    describe('checkPersonalInfoRequirement', () => {
      test('should pass when no personal info is provided', () => {
        expect(checkPersonalInfoRequirement('StrongPass123!')).toBe(true);
      });

      test('should fail when password contains username', () => {
        expect(checkPersonalInfoRequirement('johndoe123!', 'johndoe')).toBe(false);
        expect(checkPersonalInfoRequirement('JohnDoe123!', 'johndoe')).toBe(false); // Case insensitive
      });

      test('should fail when password contains email username', () => {
        expect(checkPersonalInfoRequirement('john.doe123!', '', 'john.doe@example.com')).toBe(false);
      });

      test('should fail when password contains full email', () => {
        expect(checkPersonalInfoRequirement('test@example.com!', '', 'test@example.com')).toBe(false);
      });

      test('should pass when password does not contain personal info', () => {
        expect(checkPersonalInfoRequirement('CompletelyDifferent123!', 'johndoe', 'john@example.com')).toBe(true);
      });
    });
  });

  describe('generateErrorMessages', () => {
    test('should generate no errors for valid requirements', () => {
      const requirements = {
        length: true,
        uppercase: true,
        lowercase: true,
        number: true,
        special: true,
        noPersonalInfo: true,
        notCompromised: true
      };
      
      const errors = generateErrorMessages(requirements);
      expect(errors).toEqual([]);
    });

    test('should generate specific error for each failed requirement', () => {
      const requirements = {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        noPersonalInfo: false,
        notCompromised: false
      };
      
      const errors = generateErrorMessages(requirements);
      expect(errors).toContain('Password must be at least 10 characters long');
      expect(errors).toContain('Password must contain at least one uppercase letter');
      expect(errors).toContain('Password must contain at least one lowercase letter');
      expect(errors).toContain('Password must contain at least one number');
      expect(errors).toContain('Password must contain at least one special character');
      expect(errors).toContain('Password must not contain your username or email address');
      expect(errors).toContain('This password is too common and has appeared in a data breach. Please choose a stronger one.');
    });

    test('should not generate error for null notCompromised status', () => {
      const requirements = {
        length: true,
        uppercase: true,
        lowercase: true,
        number: true,
        special: true,
        noPersonalInfo: true,
        notCompromised: null
      };
      
      const errors = generateErrorMessages(requirements);
      expect(errors).toEqual([]);
    });
  });

  describe('isPasswordComplexityValid', () => {
    test('should return true for passwords meeting all complexity requirements', () => {
      expect(isPasswordComplexityValid('StrongPass123!', 'user', 'user@example.com')).toBe(true);
    });

    test('should return false for passwords failing any complexity requirement', () => {
      expect(isPasswordComplexityValid('short', 'user', 'user@example.com')).toBe(false);
      expect(isPasswordComplexityValid('nouppercase123!', 'user', 'user@example.com')).toBe(false);
      expect(isPasswordComplexityValid('NOLOWERCASE123!', 'user', 'user@example.com')).toBe(false);
      expect(isPasswordComplexityValid('NoNumbers!', 'user', 'user@example.com')).toBe(false);
      expect(isPasswordComplexityValid('NoSpecialChars123', 'user', 'user@example.com')).toBe(false);
      expect(isPasswordComplexityValid('user123!', 'user', 'user@example.com')).toBe(false);
    });
  });

  describe('getValidationSummary', () => {
    test('should calculate correct summary for all met requirements', () => {
      const requirements = {
        length: true,
        uppercase: true,
        lowercase: true,
        number: true,
        special: true,
        noPersonalInfo: true,
        notCompromised: true
      };
      
      const summary = getValidationSummary(requirements);
      expect(summary.metRequirements).toBe(7);
      expect(summary.totalRequirements).toBe(7);
      expect(summary.isValid).toBe(true);
      expect(summary.percentComplete).toBe(100);
    });

    test('should calculate correct summary for partially met requirements', () => {
      const requirements = {
        length: true,
        uppercase: true,
        lowercase: false,
        number: false,
        special: false,
        noPersonalInfo: true,
        notCompromised: null
      };
      
      const summary = getValidationSummary(requirements);
      expect(summary.metRequirements).toBe(3);
      expect(summary.totalRequirements).toBe(7);
      expect(summary.isValid).toBe(false);
      expect(summary.percentComplete).toBe(43);
    });

    test('should handle null notCompromised correctly', () => {
      const requirements = {
        length: true,
        uppercase: true,
        lowercase: true,
        number: true,
        special: true,
        noPersonalInfo: true,
        notCompromised: null
      };
      
      const summary = getValidationSummary(requirements);
      expect(summary.metRequirements).toBe(6);
      expect(summary.isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should return comprehensive validation result for valid password', () => {
      const password = 'StrongPass123!';
      const result = validatePassword(password, 'user', 'user@example.com');
      
      expect(result.requirements).toBeDefined();
      expect(result.errors).toEqual([]);
      expect(result.summary).toBeDefined();
      expect(result.summary.metRequirements).toBe(6); // All except notCompromised (null)
      expect(result.isValid).toBe(false); // False because notCompromised is null
    });

    test('should return comprehensive validation result for invalid password', () => {
      const password = 'weak';
      const result = validatePassword(password, 'user', 'user@example.com');
      
      expect(result.requirements).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.isValid).toBe(false);
    });
  });

  describe('Edge cases and special scenarios', () => {
    test('should handle empty password', () => {
      const result = validatePasswordRequirements('');
      expect(result.length).toBe(false);
      expect(result.uppercase).toBe(false);
      expect(result.lowercase).toBe(false);
      expect(result.number).toBe(false);
      expect(result.special).toBe(false);
    });

    test('should handle undefined/null inputs gracefully', () => {
      expect(() => validatePasswordRequirements(undefined)).not.toThrow();
      expect(() => validatePasswordRequirements(null)).not.toThrow();
      expect(() => checkPersonalInfoRequirement('password', undefined, null)).not.toThrow();
    });

    test('should handle special characters at password boundaries', () => {
      expect(checkSpecialCharacterRequirement('!password')).toBe(true);
      expect(checkSpecialCharacterRequirement('password!')).toBe(true);
      expect(checkSpecialCharacterRequirement('pass!word')).toBe(true);
    });

    test('should handle unicode and international characters', () => {
      const password = 'Pássw0rd123!';
      const result = validatePasswordRequirements(password);
      expect(result.length).toBe(true);
      expect(result.uppercase).toBe(true);
      expect(result.lowercase).toBe(true);
      expect(result.number).toBe(true);
      expect(result.special).toBe(true);
    });

    test('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'a1!';
      const result = validatePasswordRequirements(longPassword);
      expect(result.length).toBe(true);
    });

    test('should handle partial email matches correctly', () => {
      const password = 'john123!';
      const email = 'john.doe@example.com';
      const result = validatePasswordRequirements(password, '', email);
      expect(result.noPersonalInfo).toBe(false); // Should detect 'john' from email
    });
  });
});