/**
 * Feature Flag Integration Tests
 * Tests the integration of FeatureFlagManager with application components
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import {
    DefaultFeatureFlags,
    FeatureFlagHelpers,
    FeatureFlags,
    initializeFeatureFlags
} from '../../config/featureFlags';
import { featureFlagManager } from '../../services/FeatureFlagManager';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Feature Flag Integration', () => {
  beforeEach(() => {
    // Reset feature flag manager state
    featureFlagManager.resetStats();
    featureFlagManager.setServiceHealth(true);
    
    // Clear fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Flag Initialization', () => {
    test('should initialize with default flags when service is unavailable', async () => {
      // Mock service failure
      fetch.mockRejectedValue(new Error('Service unavailable'));
      
      const result = await initializeFeatureFlags();
      
      // Should still succeed with defaults
      expect(result).toBe(true);
      
      // Check that default flags are set
      const googleOAuthEnabled = await featureFlagManager.getFlag(FeatureFlags.OAUTH_GOOGLE_ENABLED);
      expect(googleOAuthEnabled).toBe(DefaultFeatureFlags[FeatureFlags.OAUTH_GOOGLE_ENABLED]);
    });

    test('should load flags from remote service when available', async () => {
      // Mock successful service response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          flags: [
            { name: FeatureFlags.OAUTH_GOOGLE_ENABLED, enabled: false },
            { name: FeatureFlags.DEBUG_MODE, enabled: true },
          ]
        })
      });
      
      const result = await initializeFeatureFlags();
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/feature-flags'),
        expect.any(Object)
      );
    });
  });

  describe('Feature Flag Helpers', () => {
    test('should check OAuth provider flags correctly', async () => {
      // Set up test flags
      featureFlagManager.setDefaultFlags({
        [FeatureFlags.OAUTH_GOOGLE_ENABLED]: true,
        [FeatureFlags.OAUTH_GITHUB_ENABLED]: false,
      });
      
      const googleEnabled = await FeatureFlagHelpers.isOAuthProviderEnabled('google');
      const githubEnabled = await FeatureFlagHelpers.isOAuthProviderEnabled('github');
      
      expect(googleEnabled).toBe(true);
      expect(githubEnabled).toBe(false);
    });

    test('should handle unknown OAuth providers gracefully', async () => {
      const unknownEnabled = await FeatureFlagHelpers.isOAuthProviderEnabled('unknown');
      expect(unknownEnabled).toBe(false);
    });

    test('should get multiple flags efficiently', async () => {
      const flagNames = [
        FeatureFlags.OAUTH_GOOGLE_ENABLED,
        FeatureFlags.OAUTH_GITHUB_ENABLED,
        FeatureFlags.DEBUG_MODE,
      ];
      
      featureFlagManager.setDefaultFlags({
        [FeatureFlags.OAUTH_GOOGLE_ENABLED]: true,
        [FeatureFlags.OAUTH_GITHUB_ENABLED]: true,
        [FeatureFlags.DEBUG_MODE]: false,
      });
      
      const flags = await FeatureFlagHelpers.getMultipleFlags(flagNames);
      
      expect(flags).toEqual({
        [FeatureFlags.OAUTH_GOOGLE_ENABLED]: true,
        [FeatureFlags.OAUTH_GITHUB_ENABLED]: true,
        [FeatureFlags.DEBUG_MODE]: false,
      });
    });
  });

  describe('Graceful Degradation', () => {
    test('should use fallback values when service fails', async () => {
      // Mock service failure
      fetch.mockRejectedValue(new Error('Network error'));
      
      // Set default flags
      featureFlagManager.setDefaultFlags(DefaultFeatureFlags);
      
      // Should get default value even when service fails
      const resumeTemplatesEnabled = await featureFlagManager.getFlag(FeatureFlags.RESUME_TEMPLATES_ENABLED);
      expect(resumeTemplatesEnabled).toBe(DefaultFeatureFlags[FeatureFlags.RESUME_TEMPLATES_ENABLED]);
      
      // Should track fallback usage
      const stats = featureFlagManager.getStats();
      expect(stats.fallbackCount).toBeGreaterThan(0);
    });

    test('should maintain core functionality when flags are unavailable', async () => {
      // Simulate complete service failure
      featureFlagManager.setServiceHealth(false);
      
      // Core features should still work with defaults
      const coreFlags = await FeatureFlagHelpers.getMultipleFlags([
        FeatureFlags.OAUTH_GOOGLE_ENABLED,
        FeatureFlags.OAUTH_GITHUB_ENABLED,
        FeatureFlags.RESUME_TEMPLATES_ENABLED,
        FeatureFlags.COVER_LETTER_GENERATION,
      ]);
      
      // All core features should have values (either from cache or defaults)
      Object.values(coreFlags).forEach(flagValue => {
        expect(typeof flagValue).toBe('boolean');
      });
    });
  });

  describe('Caching Behavior', () => {
    test('should cache successful flag retrievals', async () => {
      // Mock successful service response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          name: FeatureFlags.DEBUG_MODE,
          enabled: true,
        })
      });
      
      // First call should hit service
      const firstResult = await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
      expect(firstResult).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const secondResult = await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
      expect(secondResult).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1); // No additional calls
      
      // Check cache statistics
      const stats = featureFlagManager.getStats();
      expect(stats.cache.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      fetch.mockRejectedValue(new Error('Failed to fetch'));
      
      // Should not throw, should return fallback value
      const result = await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
      expect(typeof result).toBe('boolean');
      
      // Should track error
      const stats = featureFlagManager.getStats();
      expect(stats.errorCount).toBeGreaterThan(0);
      expect(stats.serviceHealthy).toBe(false);
    });

    test('should handle malformed service responses', async () => {
      // Mock malformed response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });
      
      // Should handle gracefully and use fallback
      const result = await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Performance Monitoring', () => {
    test('should track request statistics', async () => {
      // Make several requests
      await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
      await featureFlagManager.getFlag(FeatureFlags.OAUTH_GOOGLE_ENABLED);
      await featureFlagManager.getAllFlags();
      
      const stats = featureFlagManager.getStats();
      
      expect(stats.requestCount).toBeGreaterThan(0);
      expect(typeof stats.errorRate).toBe('number');
      expect(typeof stats.fallbackRate).toBe('number');
      expect(stats.cache).toBeDefined();
      expect(typeof stats.cache.hitRate).toBe('number');
    });
  });
});

describe('Feature Flag Manager Health', () => {
  test('should provide health status information', () => {
    const stats = featureFlagManager.getStats();
    
    expect(stats).toHaveProperty('serviceHealthy');
    expect(stats).toHaveProperty('lastServiceCheck');
    expect(stats).toHaveProperty('requestCount');
    expect(stats).toHaveProperty('errorCount');
    expect(stats).toHaveProperty('fallbackCount');
    expect(stats).toHaveProperty('cache');
    expect(stats).toHaveProperty('configuration');
  });

  test('should allow manual health status updates', () => {
    featureFlagManager.setServiceHealth(false);
    let stats = featureFlagManager.getStats();
    expect(stats.serviceHealthy).toBe(false);
    
    featureFlagManager.setServiceHealth(true);
    stats = featureFlagManager.getStats();
    expect(stats.serviceHealthy).toBe(true);
  });
});