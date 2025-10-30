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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {},
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  aiButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 10,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    color: '#000000',
    fontFamily: 'Times New Roman, serif',
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemTitle: {},
  removeButton: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});
