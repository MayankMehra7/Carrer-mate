import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const StyledTextInput = ({ style, label, value, onChangeText, placeholder, secureTextEntry, error, rightIcon, onRightIconPress }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.focused,
            error && styles.error,
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#999"
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>
            <MaterialCommunityIcons name={rightIcon} size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  focused: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  error: {
    borderColor: 'red',
  },
  iconContainer: {
    paddingHorizontal: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
  },
});

export default StyledTextInput;
