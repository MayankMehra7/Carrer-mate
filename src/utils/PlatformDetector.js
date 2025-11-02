/**
 * Platform Detector Utility
 * Identifies current runtime platform and available OAuth capabilities
 * Requirements: 2.1, 2.2, 4.4
 */

import { Platform } from 'react-native';

/**
 * Platform detection and OAuth capability management
 */
export class PlatformDetector {
  // Cache platform detection results for performance
  static _platformCache = null;
  static _capabilitiesCache = new Map();

  /**
   * Detect current runtime platform
   * @returns {'ios' | 'android' | 'web'} Current platform
   */
  static detectPlatform() {
    if (this._platformCache) {
      return this._platformCache;
    }

    let detectedPlatform;

    try {
      // Check if we're in a React Native environment
      if (Platform && Platform.OS) {
        detectedPlatform = Platform.OS === 'web' ? 'web' : Platform.OS;
      } else {
        // Fallback for web-only environments
        detectedPlatform = 'web';
      }
    } catch (error) {
      // If Platform is not available, assume web
      console.warn('Platform detection failed, defaulting to web:', error);
      detectedPlatform = 'web';
    }

    // Validate platform value
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(detectedPlatform)) {
      console.warn(`Unknown platform detected: ${detectedPlatform}, defaulting to web`);
      detectedPlatform = 'web';
    }

    this._platformCache = detectedPlatform;
    return detectedPlatform;
  }

  /**
   * Get OAuth capabilities for a specific platform
   * @param {string} platform - Platform to check capabilities for
   * @returns {Object} OAuth capabilities object
   */
  static getOAuthCapabilities(platform = null) {
    const targetPlatform = platform || this.detectPlatform();
    
    // Check cache first
    if (this._capabilitiesCache.has(targetPlatform)) {
      return this._capabilitiesCache.get(targetPlatform);
    }

    const capabilities = this._buildCapabilities(targetPlatform);
    this._capabilitiesCache.set(targetPlatform, capabilities);
    
    return capabilities;
  }

  /**
   * Build capabilities object for a platform
   * @private
   * @param {string} platform - Platform to build capabilities for
   * @returns {Object} Capabilities object
   */
  static _buildCapabilities(platform) {
    const baseCapabilities = {
      platform,
      nativeGoogleSignIn: false,
      webOAuth: false,
      tokenStorage: 'localstorage',
      asyncStorage: false,
      sessionStorage: false,
      localStorage: false,
      secureStorage: false,
      biometricAuth: false,
      deepLinking: false,
      pushNotifications: false
    };

    switch (platform) {
      case 'ios':
        return {
          ...baseCapabilities,
          nativeGoogleSignIn: this._checkGoogleSignInAvailability(),
          tokenStorage: 'asyncstorage',
          asyncStorage: true,
          secureStorage: true,
          biometricAuth: true,
          deepLinking: true,
          pushNotifications: true
        };

      case 'android':
        return {
          ...baseCapabilities,
          nativeGoogleSignIn: this._checkGoogleSignInAvailability(),
          tokenStorage: 'asyncstorage',
          asyncStorage: true,
          secureStorage: true,
          biometricAuth: true,
          deepLinking: true,
          pushNotifications: true
        };

      case 'web':
        return {
          ...baseCapabilities,
          nativeGoogleSignIn: false,
          webOAuth: true,
          tokenStorage: 'localstorage',
          localStorage: this._checkWebStorageAvailability('localStorage'),
          sessionStorage: this._checkWebStorageAvailability('sessionStorage'),
          deepLinking: true
        };

      default:
        console.warn(`Unknown platform: ${platform}, returning minimal capabilities`);
        return baseCapabilities;
    }
  }

  /**
   * Check if native Google Sign-In is available
   * @private
   * @returns {boolean} True if GoogleSignin is available
   */
  static _checkGoogleSignInAvailability() {
    try {
      // Try to import GoogleSignin to check availability
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      return GoogleSignin && typeof GoogleSignin.isSignedIn === 'function';
    } catch (error) {
      // GoogleSignin not available (likely web platform or not installed)
      return false;
    }
  }

  /**
   * Check if web storage is available
   * @private
   * @param {string} storageType - 'localStorage' or 'sessionStorage'
   * @returns {boolean} True if storage is available
   */
  static _checkWebStorageAvailability(storageType) {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const storage = window[storageType];
      if (!storage) {
        return false;
      }

      // Test storage functionality
      const testKey = '__platform_detector_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      // Storage not available (private browsing, etc.)
      return false;
    }
  }

  /**
   * Check if native OAuth is available for a specific provider
   * @param {string} provider - OAuth provider ('google', 'github', etc.)
   * @param {string} platform - Platform to check (optional, defaults to current)
   * @returns {boolean} True if native OAuth is available
   */
  static isNativeOAuthAvailable(provider, platform = null) {
    const targetPlatform = platform || this.detectPlatform();
    const capabilities = this.getOAuthCapabilities(targetPlatform);

    switch (provider.toLowerCase()) {
      case 'google':
        return capabilities.nativeGoogleSignIn;
      
      case 'github':
        // GitHub OAuth is typically web-based across all platforms
        return false;
      
      default:
        console.warn(`Unknown OAuth provider: ${provider}`);
        return false;
    }
  }

  /**
   * Get platform-specific OAuth configuration
   * @param {string} provider - OAuth provider
   * @param {string} platform - Platform (optional, defaults to current)
   * @returns {Object} Platform-specific OAuth configuration
   */
  static getOAuthConfig(provider, platform = null) {
    const targetPlatform = platform || this.detectPlatform();
    
    const configs = {
      google: {
        ios: {
          preferredMethod: 'native',
          fallbackMethods: ['web'],
          requiresClientId: true,
          supportsOfflineAccess: true
        },
        android: {
          preferredMethod: 'native',
          fallbackMethods: ['web'],
          requiresClientId: true,
          supportsOfflineAccess: true
        },
        web: {
          preferredMethod: 'web',
          fallbackMethods: ['fallback'],
          requiresClientId: true,
          supportsOfflineAccess: false
        }
      },
      github: {
        ios: {
          preferredMethod: 'web',
          fallbackMethods: ['fallback'],
          requiresClientId: true,
          supportsOfflineAccess: false
        },
        android: {
          preferredMethod: 'web',
          fallbackMethods: ['fallback'],
          requiresClientId: true,
          supportsOfflineAccess: false
        },
        web: {
          preferredMethod: 'web',
          fallbackMethods: ['fallback'],
          requiresClientId: true,
          supportsOfflineAccess: false
        }
      }
    };

    const providerConfigs = configs[provider.toLowerCase()];
    if (!providerConfigs) {
      console.warn(`No OAuth config found for provider: ${provider}`);
      return null;
    }

    return providerConfigs[targetPlatform] || null;
  }

  /**
   * Get recommended storage type for current platform
   * @param {string} platform - Platform (optional, defaults to current)
   * @returns {string} Recommended storage type
   */
  static getRecommendedStorageType(platform = null) {
    const capabilities = this.getOAuthCapabilities(platform);
    return capabilities.tokenStorage;
  }

  /**
   * Check if current environment supports secure storage
   * @param {string} platform - Platform (optional, defaults to current)
   * @returns {boolean} True if secure storage is available
   */
  static supportsSecureStorage(platform = null) {
    const capabilities = this.getOAuthCapabilities(platform);
    return capabilities.secureStorage;
  }

  /**
   * Get platform-specific error messages
   * @param {string} errorType - Type of error
   * @param {string} provider - OAuth provider
   * @param {string} platform - Platform (optional, defaults to current)
   * @returns {string} Platform-specific error message
   */
  static getPlatformErrorMessage(errorType, provider, platform = null) {
    const targetPlatform = platform || this.detectPlatform();
    
    const messages = {
      native_unavailable: {
        web: `Native ${provider} OAuth is not available on web. Using web-based authentication.`,
        ios: `Native ${provider} OAuth library not found. Please ensure it's properly installed.`,
        android: `Native ${provider} OAuth library not found. Please ensure it's properly installed.`
      },
      storage_unavailable: {
        web: 'Browser storage is disabled. OAuth session may not persist.',
        ios: 'Secure storage is not available. Using fallback storage method.',
        android: 'Secure storage is not available. Using fallback storage method.'
      },
      platform_unsupported: {
        web: `${provider} OAuth has limited support on web platform.`,
        ios: `${provider} OAuth configuration may need adjustment for iOS.`,
        android: `${provider} OAuth configuration may need adjustment for Android.`
      }
    };

    const errorMessages = messages[errorType];
    if (!errorMessages) {
      return `Unknown error type: ${errorType}`;
    }

    return errorMessages[targetPlatform] || `Platform-specific error: ${errorType}`;
  }

  /**
   * Clear platform detection cache (useful for testing)
   * @static
   */
  static clearCache() {
    this._platformCache = null;
    this._capabilitiesCache.clear();
  }

  /**
   * Get comprehensive platform information for debugging
   * @returns {Object} Complete platform information
   */
  static getPlatformInfo() {
    const platform = this.detectPlatform();
    const capabilities = this.getOAuthCapabilities(platform);
    
    return {
      platform,
      capabilities,
      oauth: {
        google: this.getOAuthConfig('google', platform),
        github: this.getOAuthConfig('github', platform)
      },
      storage: {
        recommended: this.getRecommendedStorageType(platform),
        secure: this.supportsSecureStorage(platform)
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default PlatformDetector;