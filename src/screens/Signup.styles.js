import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for better UX
    minHeight: '100%',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  
  // OAuth styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dddddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666666',
    fontSize: 14,
  },
  
  oauthContainer: {
    marginBottom: 20,
    gap: 10,
  },
  
  oauthButton: {
    marginBottom: 10,
  },
});
