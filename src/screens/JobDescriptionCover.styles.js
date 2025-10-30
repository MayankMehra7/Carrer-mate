import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    marginBottom: 10,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    marginBottom: 10,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
    fontSize: 14,
    minHeight: 120,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  buttonContainer: {
    marginVertical: 15,
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  resultTitle: {
    marginBottom: 10,
  },
  resultScroll: {
    maxHeight: 300,
    marginBottom: 15,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
});
