/**
 * useOAuth Hook
 * Custom hook for OAuth authentication operations
 * Requirements: 1.5, 2.5, 4.1, 4.3
 */

import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { OAuthService } from '../services/OAuthService';

/**
 * Custom hook for OAuth operations
 * @returns {Object} OAuth operations and state
 */
export const useOAuth = () => {
  const { loginWithOAuth, linkOAuthProvider, unlinkOAuthProvider } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sign in with OAuth provider
   */
  const signInWithOAuth = async (provider, oauthData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginWithOAuth(provider, oauthData);
      
      if (!result.ok) {
        setError({
          message: result.message,
          type: result.errorType,
          details: result.details,
        });
      }
      
      return result;
    } catch (err) {
      const error = {
        message: `Failed to sign in with ${provider}`,
        type: 'network_error',
      };
      setError(error);
      return { ok: false, ...error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Link OAuth provider to existing account
   */
  const linkProvider = async (provider, oauthData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await linkOAuthProvider(provider, oauthData);
      
      if (!result.ok) {
        setError({
          message: result.message,
          type: result.errorType,
          details: result.details,
        });
      }
      
      return result;
    } catch (err) {
      const error = {
        message: `Failed to link ${provider} account`,
        type: 'network_error',
      };
      setError(error);
      return { ok: false, ...error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unlink OAuth provider from account
   */
  const unlinkProvider = async (provider) => {
    setLoading(true);
    setError(null);

    try {
      // Clear provider data locally first
      await OAuthService.clearProviderData(provider);
      
      // Then unlink on server
      const result = await unlinkOAuthProvider(provider);
      
      if (!result.ok) {
        setError({
          message: result.message,
          type: result.errorType,
        });
      }
      
      return result;
    } catch (err) {
      const error = {
        message: `Failed to unlink ${provider} account`,
        type: 'network_error',
      };
      setError(error);
      return { ok: false, ...error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get OAuth status for all providers
   */
  const getOAuthStatus = async () => {
    try {
      return await OAuthService.getOAuthStatus();
    } catch (err) {
      console.error('Failed to get OAuth status:', err);
      return {
        google: { hasLocalData: false, isSignedIn: false },
        github: { hasLocalData: false, isSignedIn: false },
        hasOAuthSession: false,
        error: err.message,
      };
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // Operations
    signInWithOAuth,
    linkProvider,
    unlinkProvider,
    getOAuthStatus,
    
    // State
    loading,
    error,
    
    // Utilities
    clearError,
  };
};

export default useOAuth;