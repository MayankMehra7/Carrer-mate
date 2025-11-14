/**
 * OAuth Button Component
 * Handles OAuth authentication flow for Google and GitHub
 */

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { OAuthConfig } from '../../config/oauth';
import { useOAuth } from '../../hooks/useOAuth';

WebBrowser.maybeCompleteAuthSession();

const OAuthButton = ({ provider, onSuccess, onError, disabled, children, style }) => {
  const { signInWithOAuth, loading } = useOAuth();
  const [oauthLoading, setOauthLoading] = useState(false);

  // Google OAuth setup
  const [googleRequest, googleResponse, promptAsyncGoogle] = Google.useAuthRequest({
    expoClientId: OAuthConfig.google.clientId,
    iosClientId: OAuthConfig.google.clientId,
    androidClientId: OAuthConfig.google.clientId,
    webClientId: OAuthConfig.google.clientId,
  });

  // GitHub OAuth setup
  const githubDiscovery = {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    revocationEndpoint: `https://github.com/settings/connections/applications/${OAuthConfig.github.clientId}`,
  };

  const [githubRequest, githubResponse, promptAsyncGithub] = AuthSession.useAuthRequest(
    {
      clientId: OAuthConfig.github.clientId,
      scopes: OAuthConfig.github.scopes,
      redirectUri: AuthSession.makeRedirectUri(),
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

  const handleOAuthResponse = async (providerName, response) => {
    if (response?.type === 'success') {
      setOauthLoading(true);
      
      try {
        let oauthData = {};
        
        if (providerName === 'google') {
          oauthData = {
            token: response.authentication.accessToken,
            idToken: response.authentication.idToken,
          };
        } else if (providerName === 'github') {
          oauthData = {
            code: response.params.code,
            state: response.params.state,
          };
        }

        const result = await signInWithOAuth(providerName, oauthData);
        
        if (result.ok) {
          onSuccess?.(providerName, result);
        } else {
          onError?.(providerName, result);
        }
      } catch (error) {
        console.error(`${providerName} OAuth error:`, error);
        onError?.(providerName, { message: error.message || `${providerName} authentication failed` });
      } finally {
        setOauthLoading(false);
      }
    } else if (response?.type === 'error') {
      onError?.(providerName, { message: `${providerName} authentication failed` });
    } else if (response?.type === 'cancel') {
      // User cancelled - no need to show error
      console.log(`${providerName} OAuth cancelled by user`);
    }
  };

  const handlePress = async () => {
    if (disabled || loading || oauthLoading) return;

    try {
      if (provider === 'google') {
        if (!googleRequest) {
          Alert.alert('Error', 'Google OAuth is not properly configured');
          return;
        }
        await promptAsyncGoogle();
      } else if (provider === 'github') {
        if (!githubRequest) {
          Alert.alert('Error', 'GitHub OAuth is not properly configured');
          return;
        }
        await promptAsyncGithub();
      } else {
        Alert.alert('Error', `Unsupported OAuth provider: ${provider}`);
      }
    } catch (error) {
      console.error(`${provider} OAuth initiation error:`, error);
      Alert.alert('Error', `Failed to initiate ${provider} authentication`);
    }
  };

  const isLoading = loading || oauthLoading;

  return (
    <TouchableOpacity
      style={[
        {
          opacity: disabled || isLoading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      {children || (
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {isLoading ? 'Loading...' : `Sign in with ${provider}`}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default OAuthButton;