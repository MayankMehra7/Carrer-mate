/**
 * OAuth Configuration Tests
 * Tests for platform-specific OAuth configuration
 */

// Mock environment variables first
const originalEnv = process.env;

// Set up test environment variables
process.env = {
  ...originalEnv,
  EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: 'test-google-client-id',
  EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-client-secret',
  EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID: 'test-github-client-id',
  EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET: 'test-github-client-secret',
  EXPO_PUBLIC_OAUTH_REDIRECT_URI: 'http://localhost:3000/oauth/callback',
  EXPO_PUBLIC_API_URL: 'http://localhost:5000'
};

// Mock PlatformDetector before importing oauth config
jest.mock('../../utils/PlatformDetector', () => ({
  PlatformDetector: {
    detectPlatform: jest.fn(() => 'web'),
    getOAuthCapabilities: jest.fn(() => ({
      platform: 'web',
      nativeGoogleSignIn: false,
      webOAuth: true,
      tokenStorage: 'localstorage'
    })),
    isNativeOAuthAvailable: jest.fn(() => false),
    getRecommendedStorageType: jest.fn(() => 'localstorage'),
    getPlatformInfo: jest.fn(() => ({
      platform: 'web',
      capabilities: {
        nativeGoogleSignIn: false,
        webOAuth: true
      }
    }))
  }
}));

import {
    getOAuthConfigForCurrentPlatform,
    getOAuthDebugInfo,
    getPlatformOAuthConfig,
    validateOAuthConfig
} from '../oauth';

describe('OAuth Configuration', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: 'test-google-client-id',
      EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-client-secret',
      EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID: 'test-github-client-id',
      EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET: 'test-github-client-secret',
      EXPO_PUBLIC_OAUTH_REDIRECT_URI: 'http://localhost:3000/oauth/callback',
      EXPO_PUBLIC_API_URL: 'http://localhost:5000'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getPlatformOAuthConfig', () => {
    it('should return Google OAuth config for web platform', () => {
      const config = getPlatformOAuthConfig('google', 'web');
      
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('clientSecret');
      expect(config).toHaveProperty('redirectUri');
      expect(config.preferredMethod).toBe('web');
      expect(config.fallbackMethods).toEqual(['fallback']);
      expect(config.scopes).toEqual(['openid', 'profile', 'email']);
      expect(config.provider).toBe('google');
      expect(config.platform).toBe('web');
    });

    it('should return GitHub OAuth config for iOS platform', () => {
      const config = getPlatformOAuthConfig('github', 'ios');
      
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('clientSecret');
      expect(config).toHaveProperty('redirectUri');
      expect(config.preferredMethod).toBe('web');
      expect(config.fallbackMethods).toEqual(['fallback']);
      expect(config.scopes).toEqual(['user:email', 'read:user']);
      expect(config.provider).toBe('github');
      expect(config.platform).toBe('ios');
    });

    it('should return null for unknown provider', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config = getPlatformOAuthConfig('unknown', 'web');
      
      expect(config).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Unknown OAuth provider: unknown');
      
      consoleSpy.mockRestore();
    });

    it('should return null for unknown platform', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config = getPlatformOAuthConfig('google', 'unknown');
      
      expect(config).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('No configuration found for google on unknown');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getOAuthConfigForCurrentPlatform', () => {
    it('should return complete OAuth config with platform capabilities', () => {
      const config = getOAuthConfigForCurrentPlatform('google');
      
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('capabilities');
      expect(config).toHaveProperty('isNativeAvailable');
      expect(config).toHaveProperty('recommendedStorageType');
      expect(config.provider).toBe('google');
      expect(config.platform).toBe('web');
    });

    it('should return null for unknown provider', () => {
      const config = getOAuthConfigForCurrentPlatform('unknown');
      expect(config).toBeNull();
    });
  });

  describe('validateOAuthConfig', () => {
    it('should return validation result with platform information', () => {
      const result = validateOAuthConfig('web');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result.platform).toBe('web');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return errors for missing Google client ID', () => {
      delete process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = validateOAuthConfig('web');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Google OAuth Client ID is not configured for web');
      
      consoleSpy.mockRestore();
    });

    it('should return errors for missing GitHub client ID', () => {
      delete process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = validateOAuthConfig('web');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub OAuth Client ID is not configured for web');
      
      consoleSpy.mockRestore();
    });

    it('should require client secrets for web platform', () => {
      delete process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET;
      delete process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_SECRET;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = validateOAuthConfig('web');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Google OAuth Client Secret is required for web platform');
      expect(result.errors).toContain('GitHub OAuth Client Secret is required for web platform');
      
      consoleSpy.mockRestore();
    });

    it('should handle API base URL validation', () => {
      const result = validateOAuthConfig('web');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result.platform).toBe('web');
    });
  });

  describe('getOAuthDebugInfo', () => {
    it('should return comprehensive debug information', () => {
      const debugInfo = getOAuthDebugInfo();
      
      expect(debugInfo).toHaveProperty('currentPlatform');
      expect(debugInfo).toHaveProperty('platformInfo');
      expect(debugInfo).toHaveProperty('configurations');
      expect(debugInfo).toHaveProperty('validation');
      expect(debugInfo).toHaveProperty('endpoints');
      
      expect(debugInfo.configurations).toHaveProperty('google');
      expect(debugInfo.configurations).toHaveProperty('github');
    });
  });
});