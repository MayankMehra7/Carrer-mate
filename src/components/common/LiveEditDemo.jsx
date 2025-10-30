import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { HeadingText } from './HeadingText';

/**
 * Demo component showing the live edit functionality
 */
export const LiveEditDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <TouchableOpacity 
        onPress={() => setShowDemo(true)}
        style={{
          padding: 16,
          backgroundColor: '#e3f2fd',
          borderRadius: 8,
          margin: 16,
          borderWidth: 1,
          borderColor: '#2196f3'
        }}
      >
        <HeadingText level="h3" style={{ color: '#1976d2', textAlign: 'center' }}>
          🎯 Try Live Resume Preview!
        </HeadingText>
        <Text style={{ textAlign: 'center', marginTop: 8, color: '#1976d2' }}>
          Tap to see how you can edit your resume in real-time
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{
      padding: 16,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      margin: 16,
      borderWidth: 1,
      borderColor: '#dee2e6'
    }}>
      <HeadingText level="h3" style={{ color: '#28a745', textAlign: 'center' }}>
        ✨ Live Preview Features
      </HeadingText>
      
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 14, marginBottom: 8, color: '#333' }}>
          • <Text style={{ fontWeight: 'bold' }}>Real-time editing:</Text> Click "Edit" to modify any field directly
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8, color: '#333' }}>
          • <Text style={{ fontWeight: 'bold' }}>Professional layout:</Text> See exactly how your resume will look
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8, color: '#333' }}>
          • <Text style={{ fontWeight: 'bold' }}>Add/Remove sections:</Text> Dynamically manage experience, education, projects
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 8, color: '#333' }}>
          • <Text style={{ fontWeight: 'bold' }}>Raleway fonts:</Text> Beautiful typography with proper fallbacks
        </Text>
        <Text style={{ fontSize: 14, color: '#333' }}>
          • <Text style={{ fontWeight: 'bold' }}>Instant save:</Text> Changes are preserved automatically
        </Text>
      </View>

      <TouchableOpacity 
        onPress={() => setShowDemo(false)}
        style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: '#6c757d',
          borderRadius: 4,
          alignSelf: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>Hide Demo</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LiveEditDemo;