/**
 * OAuth Configuration
 * 
 * This file contains OAuth provider configurations for Google and GitHub authentication.
 * Supports platform-specific configurations for iOS, Android, and Web platforms.
 * Make sure to update the client IDs and secrets in your environment files.
 */

import { PlatformDetector } from '../utils/PlatformDetector';


// Base OAuth configuration
export const OAuthConfig = {
  google: {
    // Common configuration
    scopes: ['openid', 'profile', 'email'],
    
    // Platform-specific client IDs
    ios: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      preferredMethod: 'native',
      fallbackMethods: ['web']
    },
    android: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      preferredMethod: 'native',
      fallbackMethods: ['web']
    },
    web: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      preferredMethod: 'web',
      fallbackMethods: ['fallback']
    },
    
    // Legacy support
    clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
  },
  github: {
    // Common configuration
    scopes: ['user:email', 'read:user'],
    
    // Platform-specific configurations (GitHub uses web OAuth across all platforms)
    ios: {
      clientId: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      preferredMethod: 'web',
      fallbackMethods: ['fallback']
    },
    android: {
      clientId: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      preferredMethod: 'web',
      fallbackMethods: ['fallback']
    },
    web: {
      clientId: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET,
      redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
      preferredMethod: 'web',
      fallbackMethods: ['fallback']
    },
    
    // Legacy support
    clientId: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID,
    clientSecret: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
  }
};

// OAuth provider endpoints
export const OAuthEndpoints = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
  }
};

/**
 * Get platform-specific OAuth configuration
 * @param {string} provider - OAuth provider ('google' or 'github')
 * @param {string} platform - Platform ('ios', 'android', 'web') - optional, auto-detected if not provided
 * @returns {Object} Platform-specific OAuth configuration
 */
export const getPlatformOAuthConfig = (provider, platform = null) => {
  const targetPlatform = platform || PlatformDetector.detectPlatform();
  const providerConfig = OAuthConfig[provider.toLowerCase()];
  
  if (!providerConfig) {
    console.warn(`Unknown OAuth provider: ${provider}`);
    return null;
  }
  
  const platformConfig = providerConfig[targetPlatform];
  if (!platformConfig) {
    console.warn(`No configuration found for ${provider} on ${targetPlatform}`);
    return null;
  }
  
  return {
    ...platformConfig,
    scopes: providerConfig.scopes,
    provider: provider.toLowerCase(),
    platform: targetPlatform
  };
};

/**
 * Get OAuth configuration with platform detection and fallbacks
 * @param {string} provider - OAuth provider
 * @returns {Object} Complete OAuth configuration for current platform
 */
export const getOAuthConfigForCurrentPlatform = (provider) => {
  const platform = PlatformDetector.detectPlatform();
  const capabilities = PlatformDetector.getOAuthCapabilities(platform);
  const config = getPlatformOAuthConfig(provider, platform);
  
  if (!config) {
    return null;
  }
  
  return {
    ...config,
    capabilities,
    isNativeAvailable: PlatformDetector.isNativeOAuthAvailable(provider, platform),
    recommendedStorageType: PlatformDetector.getRecommendedStorageType(platform)
  };
};

// Validate OAuth configuration
export const validateOAuthConfig = (platform = null) => {
  const targetPlatform = platform || PlatformDetector.detectPlatform();
  const errors = [];
  
  // Validate Google OAuth
  const googleConfig = getPlatformOAuthConfig('google', targetPlatform);
  if (!googleConfig || !googleConfig.clientId) {
    errors.push(`Google OAuth Client ID is not configured for ${targetPlatform}`);
  }
  
  // Validate GitHub OAuth
  const githubConfig = getPlatformOAuthConfig('github', targetPlatform);
  if (!githubConfig || !githubConfig.clientId) {
    errors.push(`GitHub OAuth Client ID is not configured for ${targetPlatform}`);
  }
  
  // Validate API configuration
  if (!OAuthConfig.api.baseUrl) {
    errors.push('API Base URL is not configured');
  }
  
  // Platform-specific validations
  if (targetPlatform === 'web') {
    if (googleConfig && !googleConfig.clientSecret) {
      errors.push('Google OAuth Client Secret is required for web platform');
    }
    if (githubConfig && !githubConfig.clientSecret) {
      errors.push('GitHub OAuth Client Secret is required for web platform');
    }
  }
  
  if (errors.length > 0) {
    console.warn(`OAuth Configuration Issues for ${targetPlatform}:`, errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    platform: targetPlatform
  };
};

/**
 * Get all OAuth configurations for debugging
 * @returns {Object} Complete OAuth configuration information
 */
export const getOAuthDebugInfo = () => {
  const platform = PlatformDetector.detectPlatform();
  const platformInfo = PlatformDetector.getPlatformInfo();
  
  return {
    currentPlatform: platform,
    platformInfo,
    configurations: {
      google: getOAuthConfigForCurrentPlatform('google'),
      github: getOAuthConfigForCurrentPlatform('github')
    },
    validation: validateOAuthConfig(platform),
    endpoints: OAuthEndpoints
  };
};