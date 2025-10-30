import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  hiddenImage: {
    opacity: 0,
  },
  loadingContainer: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  errorContainer: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555555',
    textAlign: 'justify',
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: '#3498db',
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: '#555555',
    flex: 1,
    lineHeight: 22,
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  infoValue: {
    fontSize: 14,
    color: '#555555',
  },
  actionContainer: {
    padding: 20,
    paddingTop: 10,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
  instructionsContainer: {
    backgroundColor: '#e8f4fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default styles;