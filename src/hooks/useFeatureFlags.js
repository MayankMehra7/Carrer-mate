/**
 * useFeatureFlags Hook
 * React hook for accessing feature flags with automatic error handling and fallbacks
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { useCallback, useEffect, useState } from 'react';
import { FeatureFlagContext, FeatureFlagHelpers } from '../config/featureFlags';
import { featureFlagManager } from '../services/FeatureFlagManager';

/**
 * Hook for accessing a single feature flag
 * @param {string} flagName - Name of the feature flag
 * @param {boolean} defaultValue - Default value if flag is unavailable
 * @returns {Object} Flag state and utilities
 */
export const useFeatureFlag = (flagName, defaultValue = false) => {
  const [flagValue, setFlagValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('default');

  // Load feature flag value
  useEffect(() => {
    const loadFlag = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const value = await FeatureFlagContext.getFlag(flagName, defaultValue);
        const flagSource = featureFlagManager.getFlagSource(flagName) || 'default';
        
        setFlagValue(value);
        setSource(flagSource);
      } catch (err) {
        console.error(`Error loading feature flag ${flagName}:`, err);
        setError(err.message);
        setFlagValue(defaultValue);
        setSource('error_fallback');
      } finally {
        setLoading(false);
      }
    };

    loadFlag();
  }, [flagName, defaultValue]);

  // Refresh flag value
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const value = await FeatureFlagContext.getFlag(flagName, defaultValue);
      const flagSource = featureFlagManager.getFlagSource(flagName) || 'default';
      
      setFlagValue(value);
      setSource(flagSource);
      return true;
    } catch (err) {
      console.error(`Error refreshing feature flag ${flagName}:`, err);
      setError(err.message);
      return false;
    }
  }, [flagName, defaultValue]);

  return {
    value: flagValue,
    loading,
    error,
    source,
    refresh,
    isEnabled: flagValue === true,
    isDisabled: flagValue === false,
  };
};

/**
 * Hook for accessing multiple feature flags
 * @param {string[]} flagNames - Array of feature flag names
 * @param {Object} defaultValues - Default values for flags
 * @returns {Object} Flags state and utilities
 */
export const useFeatureFlags = (flagNames, defaultValues = {}) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all feature flags
  useEffect(() => {
    const loadFlags = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const flagValues = await FeatureFlagHelpers.getMultipleFlags(flagNames);
        
        // Apply default values for missing flags
        const finalFlags = {};
        for (const flagName of flagNames) {
          finalFlags[flagName] = flagValues[flagName] !== undefined 
            ? flagValues[flagName] 
            : (defaultValues[flagName] || false);
        }
        
        setFlags(finalFlags);
      } catch (err) {
        console.error('Error loading feature flags:', err);
        setError(err.message);
        
        // Set all flags to their default values
        const fallbackFlags = {};
        for (const flagName of flagNames) {
          fallbackFlags[flagName] = defaultValues[flagName] || false;
        }
        setFlags(fallbackFlags);
      } finally {
        setLoading(false);
      }
    };

    if (flagNames.length > 0) {
      loadFlags();
    }
  }, [flagNames, defaultValues]);

  // Refresh all flags
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const flagValues = await FeatureFlagHelpers.getMultipleFlags(flagNames);
      
      const finalFlags = {};
      for (const flagName of flagNames) {
        finalFlags[flagName] = flagValues[flagName] !== undefined 
          ? flagValues[flagName] 
          : (defaultValues[flagName] || false);
      }
      
      setFlags(finalFlags);
      return true;
    } catch (err) {
      console.error('Error refreshing feature flags:', err);
      setError(err.message);
      return false;
    }
  }, [flagNames, defaultValues]);

  // Get specific flag value
  const getFlag = useCallback((flagName) => {
    return flags[flagName] !== undefined ? flags[flagName] : (defaultValues[flagName] || false);
  }, [flags, defaultValues]);

  // Check if flag is enabled
  const isEnabled = useCallback((flagName) => {
    return getFlag(flagName) === true;
  }, [getFlag]);

  // Check if flag is disabled
  const isDisabled = useCallback((flagName) => {
    return getFlag(flagName) === false;
  }, [getFlag]);

  return {
    flags,
    loading,
    error,
    refresh,
    getFlag,
    isEnabled,
    isDisabled,
  };
};

/**
 * Hook for OAuth provider feature flags
 * @returns {Object} OAuth provider states
 */
export const useOAuthFeatureFlags = () => {
  const { flags, loading, error, refresh } = useFeatureFlags([
    'oauth_google_enabled',
    'oauth_github_enabled',
  ], {
    oauth_google_enabled: true,
    oauth_github_enabled: true,
  });

  return {
    googleEnabled: flags.oauth_google_enabled,
    githubEnabled: flags.oauth_github_enabled,
    anyOAuthEnabled: flags.oauth_google_enabled || flags.oauth_github_enabled,
    loading,
    error,
    refresh,
  };
};

/**
 * Hook for resume feature flags
 * @returns {Object} Resume feature states
 */
export const useResumeFeatureFlags = () => {
  const { flags, loading, error, refresh } = useFeatureFlags([
    'resume_templates_enabled',
    'ai_suggestions_enabled',
    'resume_upload_enabled',
  ], {
    resume_templates_enabled: true,
    ai_suggestions_enabled: true,
    resume_upload_enabled: true,
  });

  return {
    templatesEnabled: flags.resume_templates_enabled,
    aiSuggestionsEnabled: flags.ai_suggestions_enabled,
    uploadEnabled: flags.resume_upload_enabled,
    loading,
    error,
    refresh,
  };
};

/**
 * Hook for cover letter feature flags
 * @returns {Object} Cover letter feature states
 */
export const useCoverLetterFeatureFlags = () => {
  const { flags, loading, error, refresh } = useFeatureFlags([
    'cover_letter_generation',
    'job_description_parsing',
  ], {
    cover_letter_generation: true,
    job_description_parsing: true,
  });

  return {
    generationEnabled: flags.cover_letter_generation,
    jobDescriptionParsingEnabled: flags.job_description_parsing,
    anyFeatureEnabled: flags.cover_letter_generation || flags.job_description_parsing,
    loading,
    error,
    refresh,
  };
};

/**
 * Hook for debug and development feature flags
 * @returns {Object} Debug feature states
 */
export const useDebugFeatureFlags = () => {
  const { flags, loading, error, refresh } = useFeatureFlags([
    'debug_mode',
    'performance_monitoring',
    'live_edit_demo',
  ], {
    debug_mode: false,
    performance_monitoring: false,
    live_edit_demo: false,
  });

  return {
    debugMode: flags.debug_mode,
    performanceMonitoring: flags.performance_monitoring,
    liveEditDemo: flags.live_edit_demo,
    loading,
    error,
    refresh,
  };
};

/**
 * Hook for feature flag manager statistics and health
 * @returns {Object} Manager statistics and utilities
 */
export const useFeatureFlagStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const managerStats = featureFlagManager.getStats();
      setStats(managerStats);
    } catch (error) {
      console.error('Error loading feature flag stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh flags from remote service
  const refreshFlags = useCallback(async () => {
    try {
      const success = await FeatureFlagContext.refreshFlags();
      await loadStats(); // Reload stats after refresh
      return success;
    } catch (error) {
      console.error('Error refreshing feature flags:', error);
      return false;
    }
  }, [loadStats]);

  // Reset statistics
  const resetStats = useCallback(() => {
    featureFlagManager.resetStats();
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    loadStats,
    refreshFlags,
    resetStats,
    isHealthy: stats?.serviceHealthy || false,
    errorRate: stats?.errorRate || 0,
    cacheHitRate: stats?.cache?.hitRate || 0,
  };
};

export default {
  useFeatureFlag,
  useFeatureFlags,
  useOAuthFeatureFlags,
  useResumeFeatureFlags,
  useCoverLetterFeatureFlags,
  useDebugFeatureFlags,
  useFeatureFlagStats,
};