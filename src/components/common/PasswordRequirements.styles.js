/**
 * PasswordRequirements Component Styles - Enhanced UX
 * Requirements: 4.2, 4.3, 6.2, 6.3, 6.4
 */

import { Platform, StyleSheet } from 'react-native';

export default StyleSheet.create({
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  headerContainer: {
    marginBottom: 12,
  },
  
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    fontFamily: 'Times New Roman, serif',
  },
  
  progressContainer: {
    marginTop: 4,
  },
  
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    fontFamily: 'Times New Roman, serif',
  },
  
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 2,
  },
  
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  
  iconContainer: {
    marginRight: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  
  // Enhanced visual indicators with better styling
  metIcon: {
    fontSize: 16,
    textAlign: 'center',
  },
  
  unmetIcon: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  
  // Enhanced loading indicator
  loadingIcon: {
    fontSize: 16,
    textAlign: 'center',
  },
  
  requirementTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  
  requirementText: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'Times New Roman, serif',
    lineHeight: 20,
  },
  
  tooltipIndicator: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.6,
  },
  
  // Enhanced styling for met requirements
  metText: {
    color: '#28a745',
    fontWeight: '500',
  },
  
  // Enhanced styling for unmet requirements
  unmetText: {
    color: '#6c757d',
    fontWeight: '400',
  },
  
  // Tooltip styling
  tooltipContainer: {
    backgroundColor: '#343a40',
    borderRadius: 6,
    padding: 8,
    marginLeft: 36,
    marginBottom: 8,
    marginRight: 8,
  },
  
  tooltipText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Times New Roman, serif',
    lineHeight: 16,
  },
  
  // Success message styling
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  
  successIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  successText: {
    color: '#155724',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Warning message styling
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  warningText: {
    color: '#856404',
    fontSize: 12,
    flex: 1,
    fontFamily: 'Times New Roman, serif',
  },
});