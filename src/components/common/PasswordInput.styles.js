/**
 * PasswordInput Component Styles - Enhanced UX
 * Requirements: 4.2, 4.3, 6.2, 6.3, 6.4
 */

import { Platform, StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  
  input: {
    padding: 16,
    paddingRight: 56, // Space for the eye button
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
    minHeight: 52,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
  },
  
  // Enhanced visibility toggle with better UX
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
    zIndex: 1,
    borderRadius: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  
  eyeIcon: {
    fontSize: 20,
    color: '#6c757d',
    transition: 'color 0.2s ease',
  },
  
  eyeIconActive: {
    color: '#007bff',
  },
  
  // Status indicator styling
  statusContainer: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  
  statusText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'Times New Roman, serif',
    fontStyle: 'italic',
  },
  
  statusTextSuccess: {
    fontSize: 12,
    color: '#28a745',
    fontFamily: 'Times New Roman, serif',
    fontWeight: '500',
  },
  
  statusTextError: {
    fontSize: 12,
    color: '#dc3545',
    fontFamily: 'Times New Roman, serif',
    fontWeight: '500',
  },
  
  // Enhanced error message styling
  errorsContainer: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  
  errorTitle: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Times New Roman, serif',
  },
  
  errorText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '400',
    marginBottom: 3,
    fontFamily: 'Times New Roman, serif',
    lineHeight: 16,
  },
  
  // Tips container for new users
  tipsContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  
  tipsText: {
    fontSize: 12,
    color: '#1976d2',
    fontFamily: 'Times New Roman, serif',
    lineHeight: 16,
  },
});