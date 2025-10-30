import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  inputWithToggle: {
    paddingRight: 56, // space for the toggle button
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
    zIndex: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  toggleText: {
    color: '#0d6efd',
    fontWeight: '600',
  },
});
