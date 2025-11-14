/**
 * Simple OAuth Hook - Fallback Implementation
 * Shows OAuth configuration status and provides basic functionality
 */

import { useContext, useState } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export const useSimpleOAuth = () => {
  const { loginWithOAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const checkOAuthConfig = () => {
    const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
    const githubClientId = process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID;
    
    console.log('OAuth Configuration Status:');
    console.log('Google Client ID:', googleClientId ? 'SET' : 'NOT SET');
    console.log('GitHub Client ID:', githubClientId ? 'SET' : 'NOT SET');
    
    return {
      googleConfigured: !!googleClientId,
      githubConfigured: !!githubClientId,
    };
  };

  const initiateGoogleOAuth = async () => {
    if (loading) return;
    
    const config = checkOAuthConfig();
    
    if (!config.googleConfigured) {
      Alert.alert(
        'Configuration Issue', 
        'Google OAuth is not configured. Please set EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID in your .env file.'
      );
      return;
    }

    setLoading(true);
    
    try {
      // For now, simulate OAuth success for testing
      console.log('Simulating Google OAuth success...');
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful OAuth response
      const mockOAuthData = {
        token: 'mock_google_token_' + Date.now(),
        idToken: 'mock_id_token_' + Date.now(),
      };
      
      console.log('Mock Google OAuth data:', mockOAuthData);
      
      const result = await loginWithOAuth('google', mockOAuthData);
      
      if (result.ok) {
        console.log('Google OAuth simulation successful!');
      } else {
        Alert.alert('Authentication Error', result.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google OAuth simulation error:', error);
      Alert.alert('Authentication Error', 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initiateGitHubOAuth = async () => {
    if (loading) return;
    
    const config = checkOAuthConfig();
    
    if (!config.githubConfigured) {
      Alert.alert(
        'Configuration Issue', 
        'GitHub OAuth is not configured. Please set EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID in your .env file.'
      );
      return;
    }

    setLoading(true);
    
    try {
      // For now, simulate OAuth success for testing
      console.log('Simulating GitHub OAuth success...');
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful OAuth response
      const mockOAuthData = {
        code: 'mock_github_code_' + Date.now(),
        state: 'mock_state_' + Date.now(),
      };
      
      console.log('Mock GitHub OAuth data:', mockOAuthData);
      
      const result = await loginWithOAuth('github', mockOAuthData);
      
      if (result.ok) {
        console.log('GitHub OAuth simulation successful!');
      } else {
        Alert.alert('Authentication Error', result.message || 'GitHub authentication failed');
      }
    } catch (error) {
      console.error('GitHub OAuth simulation error:', error);
      Alert.alert('Authentication Error', 'GitHub authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const config = checkOAuthConfig();

  return {
    initiateGoogleOAuth,
    initiateGitHubOAuth,
    loading,
    googleConfigured: config.googleConfigured,
    githubConfigured: config.githubConfigured,
  };
};