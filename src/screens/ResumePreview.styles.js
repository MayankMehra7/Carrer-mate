import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#ffffff',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
  },
  previewContent: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 4,
    marginBottom: 12,
  },
  
  // Personal Information
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  contactItem: {
    fontSize: 14,
    color: '#555555',
  },
  
  // Summary
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    textAlign: 'justify',
  },
  
  // Experience
  experienceItem: {
    marginBottom: 20,
    position: 'relative',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  duration: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  company: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  
  // Education
  educationItem: {
    marginBottom: 16,
    position: 'relative',
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  degree: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  institution: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  
  // Skills
  skillsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  
  // Projects
  projectItem: {
    marginBottom: 16,
    position: 'relative',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 4,
  },
  technologies: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  
  // Editable styles
  editableInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f8f9fa',
    minHeight: 40,
  },
  editableHeading: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  
  // Action buttons
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#28a745',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default styles;