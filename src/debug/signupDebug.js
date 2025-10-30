/**
 * Debug utilities for signup functionality
 * Use these functions to test and debug signup issues
 */

export const debugSignupValidation = (formData, isPasswordValid, isPasswordValidating, usernameValidation, emailValidation) => {
  console.log('=== SIGNUP DEBUG INFO ===');
  console.log('Form Data:', {
    name: formData.name ? '✓' : '✗',
    username: formData.username ? '✓' : '✗',
    email: formData.email ? '✓' : '✗',
    password: formData.password ? '✓' : '✗',
    confirmPassword: formData.confirmPassword ? '✓' : '✗',
  });
  
  console.log('Password Validation:', {
    isPasswordValid,
    isPasswordValidating,
  });
  
  console.log('Username Validation:', {
    isValid: usernameValidation.isValid,
    isValidating: usernameValidation.isValidating,
  });
  
  console.log('Email Validation:', {
    isValid: emailValidation.isValid,
    isValidating: emailValidation.isValidating,
  });
  
  // Check password match
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  console.log('Passwords Match:', passwordsMatch);
  
  // Check basic fields
  const basicFieldsValid = formData.name.trim() && 
                          formData.username.trim() && 
                          formData.email.trim() && 
                          formData.password &&
                          formData.confirmPassword;
  console.log('Basic Fields Valid:', basicFieldsValid);
  
  // Overall form validity
  const isFormValid = basicFieldsValid &&
                     passwordsMatch &&
                     isPasswordValid &&
                     !isPasswordValidating &&
                     usernameValidation.isValid !== false &&
                     emailValidation.isValid !== false &&
                     !usernameValidation.isValidating &&
                     !emailValidation.isValidating;
  
  console.log('Overall Form Valid:', isFormValid);
  console.log('=== END DEBUG INFO ===');
  
  return isFormValid;
};

export const debugPasswordValidation = (validation) => {
  console.log('=== PASSWORD VALIDATION DEBUG ===');
  console.log('Requirements:', validation.requirements);
  console.log('Is Valid:', validation.isValid);
  console.log('Is Checking HIBP:', validation.isCheckingHIBP);
  console.log('Errors:', validation.errors);
  console.log('Progress:', `${validation.metRequirementsCount}/${validation.totalRequirementsCount}`);
  console.log('=== END PASSWORD DEBUG ===');
};

export default { debugSignupValidation, debugPasswordValidation };