/**
 * Feature Flag Configuration
 * Centralized configuration for all feature flags used in the application
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { featureFlagManager } from '../services/FeatureFlagManager.js';

/**
 * Feature flag names - centralized constants to avoid typos
 */
export const FeatureFlags = {
  // Authentication features
  OAUTH_GOOGLE_ENABLED: 'oauth_google_enabled',
  OAUTH_GITHUB_ENABLED: 'oauth_github_enabled',
  REMEMBER_ME_ENABLED: 'remember_me_enabled',
  PASSWORD_VALIDATION_HIBP: 'password_validation_hibp',
  
  // UI/UX features
  LIVE_EDIT_DEMO: 'live_edit_demo',
  ENHANCED_ANIMATIONS: 'enhanced_animations',
  ACCESSIBILITY_FEATURES: 'accessibility_features',
  
  // Resume features
  RESUME_TEMPLATES_ENABLED: 'resume_templates_enabled',
  AI_SUGGESTIONS_ENABLED: 'ai_suggestions_enabled',
  RESUME_UPLOAD_ENABLED: 'resume_upload_enabled',
  
  // Cover letter features
  COVER_LETTER_GENERATION: 'cover_letter_generation',
  JOB_DESCRIPTION_PARSING: 'job_description_parsing',
  
  // Performance features
  CACHING_ENABLED: 'caching_enabled',
  OFFLINE_MODE: 'offline_mode',
  
  // Debug features
  DEBUG_MODE: 'debug_mode',
  PERFORMANCE_MONITORING: 'performance_monitoring',
};

/**
 * Default feature flag values
 * These are used when the remote service is unavailable
 * Requirements: 3.1 - Use default flag values when remote service is unavailable
 */
export const DefaultFeatureFlags = {
  // Authentication features - enable core auth features by default
  [FeatureFlags.OAUTH_GOOGLE_ENABLED]: true,
  [FeatureFlags.OAUTH_GITHUB_ENABLED]: true,
  [FeatureFlags.REMEMBER_ME_ENABLED]: true,
  [FeatureFlags.PASSWORD_VALIDATION_HIBP]: true,
  
  // UI/UX features - enable basic features, disable experimental ones
  [FeatureFlags.LIVE_EDIT_DEMO]: false, // Experimental feature
  [FeatureFlags.ENHANCED_ANIMATIONS]: true,
  [FeatureFlags.ACCESSIBILITY_FEATURES]: true,
  
  // Resume features - enable core functionality
  [FeatureFlags.RESUME_TEMPLATES_ENABLED]: true,
  [FeatureFlags.AI_SUGGESTIONS_ENABLED]: true,
  [FeatureFlags.RESUME_UPLOAD_ENABLED]: true,
  
  // Cover letter features - enable core functionality
  [FeatureFlags.COVER_LETTER_GENERATION]: true,
  [FeatureFlags.JOB_DESCRIPTION_PARSING]: true,
  
  // Performance features - enable for better UX
  [FeatureFlags.CACHING_ENABLED]: true,
  [FeatureFlags.OFFLINE_MODE]: false, // Disable by default for stability
  
  // Debug features - disable by default
  [FeatureFlags.DEBUG_MODE]: false,
  [FeatureFlags.PERFORMANCE_MONITORING]: false,
};

/**
 * Initialize feature flag manager with default values
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export const initializeFeatureFlags = async () => {
  try {
    // Set default flags for fallback scenarios
    featureFlagManager.setDefaultFlags(DefaultFeatureFlags);
    
    // Try to refresh flags from remote service
    const refreshSuccess = await featureFlagManager.refreshFlags();
    
    if (refreshSuccess) {
      console.info('Feature flags loaded from remote service');
    } else {
      console.info('Using default feature flags (remote service unavailable)');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize feature flags:', error);
    
    // Ensure defaults are set even if initialization fails
    featureFlagManager.setDefaultFlags(DefaultFeatureFlags);
    return false;
  }
};

/**
 * Feature flag helper functions for common use cases
 */
export class FeatureFlagHelpers {
  /**
   * Check if OAuth provider is enabled
   * @param {string} provider - OAuth provider name ('google' or 'github')
   * @returns {Promise<boolean>} True if provider is enabled
   */
  static async isOAuthProviderEnabled(provider) {
    try {
      switch (provider.toLowerCase()) {
        case 'google':
          return await featureFlagManager.getFlag(FeatureFlags.OAUTH_GOOGLE_ENABLED);
        case 'github':
          return await featureFlagManager.getFlag(FeatureFlags.OAUTH_GITHUB_ENABLED);
        default:
          console.warn(`Unknown OAuth provider: ${provider}`);
          return false;
      }
    } catch (error) {
      console.error(`Error checking OAuth provider ${provider}:`, error);
      // Fallback to default values
      return DefaultFeatureFlags[
        provider.toLowerCase() === 'google' 
          ? FeatureFlags.OAUTH_GOOGLE_ENABLED 
          : FeatureFlags.OAUTH_GITHUB_ENABLED
      ] || false;
    }
  }

  /**
   * Check if a resume feature is enabled
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>} True if feature is enabled
   */
  static async isResumeFeatureEnabled(feature) {
    try {
      const flagName = `resume_${feature}_enabled`;
      return await featureFlagManager.getFlag(flagName);
    } catch (error) {
      console.error(`Error checking resume feature ${feature}:`, error);
      return true; // Default to enabled for core features
    }
  }

  /**
   * Check if debug features should be shown
   * @returns {Promise<boolean>} True if debug mode is enabled
   */
  static async isDebugMode() {
    try {
      return await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
    } catch (error) {
      console.error('Error checking debug mode:', error);
      return false; // Default to disabled
    }
  }

  /**
   * Get all enabled features for a category
   * @param {string} category - Feature category ('auth', 'resume', 'ui', etc.)
   * @returns {Promise<Object>} Object with feature names and their enabled status
   */
  static async getCategoryFeatures(category) {
    try {
      const allFlags = await featureFlagManager.getAllFlags();
      const categoryFlags = {};
      
      for (const [flagName, enabled] of Object.entries(allFlags)) {
        if (flagName.startsWith(category)) {
          categoryFlags[flagName] = enabled;
        }
      }
      
      return categoryFlags;
    } catch (error) {
      console.error(`Error getting ${category} features:`, error);
      return {};
    }
  }

  /**
   * Check multiple flags at once
   * @param {string[]} flagNames - Array of flag names to check
   * @returns {Promise<Object>} Object with flag names and their values
   */
  static async getMultipleFlags(flagNames) {
    try {
      const results = {};
      
      // Use Promise.all for better performance
      const flagPromises = flagNames.map(async (flagName) => {
        const value = await featureFlagManager.getFlag(flagName);
        return { flagName, value };
      });
      
      const flagResults = await Promise.all(flagPromises);
      
      for (const { flagName, value } of flagResults) {
        results[flagName] = value;
      }
      
      return results;
    } catch (error) {
      console.error('Error getting multiple flags:', error);
      
      // Return default values for all requested flags
      const defaults = {};
      for (const flagName of flagNames) {
        defaults[flagName] = DefaultFeatureFlags[flagName] || false;
      }
      return defaults;
    }
  }
}

/**
 * Feature flag context for React components
 * Provides a way to access feature flags in components with automatic fallbacks
 */
export class FeatureFlagContext {
  /**
   * Get feature flag with automatic error handling and fallback
   * @param {string} flagName - Feature flag name
   * @param {boolean} defaultValue - Default value if flag retrieval fails
   * @returns {Promise<boolean>} Flag value or default
   */
  static async getFlag(flagName, defaultValue = false) {
    try {
      return await featureFlagManager.getFlag(flagName);
    } catch (error) {
      console.error(`Feature flag error for ${flagName}:`, error);
      
      // Use configured default if available, otherwise use provided default
      return DefaultFeatureFlags[flagName] !== undefined 
        ? DefaultFeatureFlags[flagName] 
        : defaultValue;
    }
  }

  /**
   * Get feature flag manager statistics for debugging
   * @returns {Object} Manager statistics
   */
  static getStats() {
    return featureFlagManager.getStats();
  }

  /**
   * Manually refresh feature flags from remote service
   * @returns {Promise<boolean>} Success status
   */
  static async refreshFlags() {
    try {
      return await featureFlagManager.refreshFlags();
    } catch (error) {
      console.error('Error refreshing feature flags:', error);
      return false;
    }
  }
}

export default {
  FeatureFlags,
  DefaultFeatureFlags,
  initializeFeatureFlags,
  FeatureFlagHelpers,
  FeatureFlagContext,
};