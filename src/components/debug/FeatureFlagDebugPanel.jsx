/**
 * Feature Flag Debug Panel
 * Debug component for monitoring and testing feature flags
 * Only shown when debug mode is enabled
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { featureFlagManager } from '../../services/FeatureFlagManager';
import { colors } from '../../styles/theme';

/**
 * Feature Flag Debug Panel Component
 */
export const FeatureFlagDebugPanel = ({ visible = false, onClose }) => {
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load feature flag data
  useEffect(() => {
    if (visible) {
      loadFeatureFlagData();
    }
  }, [visible]);

  /**
   * Load all feature flag data and statistics
   */
  const loadFeatureFlagData = async () => {
    try {
      setLoading(true);
      
      // Get manager statistics
      const managerStats = featureFlagManager.getStats();
      setStats(managerStats);
      
      // Get all current flag values
      const allFlags = await featureFlagManager.getAllFlags();
      setFlags(allFlags);
      
    } catch (error) {
      console.error('Error loading feature flag data:', error);
      Alert.alert('Error', 'Failed to load feature flag data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh flags from remote service
   */
  const handleRefreshFlags = async () => {
    try {
      setRefreshing(true);
      
      const success = await featureFlagManager.refreshFlags();
      
      if (success) {
        Alert.alert('Success', 'Feature flags refreshed from remote service');
        await loadFeatureFlagData();
      } else {
        Alert.alert('Warning', 'Could not refresh from remote service, using cached/default values');
      }
    } catch (error) {
      console.error('Error refreshing flags:', error);
      Alert.alert('Error', 'Failed to refresh feature flags');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Reset manager statistics
   */
  const handleResetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset all feature flag statistics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            featureFlagManager.resetStats();
            loadFeatureFlagData();
          },
        },
      ]
    );
  };

  /**
   * Show detailed flag information
   */
  const showFlagDetails = (flagName) => {
    const flagValue = flags[flagName];
    const source = featureFlagManager.getFlagSource(flagName);
    
    Alert.alert(
      `Flag: ${flagName}`,
      `Value: ${flagValue}\nSource: ${source || 'unknown'}\nExists: ${featureFlagManager.hasFlag(flagName)}`,
      [{ text: 'OK' }]
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Feature Flag Debug Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <>
              {/* Statistics Section */}
              {stats && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Service Statistics</Text>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Service Health:</Text>
                    <View style={[
                      styles.statusBadge,
                      stats.serviceHealthy ? styles.healthyBadge : styles.unhealthyBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        stats.serviceHealthy ? styles.healthyText : styles.unhealthyText
                      ]}>
                        {stats.serviceHealthy ? 'Healthy' : 'Degraded'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Request Count:</Text>
                    <Text style={styles.statValue}>{stats.requestCount}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Error Rate:</Text>
                    <Text style={styles.statValue}>
                      {(stats.errorRate * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Fallback Rate:</Text>
                    <Text style={styles.statValue}>
                      {(stats.fallbackRate * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Cache Hit Rate:</Text>
                    <Text style={styles.statValue}>
                      {(stats.cache.hitRate * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Cache Size:</Text>
                    <Text style={styles.statValue}>{stats.cache.size}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Default Flags:</Text>
                    <Text style={styles.statValue}>{stats.defaultFlagsCount}</Text>
                  </View>

                  {stats.lastServiceCheck && (
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Last Check:</Text>
                      <Text style={styles.statValue}>
                        {new Date(stats.lastServiceCheck).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Feature Flags Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Feature Flags</Text>
                
                {Object.entries(flags).length === 0 ? (
                  <Text style={styles.emptyText}>No feature flags loaded</Text>
                ) : (
                  Object.entries(flags).map(([flagName, flagValue]) => (
                    <TouchableOpacity
                      key={flagName}
                      style={styles.flagRow}
                      onPress={() => showFlagDetails(flagName)}
                    >
                      <View style={styles.flagInfo}>
                        <Text style={styles.flagName}>{flagName}</Text>
                        <Text style={styles.flagSource}>
                          Source: {featureFlagManager.getFlagSource(flagName) || 'unknown'}
                        </Text>
                      </View>
                      <View style={[
                        styles.flagValue,
                        flagValue ? styles.enabledFlag : styles.disabledFlag
                      ]}>
                        <Text style={[
                          styles.flagValueText,
                          flagValue ? styles.enabledText : styles.disabledText
                        ]}>
                          {flagValue ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Actions Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleRefreshFlags}
                  disabled={refreshing}
                >
                  <Icon name="refresh-cw" size={16} color={colors.white} />
                  <Text style={styles.primaryButtonText}>
                    {refreshing ? 'Refreshing...' : 'Refresh from Service'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleResetStats}
                >
                  <Icon name="trash-2" size={16} color={colors.text.primary} />
                  <Text style={styles.secondaryButtonText}>Reset Statistics</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={loadFeatureFlagData}
                >
                  <Icon name="refresh-ccw" size={16} color={colors.text.primary} />
                  <Text style={styles.secondaryButtonText}>Reload Data</Text>
                </TouchableOpacity>
              </View>

              {/* Configuration Section */}
              {stats?.configuration && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Configuration</Text>
                  
                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>API Endpoint:</Text>
                    <Text style={styles.configValue}>{stats.configuration.apiEndpoint}</Text>
                  </View>

                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>Request Timeout:</Text>
                    <Text style={styles.configValue}>{stats.configuration.requestTimeout}ms</Text>
                  </View>

                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>Retry Attempts:</Text>
                    <Text style={styles.configValue}>{stats.configuration.retryAttempts}</Text>
                  </View>

                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>Service Check Interval:</Text>
                    <Text style={styles.configValue}>{stats.configuration.serviceCheckInterval}ms</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: colors.background,
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 500,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: colors.text.secondary,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  healthyBadge: {
    backgroundColor: colors.success + '20',
  },
  unhealthyBadge: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  healthyText: {
    color: colors.success,
  },
  unhealthyText: {
    color: colors.error,
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  flagInfo: {
    flex: 1,
  },
  flagName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  flagSource: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  flagValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  enabledFlag: {
    backgroundColor: colors.success + '20',
  },
  disabledFlag: {
    backgroundColor: colors.text.tertiary + '20',
  },
  flagValueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  enabledText: {
    color: colors.success,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '500',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  configRow: {
    paddingVertical: 4,
  },
  configLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  configValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
});

export default FeatureFlagDebugPanel;