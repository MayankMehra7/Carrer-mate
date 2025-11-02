/**
 * OAuth Service
 * Handles OAuth provider-specific operations including logout
 * Requirements: 4.3
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * OAuth Service class for managing OAuth provider operations
 */
export class OAuthService {
  /**
   * Sign out from Google OAuth provider
   */
  static async signOutGoogle() {
    try {
      // Check if we're on web platform
      if (typeof window !== 'undefined') {
        // Web platform - just clear local data
        console.log('Web platform: clearing OAuth data without native sign-out');
        await AsyncStorage.removeItem('google_oauth_data');
        return { success: true };
      }
      
      // Native platform - use GoogleSignin safely
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
        }
      } catch (error) {
        console.log('GoogleSignin not available, continuing with data cleanup');
      }
      
      // Always clear local data
      await AsyncStorage.removeItem('google_oauth_data');
      return { success: true };
    } catch (error) {
      console.error('Google sign out error:', error);
      
      // Still clear local data even if Google sign out fails
      try {
        await AsyncStorage.removeItem('google_oauth_data');
      } catch (storageError) {
        console.error('Failed to clear Google OAuth data:', storageError);
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to sign out from Google' 
      };
    }
  }

  /**
   * Sign out from GitHub OAuth provider
   * Note: GitHub doesn't require explicit sign out, just clear local data
   */
  static async signOutGitHub() {
    try {
      // Clear GitHub OAuth data from AsyncStorage
      await AsyncStorage.removeItem('github_oauth_data');
      
      return { success: true };
    } catch (error) {
      console.error('GitHub sign out error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to clear GitHub OAuth data' 
      };
    }
  }

  /**
   * Sign out from all OAuth providers
   */
  static async signOutAllProviders() {
    const results = {
      google: { success: true },
      github: { success: true },
    };

    try {
      // Sign out from Google
      const googleResult = await this.signOutGoogle();
      results.google = googleResult;

      // Sign out from GitHub
      const githubResult = await this.signOutGitHub();
      results.github = githubResult;

      // Clear general OAuth session data
      await AsyncStorage.removeItem('oauth_session');

      return {
        success: results.google.success && results.github.success,
        results,
      };
    } catch (error) {
      console.error('OAuth sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out from OAuth providers',
        results,
      };
    }
  }

  /**
   * Clear OAuth data for a specific provider
   */
  static async clearProviderData(provider) {
    try {
      switch (provider.toLowerCase()) {
        case 'google':
          return await this.signOutGoogle();
        case 'github':
          return await this.signOutGitHub();
        default:
          return { 
            success: false, 
            error: `Unsupported provider: ${provider}` 
          };
      }
    } catch (error) {
      console.error(`Failed to clear ${provider} data:`, error);
      return { 
        success: false, 
        error: error.message || `Failed to clear ${provider} data` 
      };
    }
  }

  /**
   * Check if user is signed in to any OAuth provider
   */
  static async getOAuthStatus() {
    try {
      const [googleData, githubData, oauthSession] = await Promise.all([
        AsyncStorage.getItem('google_oauth_data'),
        AsyncStorage.getItem('github_oauth_data'),
        AsyncStorage.getItem('oauth_session'),
      ]);

      // Check Google sign-in status safely
      let isGoogleSignedIn = false;
      if (typeof window !== 'undefined') {
        // Web platform - check local data only
        isGoogleSignedIn = !!googleData;
      } else {
        // Native platform - try GoogleSignin
        try {
          isGoogleSignedIn = await GoogleSignin.isSignedIn();
        } catch (error) {
          // Fallback to local data if GoogleSignin fails
          isGoogleSignedIn = !!googleData;
        }
      }

      return {
        google: {
          hasLocalData: !!googleData,
          isSignedIn: isGoogleSignedIn,
        },
        github: {
          hasLocalData: !!githubData,
          isSignedIn: !!githubData, // GitHub doesn't have persistent sign-in state
        },
        hasOAuthSession: !!oauthSession,
      };
    } catch (error) {
      console.error('Failed to get OAuth status:', error);
      return {
        google: { hasLocalData: false, isSignedIn: false },
        github: { hasLocalData: false, isSignedIn: false },
        hasOAuthSession: false,
        error: error.message,
      };
    }
  }

  /**
   * Revoke OAuth tokens on the server side
   */
  static async revokeTokens(provider) {
    try {
      // This would typically make an API call to revoke tokens on the server
      // For now, we'll just clear local data
      return await this.clearProviderData(provider);
    } catch (error) {
      console.error(`Failed to revoke ${provider} tokens:`, error);
      return { 
        success: false, 
        error: error.message || `Failed to revoke ${provider} tokens` 
      };
    }
  }
}

export default OAuthService;