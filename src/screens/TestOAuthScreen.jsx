/**
 * Test OAuth Screen
 * Simple test screen to verify OAuth buttons are working
 */

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GitHubSignInButton } from '../components/auth/GitHubSignInButton';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

const TestOAuthScreen = () => {
  const handleOAuthSuccess = (provider, data) => {
    console.log(`${provider} OAuth Success:`, data);
    alert(`${provider} OAuth Success! Check console for details.`);
  };

  const handleOAuthError = (provider, error) => {
    console.log(`${provider} OAuth Error:`, error);
    alert(`${provider} OAuth Error: ${error?.message || error}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>OAuth Test Screen</Text>
        <Text style={styles.subtitle}>Test the OAuth buttons below:</Text>
        
        <View style={styles.buttonContainer}>
          <GoogleSignInButton
            onSuccess={(data) => handleOAuthSuccess('Google', data)}
            onError={(error) => handleOAuthError('Google', error)}
            text="Test Google OAuth"
          />
          
          <GitHubSignInButton
            onSuccess={(data) => handleOAuthSuccess('GitHub', data)}
            onError={(error) => handleOAuthError('GitHub', error)}
            text="Test GitHub OAuth"
          />
        </View>
        
        <Text style={styles.note}>
          If you see the buttons above, OAuth components are loaded correctly!
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
    marginBottom: 30,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default TestOAuthScreen;