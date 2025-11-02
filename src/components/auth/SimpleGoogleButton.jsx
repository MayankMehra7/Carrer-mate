/**
 * Simple Google OAuth Button
 * Simplified version that just handles authorization
 */

import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { OAuthConfig } from '../../config/oauth';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export const SimpleGoogleButton = ({ onSuccess, onError, loading = false, text = 'Sign in with Google' }) => {
  const [internalLoading, setInternalLoading] = useState(false);
  
  const isLoading = loading || internalLoading;

  // Configure OAuth request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: OAuthConfig.google.clientId,
      scopes: OAuthConfig.google.scopes,
      redirectUri: makeRedirectUri({
        scheme: 'aicarrermateapp',
        path: 'oauth',
      }),
      responseType: 'code',
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Google OAuth success, code:', code);
      
      // Just pass the authorization code to the parent
      onSuccess?.({
        code,
        provider: 'google',
        redirectUri: makeRedirectUri({
          scheme: 'aicarrermateapp',
          path: 'oauth',
        }),
      });
      setInternalLoading(false);
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      onError?.({
        type: 'provider_error',
        message: response.error?.description || 'Google sign-in failed',
        originalError: response.error,
      });
      setInternalLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('Google OAuth cancelled');
      onError?.({
        type: 'oauth_cancelled',
        message: 'Google sign-in was cancelled',
      });
      setInternalLoading(false);
    }
  }, [response, onSuccess, onError]);

  const handlePress = async () => {
    if (isLoading) return;

    try {
      console.log('Starting Google OAuth...');
      setInternalLoading(true);
      
      if (!request) {
        throw new Error('OAuth request not ready');
      }

      await promptAsync();
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      onError?.({
        type: 'provider_error',
        message: error.message || 'Failed to start Google sign-in',
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
        backgroundColor: '#4285f4',
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
          <Text style={{ color: '#4285f4', fontSize: 12, fontWeight: 'bold' }}>G</Text>
        </View>
      )}
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
        {isLoading ? 'Signing in...' : text}
      </Text>
    </TouchableOpacity>
  );
};

export default SimpleGoogleButton;