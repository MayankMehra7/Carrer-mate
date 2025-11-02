/**
 * Simple OAuth Test Component
 * Basic test to see if OAuth buttons work
 */

import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { testOAuthConfig } from '../../utils/oauthConfigTest';

const SimpleOAuthTest = () => {
  const handleGoogleTest = () => {
    console.log('Google OAuth button clicked');
    const configTest = testOAuthConfig();
    Alert.alert('OAuth Test', 'Google OAuth button clicked - check console for details');
  };

  const handleGitHubTest = () => {
    console.log('GitHub OAuth button clicked');
    const configTest = testOAuthConfig();
    Alert.alert('OAuth Test', 'GitHub OAuth button clicked - check console for details');
  };

  return (
    <View style={{ gap: 10 }}>
      <TouchableOpacity
        style={{
          backgroundColor: '#4285f4',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={handleGoogleTest}
      >
        <Text style={{ color: 'white', fontWeight: '500' }}>
          Test Google OAuth
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#333',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={handleGitHubTest}
      >
        <Text style={{ color: 'white', fontWeight: '500' }}>
          Test GitHub OAuth
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SimpleOAuthTest;