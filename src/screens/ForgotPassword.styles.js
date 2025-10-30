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
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 20,
    marginTop: -10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 10,
  },
});
