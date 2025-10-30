import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flex: 1,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 15,
    fontSize: 16,
    color: '#000000',
    height: 48,
  },
  inputWithToggle: {
    paddingRight: 60, // gives space for Show/Hide text
    marginBottom: 0,
  },
  relativeContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 15,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
    minHeight: 24,
  },
  toggleText: {
    color: '#0d6efd',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 15,
    marginTop: -10,
    fontStyle: 'italic',
  },
});
