// src/screens/UserProfile.jsx
import { useContext, useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { api } from "../api/api";
import { HeadingText } from "../components/common/HeadingText";
import { AccountSettings } from "../components/oauth/AccountSettings";
import { AuthContext } from "../context/AuthContext";

export default function UserProfile({ navigation }) {
  const { user, setUser, linkOAuthProvider, unlinkOAuthProvider } = useContext(AuthContext);
  const oauthFeedback = useOAuthFeedback();
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({});
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  useEffect(() => {
    loadOAuthProviders();
  }, []);

  const loadOAuthProviders = async () => {
    try {
      const response = await api.getUserOAuthProviders();
      if (response.ok) {
        setOauthProviders(response.data.providers || {});
      }
    } catch (error) {
      console.error("Failed to load OAuth providers:", error);
    }
  };

  const handleLinkProvider = async (provider, oauthData) => {
    setLoading(true);
    try {
      const result = await linkOAuthProvider(provider, oauthData);
      if (result.ok) {
        oauthFeedback.showLinkingSuccess(getProviderDisplayName(provider));
        await loadOAuthProviders();
      } else {
        oauthFeedback.showLinkingError(getProviderDisplayName(provider), result);
      }
    } catch (error) {
      oauthFeedback.showNetworkError(getProviderDisplayName(provider));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkProvider = async (provider) => {
    Alert.alert(
      "Unlink Account",
      `Are you sure you want to unlink your ${getProviderDisplayName(provider)} account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await unlinkOAuthProvider(provider);
              if (result.ok) {
                Alert.alert(
                  "Success",
                  `${getProviderDisplayName(provider)} account unlinked successfully!`
                );
                await loadOAuthProviders();
              } else {
                Alert.alert(
                  "Error",
                  result.message || `Failed to unlink ${getProviderDisplayName(provider)} account`
                );
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred while unlinking account");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getProviderDisplayName = (provider) => {
    const names = { google: 'Google', github: 'GitHub' };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider) => {
    const icons = { google: '🔍', github: '🐙' };
    return icons[provider] || '🔐';
  };

  const getProviderColor = (provider) => {
    const colors = { 
      google: '#4285F4', 
      github: '#333333' 
    };
    return colors[provider] || '#007AFF';
  };

  const renderProviderInfo = (provider, providerData) => {
    const isLinked = !!providerData;
    
    return (
      <View key={provider} style={styles.providerCard}>
        <View style={styles.providerHeader}>
          <View style={styles.providerTitleContainer}>
            <Text style={styles.providerIcon}>{getProviderIcon(provider)}</Text>
            <HeadingText level="h3" style={styles.providerTitle}>
              {getProviderDisplayName(provider)}
            </HeadingText>
          </View>
          <View style={[
            styles.statusBadge, 
            isLinked ? styles.statusLinked : styles.statusUnlinked
          ]}>
            <Text style={[
              styles.statusText,
              isLinked ? styles.statusTextLinked : styles.statusTextUnlinked
            ]}>
              {isLinked ? 'Linked' : 'Not Linked'}
            </Text>
          </View>
        </View>

        {isLinked && (
          <View style={styles.providerDetails}>
            {providerData.avatar_url && (
              <Image 
                source={{ uri: providerData.avatar_url }} 
                style={styles.providerAvatar}
              />
            )}
            <View style={styles.providerInfo}>
              {providerData.name && (
                <Text style={styles.providerDetailText}>
                  <Text style={styles.providerDetailLabel}>Name: </Text>
                  {providerData.name}
                </Text>
              )}
              {providerData.email && (
                <Text style={styles.providerDetailText}>
                  <Text style={styles.providerDetailLabel}>Email: </Text>
                  {providerData.email}
                </Text>
              )}
              {providerData.username && (
                <Text style={styles.providerDetailText}>
                  <Text style={styles.providerDetailLabel}>Username: </Text>
                  {providerData.username}
                </Text>
              )}
              {providerData.linked_at && (
                <Text style={styles.providerDetailText}>
                  <Text style={styles.providerDetailLabel}>Linked: </Text>
                  {new Date(providerData.linked_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.providerActions}>
          {isLinked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.unlinkButton]}
              onPress={() => handleUnlinkProvider(provider)}
              disabled={loading}
            >
              <Text style={styles.unlinkButtonText}>Unlink Account</Text>
            </TouchableOpacity>
          ) : (
            provider === 'google' ? (
              <GoogleSignInButton
                onSuccess={(result) => handleLinkProvider(provider, result)}
                onError={(error) => {
                  oauthFeedback.showOAuthError(getProviderDisplayName(provider), error);
                }}
                style={[styles.linkButton, { backgroundColor: getProviderColor(provider) }]}
                text={`Link ${getProviderDisplayName(provider)} Account`}
                disabled={loading}
              />
            ) : provider === 'github' ? (
              <GitHubSignInButton
                onSuccess={(result) => handleLinkProvider(provider, result)}
                onError={(error) => {
                  oauthFeedback.showOAuthError(getProviderDisplayName(provider), error);
                }}
                style={[styles.linkButton, { backgroundColor: getProviderColor(provider) }]}
                text={`Link ${getProviderDisplayName(provider)} Account`}
                disabled={loading}
              />
            ) : null
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <HeadingText level="h1" style={styles.title}>User Profile</HeadingText>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>Account Information</HeadingText>
        <View style={styles.userInfoCard}>
          <Text style={styles.userInfoText}>
            <Text style={styles.userInfoLabel}>Name: </Text>
            {user?.name || 'Not provided'}
          </Text>
          <Text style={styles.userInfoText}>
            <Text style={styles.userInfoLabel}>Email: </Text>
            {user?.email || 'Not provided'}
          </Text>
          <Text style={styles.userInfoText}>
            <Text style={styles.userInfoLabel}>Username: </Text>
            {user?.username || 'Not provided'}
          </Text>
          <Text style={styles.userInfoText}>
            <Text style={styles.userInfoLabel}>Primary Auth: </Text>
            {user?.primary_auth_method || 'Email'}
          </Text>
          {user?.login_methods && user.login_methods.length > 0 && (
            <Text style={styles.userInfoText}>
              <Text style={styles.userInfoLabel}>Login Methods: </Text>
              {user.login_methods.join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* OAuth Providers */}
      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>Connected Accounts</HeadingText>
        <Text style={styles.sectionDescription}>
          Link your social accounts for easier sign-in and enhanced features.
        </Text>
        
        {/* Google Provider */}
        {renderProviderInfo('google', user?.oauth_providers?.google)}
        
        {/* GitHub Provider */}
        {renderProviderInfo('github', user?.oauth_providers?.github)}
      </View>

      {/* Account Management */}
      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>Account Management</HeadingText>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowAccountSettings(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️ Account Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings Modal */}
      <AccountSettings
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  contentContainer: {
    padding: 20,
  },

  header: {
    marginBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  section: {
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },

  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },

  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  userInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },

  userInfoLabel: {
    fontWeight: '600',
    color: '#555',
  },

  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  providerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  providerIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  providerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  statusLinked: {
    backgroundColor: '#e8f5e8',
  },

  statusUnlinked: {
    backgroundColor: '#f5f5f5',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  statusTextLinked: {
    color: '#28a745',
  },

  statusTextUnlinked: {
    color: '#666',
  },

  providerDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },

  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  providerDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },

  providerDetailLabel: {
    fontWeight: '600',
    color: '#555',
  },

  providerActions: {
    alignItems: 'stretch',
  },

  actionButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  linkButton: {
    backgroundColor: '#007AFF',
  },

  linkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  unlinkButton: {
    backgroundColor: '#dc3545',
  },

  unlinkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  settingsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});