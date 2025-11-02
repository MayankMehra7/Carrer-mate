/**
 * Simple GitHub OAuth Button
 * Simplified version that just handles authorization
 */

import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { OAuthConfig } from '../../config/oauth';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export const SimpleGitHubButton = ({ onSuccess, onError, loading = false, text = 'Sign in with GitHub' }) => {
  const [internalLoading, setInternalLoading] = useState(false);
  
  const isLoading = loading || internalLoading;

  // Configure OAuth request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: OAuthConfig.github.clientId,
      scopes: OAuthConfig.github.scopes,
      redirectUri: makeRedirectUri({
        scheme: 'aicarrermateapp',
        path: 'oauth',
      }),
      responseType: 'code',
    },
    {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    }
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('GitHub OAuth success, code:', code);
      
      // Just pass the authorization code to the parent
      onSuccess?.({
        code,
        provider: 'github',
        redirectUri: makeRedirectUri({
          scheme: 'aicarrermateapp',
          path: 'oauth',
        }),
      });
      setInternalLoading(false);
    } else if (response?.type === 'error') {
      console.error('GitHub OAuth error:', response.error);
      onError?.({
        type: 'provider_error',
        message: response.error?.description || 'GitHub sign-in failed',
        originalError: response.error,
      });
      setInternalLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('GitHub OAuth cancelled');
      onError?.({
        type: 'oauth_cancelled',
        message: 'GitHub sign-in was cancelled',
      });
      setInternalLoading(false);
    }
  }, [response, onSuccess, onError]);

  const handlePress = async () => {
    if (isLoading) return;

    try {
      console.log('Starting GitHub OAuth...');
      setInternalLoading(true);
      
      if (!request) {
        throw new Error('OAuth request not ready');
      }

      await promptAsync();
    } catch (error) {
      console.error('GitHub OAuth initiation error:', error);
      onError?.({
        type: 'provider_error',
        message: error.message || 'Failed to start GitHub sign-in',
        originalError: error,
      });
      setInternalLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 48,
        opacity: isLoading ? 0.7 : 1,
      }}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
      ) : (
        <View style={{ marginRight: 8, width: 20, height: 20, backgroundColor: 'white', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#333', fontSize: 12, fontWeight: 'bold' }}>⚡</Text>
        </View>
      )}
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
        {isLoading ? 'Signing in...' : text}
      </Text>
    </TouchableOpacity>
  );
};

export default SimpleGitHubButton;