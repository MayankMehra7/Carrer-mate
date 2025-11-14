/**
 * Account Conflict Resolution Dialog
 * 
 * This component handles account conflicts when a user tries to sign in with OAuth
 * but an account with the same email already exists with different authentication methods.
 */

import { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { OAuthErrorTypes } from '../../utils/oauthErrors';

export const AccountConflictDialog = ({
  visible,
  onClose,
  conflictData,
  onResolve,
  style
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState(null);
  
  // useContext must be called unconditionally
  const authContext = useContext(AuthContext);
  const linkOAuthProvider = authContext?.linkOAuthProvider;
  
  // Early return if no conflict data or not visible
  if (!visible || !conflictData) return null;
  
  // Early return if context not available
  if (!linkOAuthProvider) {
    console.warn('AccountConflictDialog: linkOAuthProvider not available');
    return null;
  }

  const {
    email,
    existingProviders = [],
    attemptedProvider,
    oauthData
  } = conflictData;

  const handleLinkAccounts = async () => {
    setIsLinking(true);
    setLinkingError(null);

    try {
      const result = await linkOAuthProvider(attemptedProvider, oauthData);
      
      if (result.ok) {
        onResolve({
          action: 'linked',
          user: result.user,
          provider: attemptedProvider
        });
        onClose();
      } else {
        setLinkingError(result.message || 'Failed to link accounts');
      }
    } catch (error) {
      setLinkingError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSwitchAccount = () => {
    onResolve({
      action: 'switch',
      provider: attemptedProvider
    });
    onClose();
  };

  const handleCancel = () => {
    onResolve({
      action: 'cancel',
      provider: attemptedProvider
    });
    onClose();
  };

  const getProviderDisplayName = (provider) => {
    const names = {
      google: 'Google',
      github: 'GitHub',
      email: 'Email/Password'
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider) => {
    const icons = {
      google: '🔍',
      github: '🐙',
      email: '📧'
    };
    return icons[provider] || '🔐';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, style]}>
          <View style={styles.header}>
            <Text style={styles.icon}>👥</Text>
            <Text style={styles.title}>Account Already Exists</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              An account with the email <Text style={styles.email}>{email}</Text> already exists.
            </Text>

            <View style={styles.providerInfo}>
              <Text style={styles.sectionTitle}>Existing sign-in methods:</Text>
              <View style={styles.providerList}>
                {existingProviders.map((provider, index) => (
                  <View key={index} style={styles.providerItem}>
                    <Text style={styles.providerIcon}>
                      {getProviderIcon(provider)}
                    </Text>
                    <Text style={styles.providerName}>
                      {getProviderDisplayName(provider)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.attemptedProvider}>
              <Text style={styles.sectionTitle}>You're trying to sign in with:</Text>
              <View style={styles.providerItem}>
                <Text style={styles.providerIcon}>
                  {getProviderIcon(attemptedProvider)}
                </Text>
                <Text style={styles.providerName}>
                  {getProviderDisplayName(attemptedProvider)}
                </Text>
              </View>
            </View>

            {linkingError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{linkingError}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleLinkAccounts}
              disabled={isLinking}
            >
              {isLinking ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Link {getProviderDisplayName(attemptedProvider)} Account
                  </Text>
                  <Text style={styles.buttonSubtext}>
                    Add {getProviderDisplayName(attemptedProvider)} as a sign-in option
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSwitchAccount}
              disabled={isLinking}
            >
              <Text style={styles.secondaryButtonText}>
                Use Different {getProviderDisplayName(attemptedProvider)} Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.tertiaryButton]}
              onPress={handleCancel}
              disabled={isLinking}
            >
              <Text style={styles.tertiaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook for managing account conflict resolution
export const useAccountConflictResolution = () => {
  const [conflictDialog, setConflictDialog] = useState({
    visible: false,
    conflictData: null
  });

  const showConflictDialog = (conflictData) => {
    setConflictDialog({
      visible: true,
      conflictData
    });
  };

  const hideConflictDialog = () => {
    setConflictDialog({
      visible: false,
      conflictData: null
    });
  };

  const handleConflictResolution = (resolution) => {
    return new Promise((resolve) => {
      const handleResolve = (result) => {
        resolve(result);
      };

      setConflictDialog(prev => ({
        ...prev,
        onResolve: handleResolve
      }));
    });
  };

  const resolveAccountConflict = async (error) => {
    if (error.type !== OAuthErrorTypes.ACCOUNT_CONFLICT) {
      throw error;
    }

    const conflictData = error.details;
    
    return new Promise((resolve, reject) => {
      showConflictDialog({
        ...conflictData,
        onResolve: (result) => {
          hideConflictDialog();
          
          switch (result.action) {
            case 'linked':
              resolve({
                action: 'linked',
                user: result.user,
                provider: result.provider
              });
              break;
              
            case 'switch':
              resolve({
                action: 'switch',
                provider: result.provider
              });
              break;
              
            case 'cancel':
            default:
              reject(new Error('Account linking cancelled by user'));
              break;
          }
        }
      });
    });
  };

  return {
    conflictDialog,
    showConflictDialog,
    hideConflictDialog,
    resolveAccountConflict,
    AccountConflictDialog: (props) => (
      <AccountConflictDialog
        {...props}
        visible={conflictDialog.visible}
        conflictData={conflictDialog.conflictData}
        onResolve={conflictDialog.onResolve}
        onClose={hideConflictDialog}
      />
    )
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },

  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  icon: {
    fontSize: 48,
    marginBottom: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  content: {
    padding: 20,
  },

  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },

  email: {
    fontWeight: '600',
    color: '#333',
  },

  providerInfo: {
    marginBottom: 20,
  },

  attemptedProvider: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  providerList: {
    gap: 8,
  },

  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },

  providerIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  providerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },

  errorText: {
    color: '#c33',
    fontSize: 14,
    textAlign: 'center',
  },

  actions: {
    padding: 20,
    gap: 12,
  },

  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: '#007AFF',
  },

  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },

  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },

  tertiaryButton: {
    backgroundColor: 'transparent',
  },

  tertiaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AccountConflictDialog;