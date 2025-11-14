/**
 * Real OAuth Hook
 * Implements actual OAuth authentication flows for Google and GitHub
 */

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export const useRealOAuth = () => {
  const { loginWithOAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Google OAuth configuration - simplified for web
  const [googleRequest, googleResponse, promptAsyncGoogle] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  // GitHub OAuth configuration
  const githubDiscovery = {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    revocationEndpoint: `https://github.com/settings/connections/applications/${process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID}`,
  };

  const [githubRequest, githubResponse, promptAsyncGithub] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID,
      scopes: ['user:email', 'read:user'],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: AuthSession.ResponseType.Code,
    },
    githubDiscovery
  );

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse) {
      handleOAuthResponse('google', googleResponse);
    }
  }, [googleResponse]);

  // Handle GitHub OAuth response
  useEffect(() => {
    if (githubResponse) {
      handleOAuthResponse('github', githubResponse);
    }
  }, [githubResponse]);

  const handleOAuthResponse = async (provider, response) => {
    if (response?.type === 'success') {
      setLoading(true);
      
      try {
        let oauthData = {};
        
        if (provider === 'google') {
          oauthData = {
            token: response.authentication.accessToken,
            idToken: response.authentication.idToken,
          };
        } else if (provider === 'github') {
          oauthData = {
            code: response.params.code,
            state: response.params.state,
          };
        }

        console.log(`Processing ${provider} OAuth with data:`, oauthData);
        
        const result = await loginWithOAuth(provider, oauthData);
        
        if (result.ok) {
          console.log(`${provider} OAuth successful!`);
          // Navigation will be handled by AuthContext
        } else {
          const errorMessage = result.message || `${provider} authentication failed`;
          Alert.alert("Authentication Error", errorMessage);
        }
      } catch (error) {
        console.error(`${provider} OAuth error:`, error);
        Alert.alert("Authentication Error", `${provider} authentication failed. Please try again.`);
      } finally {
        setLoading(false);
      }
    } else if (response?.type === 'error') {
      Alert.alert("Authentication Error", `${provider} authentication failed`);
    } else if (response?.type === 'cancel') {
      console.log(`${provider} OAuth cancelled by user`);
    }
  };

  const initiateGoogleOAuth = async () => {
    if (loading) return;
    
    try {
      console.log('Google OAuth Config Check:');
      console.log('Client ID:', process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ? 'SET' : 'NOT SET');
      console.log('Google Request:', googleRequest ? 'READY' : 'NOT READY');
      
      if (!googleRequest) {
        Alert.alert('Configuration Error', 'Google OAuth is not properly configured. Please check your environment variables.');
        return;
      }
      
      console.log('Initiating Google OAuth...');
      setLoading(true);
      await promptAsyncGoogle();
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      Alert.alert('OAuth Error', `Failed to start Google authentication: ${error.message}`);
      setLoading(false);
    }
  };

  const initiateGitHubOAuth = async () => {
    if (loading) return;
    
    try {
      console.log('GitHub OAuth Config Check:');
      console.log('Client ID:', process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID ? 'SET' : 'NOT SET');
      console.log('GitHub Request:', githubRequest ? 'READY' : 'NOT READY');
      
      if (!githubRequest) {
        Alert.alert('Configuration Error', 'GitHub OAuth is not properly configured. Please check your environment variables.');
        return;
      }
      
      console.log('Initiating GitHub OAuth...');
      setLoading(true);
      await promptAsyncGithub();
    } catch (error) {
      console.error('GitHub OAuth initiation error:', error);
      Alert.alert('OAuth Error', `Failed to start GitHub authentication: ${error.message}`);
      setLoading(false);
    }
  };

  return {
    initiateGoogleOAuth,
    initiateGitHubOAuth,
    loading,
    googleConfigured: !!googleRequest,
    githubConfigured: !!githubRequest,
  };
};