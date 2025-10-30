// src/components/oauth/AccountSettings.jsx
import { useContext, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { api } from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { HeadingText } from "../common/HeadingText";

export const AccountSettings = ({ visible, onClose }) => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [primaryAuthMethod, setPrimaryAuthMethod] = useState(user?.primary_auth_method || 'email');

  const handleSetPrimaryAuthMethod = async (method) => {
    if (method === primaryAuthMethod) return;

    Alert.alert(
      "Change Primary Authentication",
      `Are you sure you want to set ${getMethodDisplayName(method)} as your primary authentication method?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.updatePrimaryAuthMethod({ primary_auth_method: method });
              if (response.ok) {
                const updatedUser = { ...user, primary_auth_method: method };
                setUser(updatedUser);
                setPrimaryAuthMethod(method);
                Alert.alert("Success", "Primary authentication method updated successfully!");
              } else {
                Alert.alert("Error", response.data?.message || "Failed to update primary authentication method");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred while updating authentication method");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getMethodDisplayName = (method) => {
    const names = { 
      email: 'Email/Password', 
      google: 'Google', 
      github: 'GitHub' 
    };
    return names[method] || method;
  };

  const getMethodIcon = (method) => {
    const icons = { 
      email: '📧', 
      google: '🔍', 
      github: '🐙' 
    };
    return icons[method] || '🔐';
  };

  const getAvailableMethods = () => {
    const methods = ['email'];
    
    if (user?.oauth_providers?.google) {
      methods.push('google');
    }
    
    if (user?.oauth_providers?.github) {
      methods.push('github');
    }
    
    return methods;
  };

  const renderAuthMethodOption = (method) => {
    const isSelected = method === primaryAuthMethod;
    const isAvailable = getAvailableMethods().includes(method);
    
    if (!isAvailable) return null;

    return (
      <TouchableOpacity
        key={method}
        style={[
          styles.methodOption,
          isSelected && styles.methodOptionSelected,
          loading && styles.methodOptionDisabled
        ]}
        onPress={() => handleSetPrimaryAuthMethod(method)}
        disabled={loading || isSelected}
      >
        <View style={styles.methodContent}>
          <Text style={styles.methodIcon}>{getMethodIcon(method)}</Text>
          <View style={styles.methodInfo}>
            <Text style={[
              styles.methodName,
              isSelected && styles.methodNameSelected
            ]}>
              {getMethodDisplayName(method)}
            </Text>
            {isSelected && (
              <Text style={styles.primaryLabel}>Primary Method</Text>
            )}
          </View>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <HeadingText level="h2" style={styles.title}>Account Settings</HeadingText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Primary Authentication Method */}
          <View style={styles.section}>
            <HeadingText level="h3" style={styles.sectionTitle}>
              Primary Authentication Method
            </HeadingText>
            <Text style={styles.sectionDescription}>
              Choose your preferred method for signing in. You can always use any linked method to sign in.
            </Text>

            <View style={styles.methodsList}>
              {['email', 'google', 'github'].map(renderAuthMethodOption)}
            </View>
          </View>

          {/* Account Security */}
          <View style={styles.section}>
            <HeadingText level="h3" style={styles.sectionTitle}>
              Account Security
            </HeadingText>
            <Text style={styles.sectionDescription}>
              Your account is secured with the following authentication methods:
            </Text>

            <View style={styles.securityInfo}>
              {getAvailableMethods().map((method) => (
                <View key={method} style={styles.securityItem}>
                  <Text style={styles.securityIcon}>{getMethodIcon(method)}</Text>
                  <Text style={styles.securityText}>
                    {getMethodDisplayName(method)} authentication is enabled
                  </Text>
                </View>
              ))}
            </View>

            {getAvailableMethods().length === 1 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Consider linking additional authentication methods for better account security and easier access.
                </Text>
              </View>
            )}
          </View>

          {/* Login Methods Summary */}
          <View style={styles.section}>
            <HeadingText level="h3" style={styles.sectionTitle}>
              Available Login Methods
            </HeadingText>
            <Text style={styles.sectionDescription}>
              You can sign in using any of these methods:
            </Text>

            <View style={styles.loginMethodsList}>
              {user?.login_methods?.map((method) => (
                <View key={method} style={styles.loginMethodItem}>
                  <Text style={styles.loginMethodIcon}>{getMethodIcon(method)}</Text>
                  <Text style={styles.loginMethodText}>
                    {getMethodDisplayName(method)}
                  </Text>
                  {method === primaryAuthMethod && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
              )) || (
                <Text style={styles.noMethodsText}>No login methods available</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },

  closeButton: {
    padding: 8,
  },

  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
  },

  section: {
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },

  methodsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },

  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  methodOptionSelected: {
    backgroundColor: '#f0f8ff',
  },

  methodOptionDisabled: {
    opacity: 0.6,
  },

  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  methodIcon: {
    fontSize: 24,
    marginRight: 16,
  },

  methodInfo: {
    flex: 1,
  },

  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  methodNameSelected: {
    color: '#007AFF',
  },

  primaryLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },

  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  securityInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },

  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  securityIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  securityText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },

  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },

  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  warningText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
    lineHeight: 18,
  },

  loginMethodsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },

  loginMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  loginMethodIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  loginMethodText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },

  primaryBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  primaryBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  noMethodsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});