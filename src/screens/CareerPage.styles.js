import { Platform, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    minHeight: '100%',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  welcomeText: {
    marginBottom: 5,
  },
  userText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 15,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  featureTitle: {
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 15,
    lineHeight: 20,
  },
  logoutContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonSpacing: {
    width: 10,
  },
});
