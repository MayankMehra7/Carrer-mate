/**
 * Simple test to verify password validation is working
 * This can be imported and run to check if the validation system is functioning
 */

import { validatePasswordRequirements } from '../utils/passwordValidation';

export const testPasswordValidation = () => {
  console.log('Testing password validation...');
  
  // Test basic password validation
  const testPassword = 'TestPassword123!';
  const testUsername = 'testuser';
  const testEmail = 'test@example.com';
  
  try {
    const requirements = validatePasswordRequirements(testPassword, testUsername, testEmail);
    console.log('Password validation test results:', requirements);
    
    const expectedResults = {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
      noPersonalInfo: true,
      notCompromised: null
    };
    
    let allPassed = true;
    Object.keys(expectedResults).forEach(key => {
      if (requirements[key] !== expectedResults[key]) {
        console.error(`Test failed for ${key}: expected ${expectedResults[key]}, got ${requirements[key]}`);
        allPassed = false;
      }
    });
    
    if (allPassed) {
      console.log('✅ Password validation test passed!');
      return true;
    } else {
      console.error('❌ Password validation test failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Password validation test error:', error);
    return false;
  }
};

export default testPasswordValidation;