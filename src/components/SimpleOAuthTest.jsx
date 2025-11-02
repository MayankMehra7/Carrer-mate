/**
 * Simple OAuth Test Component
 * Minimal test to see if OAuth buttons can render
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SimpleOAuthTest = () => {
  const handleGooglePress = () => {
    console.log('Google button pressed');
    alert('Google OAuth button works!');
  };

  const handleGitHubPress = () => {
    console.log('GitHub button pressed');
    alert('GitHub OAuth button works!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OAuth Test</Text>
      
      <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGooglePress}>
        <Text style={styles.buttonText}>🔍 Continue with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.githubButton]} onPress={handleGitHubPress}>
        <Text style={[styles.buttonText, styles.githubText]}>⚡ Continue with GitHub</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>If you see these buttons, the basic setup works!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderColor: '#dddddd',
  },
  githubButton: {
    backgroundColor: '#24292e',
    borderColor: '#24292e',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  githubText: {
    color: '#ffffff',
  },
  note: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default SimpleOAuthTest;