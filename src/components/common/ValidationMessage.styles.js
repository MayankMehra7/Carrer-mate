import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  validationContainer: {
    minHeight: 20,
    marginBottom: 5,
    paddingHorizontal: 2,
  },
  validatingText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
  },
});
