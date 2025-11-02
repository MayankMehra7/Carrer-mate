/**
 * OAuth Service Platform Compatibility Tests
 * Tests the integration of PlatformDetector with OAuthService
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock GoogleSignin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    isSignedIn: jest.fn(),
    signOut: jest.fn(),
  }
}));

// Mock PlatformDetector BEFORE importing OAuthService
jest.mock('../../utils/PlatformDetector', () => ({
  PlatformDetector: {
    isNativeOAuthAvailable: jest.fn(),
    detectPlatform: jest.fn(() => 'web'),
  }
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { PlatformDetector } from '../../utils/PlatformDetector';
import { OAuthService } from '../OAuthService';

describe('OAuthService Platform Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signOutGoogle', () => {
    it('should use native Google Sign-In when available', async () => {
      // Mock native availability
      PlatformDetector.isNativeOAuthAvailable.mockReturnValue(true);
      GoogleSignin.isSignedIn.mockResolvedValue(true);
      GoogleSignin.signOut.mockResolvedValue();
      AsyncStorage.removeItem.mockResolvedValue();

      const result = await OAuthService.signOutGoogle();

      expect(PlatformDetector.isNativeOAuthAvailable).toHaveBeenCalledWith('google');
      expect(GoogleSignin.isSignedIn).toHaveBeenCalled();
      expect(GoogleSignin.signOut).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('google_oauth_data');
      expect(result.success).toBe(true);
    });

    it('should use fallback method when native Google Sign-In is not available', async () => {
      // Mock web platform (no native availability)
      PlatformDetector.isNativeOAuthAvailable.mockReturnValue(false);
      AsyncStorage.removeItem.mockResolvedValue();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await OAuthService.signOutGoogle();

      expect(PlatformDetector.isNativeOAuthAvailable).toHaveBeenCalledWith('google');
      expect(GoogleSignin.isSignedIn).not.toHaveBeenCalled();
      expect(GoogleSignin.signOut).not.toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('google_oauth_data');
      expect(consoleSpy).toHaveBeenCalledWith('Native Google Sign-In not available on this platform, using fallback method');
      expect(result.success).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully and still clear local data', async () => {
      PlatformDetector.isNativeOAuthAvailable.mockReturnValue(true);
      GoogleSignin.isSignedIn.mockRejectedValue(new Error('Network error'));
      AsyncStorage.removeItem.mockResolvedValue();

      const result = await OAuthService.signOutGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('google_oauth_data');
    });
  });

  describe('getOAuthStatus', () => {
    it('should use native status check when available', async () => {
      PlatformDetector.isNativeOAuthAvailable.mockReturnValue(true);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'google_oauth_data') return Promise.resolve('{"token": "test"}');
        if (key === 'github_oauth_data') return Promise.resolve(null);
        if (key === 'oauth_session') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      GoogleSignin.isSignedIn.mockResolvedValue(true);

      const result = await OAuthService.getOAuthStatus();

      expect(PlatformDetector.isNativeOAuthAvailable).toHaveBeenCalledWith('google');
      expect(GoogleSignin.isSignedIn).toHaveBeenCalled();
      expect(result.google.isSignedIn).toBe(true);
      expect(result.google.hasLocalData).toBe(true);
    });

    it('should use fallback status check when native is not available', async () => {
      PlatformDetector.isNativeOAuthAvailable.mockReturnValue(false);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'google_oauth_data') return Promise.resolve('{"token": "test"}');
        if (key === 'github_oauth_data') return Promise.resolve(null);
        if (key === 'oauth_session') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const result = await OAuthService.getOAuthStatus();

      expect(PlatformDetector.isNativeOAuthAvailable).toHaveBeenCalledWith('google');
      expect(GoogleSignin.isSignedIn).not.toHaveBeenCalled();
      expect(result.google.isSignedIn).toBe(true); // Based on local data
      expect(result.google.hasLocalData).toBe(true);
    });

    it('should handle missing local data correctly', async () => {
      PlatformDetector.isNativeOAuthAvailable.mockReturnValue(false);
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await OAuthService.getOAuthStatus();

      expect(result.google.isSignedIn).toBe(false);
      expect(result.google.hasLocalData).toBe(false);
      expect(result.github.hasLocalData).toBe(false);
    });
  });
});