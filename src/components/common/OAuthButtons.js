import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OAuthButton = ({ provider, onPress, text }) => {
  const isGoogle = provider === 'google';
  const isGithub = provider === 'github';

  console.log('OAuthButton rendered for provider:', provider, 'with text:', text);

  return (
    <TouchableOpacity
      style={[styles.button, isGoogle ? styles.googleButton : styles.githubButton]}
      onPress={() => {
        console.log('OAuth button pressed:', provider);
        onPress(provider);
      }}
    >
      {isGoogle && <Text style={styles.googleIcon}>G</Text>}
      {isGithub && <FontAwesome name="github" size={24} color="white" style={styles.icon} />}
      <Text style={[styles.buttonText, isGoogle ? styles.googleButtonText : styles.githubButtonText]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const OAuthButtons = ({ onAuth, isLogin = false }) => {
  const buttonText = isLogin ? 'Sign in with' : 'Sign up with';
  
  console.log('OAuthButtons rendered with onAuth:', typeof onAuth, 'isLogin:', isLogin);

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <OAuthButton
        provider="google"
        onPress={onAuth}
        text={`${buttonText} Google`}
      />
      <OAuthButton
        provider="github"
        onPress={onAuth}
        text={`${buttonText} GitHub`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontFamily: 'Roboto-Regular',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  githubButton: {
    backgroundColor: '#333',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    backgroundColor: '#4285f4',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  googleButtonText: {
    color: '#555',
  },
  githubButtonText: {
    color: '#fff',
  },
});

export default OAuthButtons;