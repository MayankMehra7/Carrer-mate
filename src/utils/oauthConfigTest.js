/**
 * OAuth Configuration Test
 * Simple test to check if OAuth configuration is working
 */

import { getOAuthDebugInfo, OAuthConfig, validateOAuthConfig } from '../config/oauth';

export const testOAuthConfig = () => {
  console.log('=== OAuth Configuration Test ===');
  
  try {
    // Test basic config
    console.log('Google Client ID:', OAuthConfig.google.clientId ? 'SET' : 'NOT SET');
    console.log('GitHub Client ID:', OAuthConfig.github.clientId ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', OAuthConfig.google.redirectUri ? 'SET' : 'NOT SET');
    
    // Test validation
    const validation = validateOAuthConfig();
    console.log('Config Validation:', validation);
    
    // Test debug info
    const debugInfo = getOAuthDebugInfo();
    console.log('Debug Info:', debugInfo);
    
    return {
      success: true,
      validation,
      debugInfo
    };
  } catch (error) {
    console.error('OAuth Config Test Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default testOAuthConfig;