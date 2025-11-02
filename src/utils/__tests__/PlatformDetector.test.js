/**
 * PlatformDetector Tests
 * Tests for platform detection and OAuth capability detection
 */

import { PlatformDetector } from '../PlatformDetector';

// Mock React Native Platform
const mockPlatform = {
  OS: 'web'
};

jest.mock('react-native', () => ({
  Platform: mockPlatform
}), { virtual: true });

// Mock GoogleSignin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    isSignedIn: jest.fn()
  }
}));

describe('PlatformDetector', () => {
  beforeEach(() => {
    // Clear cache before each test
    PlatformDetector.clearCache();
    // Reset platform mock
    mockPlatform.OS = 'web';
  });

  describe('detectPlatform', () => {
    it('should detect web platform correctly', () => {
      const platform = PlatformDetector.detectPlatform();
      expect(platform).toBe('web');
    });

    it('should cache platform detection results', () => {
      const platform1 = PlatformDetector.detectPlatform();
      const platform2 = PlatformDetector.detectPlatform();
      
      expect(platform1).toBe(platform2);
      expect(platform1).toBe('web');
    });
  });

  describe('getOAuthCapabilities', () => {
    it('should return web capabilities for web platform', () => {
      const capabilities = PlatformDetector.getOAuthCapabilities('web');
      
      expect(capabilities.platform).toBe('web');
      expect(capabilities.nativeGoogleSignIn).toBe(false);
      expect(capabilities.webOAuth).toBe(true);
      expect(capabilities.tokenStorage).toBe('localstorage');
    });

    it('should return iOS capabilities for iOS platform', () => {
      const capabilities = PlatformDetector.getOAuthCapabilities('ios');
      
      expect(capabilities.platform).toBe('ios');
      expect(capabilities.tokenStorage).toBe('asyncstorage');
      expect(capabilities.asyncStorage).toBe(true);
      expect(capabilities.secureStorage).toBe(true);
    });

    it('should return Android capabilities for Android platform', () => {
      const capabilities = PlatformDetector.getOAuthCapabilities('android');
      
      expect(capabilities.platform).toBe('android');
      expect(capabilities.tokenStorage).toBe('asyncstorage');
      expect(capabilities.asyncStorage).toBe(true);
      expect(capabilities.secureStorage).toBe(true);
    });

    it('should cache capabilities results', () => {
      const capabilities1 = PlatformDetector.getOAuthCapabilities('web');
      const capabilities2 = PlatformDetector.getOAuthCapabilities('web');
      
      expect(capabilities1).toBe(capabilities2);
    });
  });

  describe('isNativeOAuthAvailable', () => {
    it('should return false for Google OAuth on web platform', () => {
      const isAvailable = PlatformDetector.isNativeOAuthAvailable('google', 'web');
      expect(isAvailable).toBe(false);
    });

    it('should return false for GitHub OAuth on all platforms', () => {
      expect(PlatformDetector.isNativeOAuthAvailable('github', 'web')).toBe(false);
      expect(PlatformDetector.isNativeOAuthAvailable('github', 'ios')).toBe(false);
      expect(PlatformDetector.isNativeOAuthAvailable('github', 'android')).toBe(false);
    });

    it('should handle unknown providers gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const isAvailable = PlatformDetector.isNativeOAuthAvailable('unknown', 'web');
      
      expect(isAvailable).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown OAuth provider: unknown');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getOAuthConfig', () => {
    it('should return Google OAuth config for web platform', () => {
      const config = PlatformDetector.getOAuthConfig('google', 'web');
      
      expect(config).toEqual({
        preferredMethod: 'web',
        fallbackMethods: ['fallback'],
        requiresClientId: true,
        supportsOfflineAccess: false
      });
    });

    it('should return GitHub OAuth config for iOS platform', () => {
      const config = PlatformDetector.getOAuthConfig('github', 'ios');
      
      expect(config).toEqual({
        preferredMethod: 'web',
        fallbackMethods: ['fallback'],
        requiresClientId: true,
        supportsOfflineAccess: false
      });
    });

    it('should return null for unknown providers', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config = PlatformDetector.getOAuthConfig('unknown', 'web');
      
      expect(config).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('No OAuth config found for provider: unknown');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getRecommendedStorageType', () => {
    it('should return localstorage for web platform', () => {
      const storageType = PlatformDetector.getRecommendedStorageType('web');
      expect(storageType).toBe('localstorage');
    });

    it('should return asyncstorage for mobile platforms', () => {
      expect(PlatformDetector.getRecommendedStorageType('ios')).toBe('asyncstorage');
      expect(PlatformDetector.getRecommendedStorageType('android')).toBe('asyncstorage');
    });
  });

  describe('supportsSecureStorage', () => {
    it('should return false for web platform', () => {
      const supportsSecure = PlatformDetector.supportsSecureStorage('web');
      expect(supportsSecure).toBe(false);
    });

    it('should return true for mobile platforms', () => {
      expect(PlatformDetector.supportsSecureStorage('ios')).toBe(true);
      expect(PlatformDetector.supportsSecureStorage('android')).toBe(true);
    });
  });

  describe('getPlatformErrorMessage', () => {
    it('should return appropriate error messages for different platforms', () => {
      const webMessage = PlatformDetector.getPlatformErrorMessage('native_unavailable', 'google', 'web');
      expect(webMessage).toContain('Native google OAuth is not available on web');
      
      const iosMessage = PlatformDetector.getPlatformErrorMessage('native_unavailable', 'google', 'ios');
      expect(iosMessage).toContain('Native google OAuth library not found');
    });

    it('should handle unknown error types', () => {
      const message = PlatformDetector.getPlatformErrorMessage('unknown_error', 'google', 'web');
      expect(message).toBe('Unknown error type: unknown_error');
    });
  });

  describe('getPlatformInfo', () => {
    it('should return comprehensive platform information', () => {
      const info = PlatformDetector.getPlatformInfo();
      
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('capabilities');
      expect(info).toHaveProperty('oauth');
      expect(info).toHaveProperty('storage');
      expect(info).toHaveProperty('timestamp');
      
      expect(info.oauth).toHaveProperty('google');
      expect(info.oauth).toHaveProperty('github');
      expect(info.storage).toHaveProperty('recommended');
      expect(info.storage).toHaveProperty('secure');
    });
  });

  describe('clearCache', () => {
    it('should clear platform detection cache', () => {
      // First call to populate cache
      PlatformDetector.detectPlatform();
      PlatformDetector.getOAuthCapabilities('web');
      
      // Clear cache
      PlatformDetector.clearCache();
      
      // Verify cache is cleared by checking internal state
      expect(PlatformDetector._platformCache).toBeNull();
      expect(PlatformDetector._capabilitiesCache.size).toBe(0);
    });
  });
});