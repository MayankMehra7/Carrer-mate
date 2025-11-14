import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    color: '#666',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  oauthContainer: {
    marginBottom: 20,
  },
});

export default styles;