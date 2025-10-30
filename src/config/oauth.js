/**
 * OAuth Configuration
 * 
 * This file contains OAuth provider configurations for Google and GitHub authentication.
 * Make sure to update the client IDs and secrets in your environment files.
 */

export const OAuthConfig = {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
  },
  github: {
    clientId: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID,
    clientSecret: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET,
    scopes: ['user:email', 'read:user'],
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

// Validate OAuth configuration
export const validateOAuthConfig = () => {
  const errors = [];
  
  if (!OAuthConfig.google.clientId) {
    errors.push('Google OAuth Client ID is not configured');
  }
  
  if (!OAuthConfig.github.clientId) {
    errors.push('GitHub OAuth Client ID is not configured');
  }
  
  if (!OAuthConfig.api.baseUrl) {
    errors.push('API Base URL is not configured');
  }
  
  if (errors.length > 0) {
    console.warn('OAuth Configuration Issues:', errors);
  }
  
  return errors.length === 0;
};