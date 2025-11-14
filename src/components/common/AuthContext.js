import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useEffect, useState } from 'react';
import apiClient from '../../api/client.js';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Debug OAuth configuration
  console.log('Google OAuth Client ID:', process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID);
  console.log('GitHub OAuth Client ID:', process.env.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID);

  const [googleRequest, googleResponse, promptAsyncGoogle] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  });

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
    },
    githubDiscovery
  );

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const login = async (identifier, password) => {
    try {
      const response = await apiClient.post('/api/login', { identifier, password });
      if (response.data && response.data.user) {
        await handleLoginSuccess(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'An error occurred' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      await AsyncStorage.removeItem('user');
    }
  };

  const handleOAuth = async (provider) => {
    console.log('OAuth button pressed for provider:', provider);
    try {
      if (provider === 'google') {
        console.log('Initiating Google OAuth...');
        await promptAsyncGoogle();
      } else if (provider === 'github') {
        console.log('Initiating GitHub OAuth...');
        await promptAsyncGithub();
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert(`OAuth error: ${error.message}`);
    }
  };

  const processGoogleAuth = useCallback(async (response) => {
    if (response?.type === 'success') {
      const { authentication } = response;
      
      // Check if we're in demo mode
      const isDemoMode = process.env.EXPO_PUBLIC_OAUTH_DEMO_MODE === 'true';
      
      if (isDemoMode) {
        // Demo mode: simulate successful authentication
        console.log('Demo mode: simulating Google OAuth success');
        const mockUser = {
          id: 'demo_google_user_' + Date.now(),
          name: 'Demo Google User',
          email: 'demo.google@example.com',
          provider: 'google',
          avatar: null
        };
        await handleLoginSuccess(mockUser);
        alert('Demo: Google authentication successful!');
        return;
      }
      
      try {
        const backendResponse = await apiClient.post('/api/oauth/google', {
          token: authentication.accessToken,
        });
        if (backendResponse.data && backendResponse.data.user) {
          await handleLoginSuccess(backendResponse.data.user);
        } else {
          alert('Google authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Google OAuth error:', error);
        alert(error.response?.data?.error || 'An error occurred during Google sign-in.');
      }
    } else if (response?.type === 'error') {
        alert('Google authentication was cancelled or failed.');
    }
  }, []);

  const processGithubAuth = useCallback(async (response) => {
    if (response?.type === 'success') {
      const { code } = response.params;
      try {
        const backendResponse = await apiClient.post('/api/oauth/github', { code });
        if (backendResponse.data && backendResponse.data.user) {
          await handleLoginSuccess(backendResponse.data.user);
        } else {
          alert('GitHub authentication failed. Please try again.');
        }
      } catch (error) {
        alert(error.response?.data?.error || 'An error occurred during GitHub sign-in.');
      }
    } else if (response?.type === 'error') {
        alert('GitHub authentication was cancelled or failed.');
    }
  }, []);

  useEffect(() => {
    if (googleResponse) {
      processGoogleAuth(googleResponse);
    }
  }, [googleResponse, processGoogleAuth]);

  useEffect(() => {
    if (githubResponse) {
      processGithubAuth(githubResponse);
    }
  }, [githubResponse, processGithubAuth]);

  const checkAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load user from storage', e);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const loginWithOAuth = async (provider, oauthData) => {
    console.log('loginWithOAuth called with provider:', provider, 'data:', oauthData);
    try {
      let response;
      
      if (provider === 'google') {
        // For Google, we need to get the access token first
        await promptAsyncGoogle();
        return { ok: true, message: 'Google OAuth initiated' };
      } else if (provider === 'github') {
        // For GitHub, we need to get the authorization code first
        await promptAsyncGithub();
        return { ok: true, message: 'GitHub OAuth initiated' };
      } else {
        return { ok: false, message: 'Unsupported OAuth provider' };
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      return { ok: false, message: error.message || 'OAuth login failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingAuth,
        login,
        logout,
        handleOAuth,
        loginWithOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};