/**
 * PasswordStrengthMeter Component Styles
 * Requirements: 4.1, 4.2, 4.3, 6.2, 6.4
 */

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 12,
  },
  
  meterContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  
  meterTrack: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  meterFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  
  segmentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  
  segment: {
    width: '18%',
    height: 6,
    backgroundColor: 'transparent',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Times New Roman, serif',
  },
  
  scoreText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'Times New Roman, serif',
  },
  
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#17a2b8',
    marginTop: 8,
  },
  
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
    fontFamily: 'Times New Roman, serif',
  },
  
  tipText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 3,
    fontFamily: 'Times New Roman, serif',
    lineHeight: 16,
  },
  
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  
  checkingText: {
    fontSize: 12,
    color: '#1976d2',
    fontFamily: 'Times New Roman, serif',
    fontStyle: 'italic',
  },
});