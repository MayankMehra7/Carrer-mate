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
  fileStatus: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  fileName: {
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'Times New Roman, serif',
  },
  fileInstruction: {
    fontSize: 12,
    color: '#000000',
    fontStyle: 'italic',
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
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  buttonSpacing: {
    height: 10,
  },
  feedbackContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
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
  feedbackTitle: {
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
});
