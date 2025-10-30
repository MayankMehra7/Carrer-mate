// src/screens/UserProfile.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  contentContainer: {
    padding: 20,
  },

  header: {
    marginBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  section: {
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },

  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },

  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  userInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },

  userInfoLabel: {
    fontWeight: '600',
    color: '#555',
  },

  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  providerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  providerIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  providerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  statusLinked: {
    backgroundColor: '#e8f5e8',
  },

  statusUnlinked: {
    backgroundColor: '#f5f5f5',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  statusTextLinked: {
    color: '#28a745',
  },

  statusTextUnlinked: {
    color: '#666',
  },

  providerDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },

  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  providerDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },

  providerDetailLabel: {
    fontWeight: '600',
    color: '#555',
  },

  providerActions: {
    alignItems: 'stretch',
  },

  actionButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  linkButton: {
    backgroundColor: '#007AFF',
  },

  linkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  unlinkButton: {
    backgroundColor: '#dc3545',
  },

  unlinkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});