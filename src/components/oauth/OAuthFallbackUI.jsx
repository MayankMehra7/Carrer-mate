/**
 * OAuth Fallback UI Components
 * 
 * This module provides fallback UI components for OAuth provider unavailability,
 * network errors, and retry scenarios.
 */

import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OAuthErrorTypes } from '../../utils/oauthErrors';

// Fallback UI for provider unavailability
export const ProviderUnavailableFallback = ({ 
  provider, 
  onRetry, 
  onCancel, 
  style 
}) => {
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
  
  return (
    <View style={[styles.fallbackContainer, style]}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      
      <Text style={styles.title}>
        {providerName} Unavailable
      </Text>
      
      <Text style={styles.message}>
        {providerName} authentication is temporarily unavailable. 
        Please try again later or use a different sign-in method.
      </Text>
      
      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {onCancel && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Use Email Instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Fallback UI for offline state
export const OfflineFallback = ({ 
  onRetry, 
  onCancel, 
  style 
}) => {
  return (
    <View style={[styles.fallbackContainer, style]}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>📶</Text>
      </View>
      
      <Text style={styles.title}>
        No Internet Connection
      </Text>
      
      <Text style={styles.message}>
        Please check your internet connection and try again.
      </Text>
      
      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {onCancel && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Retry indicator component
export const RetryIndicator = ({ 
  isRetrying, 
  retryAttempt, 
  maxRetries, 
  provider,
  onCancel,
  style 
}) => {
  if (!isRetrying) return null;
  
  const providerName = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'OAuth';
  
  return (
    <View style={[styles.retryContainer, style]}>
      <ActivityIndicator size="small" color="#007AFF" />
      
      <Text style={styles.retryText}>
        Retrying {providerName} sign-in... ({retryAttempt}/{maxRetries})
      </Text>
      
      {onCancel && (
        <TouchableOpacity 
          style={styles.cancelRetryButton} 
          onPress={onCancel}
        >
          <Text style={styles.cancelRetryText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Network status indicator
export const NetworkStatusIndicator = ({ 
  isOnline, 
  isCheckingProviders,
  providerAvailability,
  style 
}) => {
  if (isOnline && !isCheckingProviders) return null;
  
  return (
    <View style={[styles.statusContainer, style]}>
      {!isOnline && (
        <View style={styles.statusItem}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={styles.statusText}>Offline</Text>
        </View>
      )}
      
      {isCheckingProviders && (
        <View style={styles.statusItem}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.statusText}>Checking providers...</Text>
        </View>
      )}
      
      {Object.entries(providerAvailability).map(([provider, status]) => (
        !status.available && (
          <View key={provider} style={styles.statusItem}>
            <Text style={styles.statusIcon}>⚠️</Text>
            <Text style={styles.statusText}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)} unavailable
            </Text>
          </View>
        )
      ))}
    </View>
  );
};

// Generic OAuth error fallback
export const OAuthErrorFallback = ({ 
  error, 
  onRetry, 
  onCancel, 
  onAction,
  style 
}) => {
  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case OAuthErrorTypes.NETWORK_ERROR:
      case OAuthErrorTypes.OFFLINE:
        return '📶';
      case OAuthErrorTypes.PROVIDER_UNAVAILABLE:
      case OAuthErrorTypes.PROVIDER_ERROR:
        return '⚠️';
      case OAuthErrorTypes.TIMEOUT:
        return '⏱️';
      case OAuthErrorTypes.CONFIG_ERROR:
        return '⚙️';
      case OAuthErrorTypes.ACCOUNT_CONFLICT:
        return '👥';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (errorType) => {
    switch (errorType) {
      case OAuthErrorTypes.NETWORK_ERROR:
        return 'Network Error';
      case OAuthErrorTypes.OFFLINE:
        return 'No Internet Connection';
      case OAuthErrorTypes.PROVIDER_UNAVAILABLE:
        return 'Service Unavailable';
      case OAuthErrorTypes.PROVIDER_ERROR:
        return 'Authentication Error';
      case OAuthErrorTypes.TIMEOUT:
        return 'Request Timed Out';
      case OAuthErrorTypes.CONFIG_ERROR:
        return 'Configuration Error';
      case OAuthErrorTypes.ACCOUNT_CONFLICT:
        return 'Account Conflict';
      default:
        return 'Authentication Failed';
    }
  };

  const shouldShowRetry = (errorType) => {
    const retryableTypes = [
      OAuthErrorTypes.NETWORK_ERROR,
      OAuthErrorTypes.TIMEOUT,
      OAuthErrorTypes.PROVIDER_ERROR,
      OAuthErrorTypes.PROVIDER_UNAVAILABLE,
      OAuthErrorTypes.OFFLINE
    ];
    return retryableTypes.includes(errorType);
  };

  const errorType = error?.type || OAuthErrorTypes.UNKNOWN_ERROR;
  const errorMessage = error?.message || 'An unexpected error occurred';
  const actions = error?.actions || [];

  return (
    <View style={[styles.fallbackContainer, style]}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{getErrorIcon(errorType)}</Text>
      </View>
      
      <Text style={styles.title}>
        {getErrorTitle(errorType)}
      </Text>
      
      <Text style={styles.message}>
        {errorMessage}
      </Text>
      
      <View style={styles.buttonContainer}>
        {/* Custom actions from error */}
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              action.type === 'primary' ? styles.retryButton : styles.cancelButton
            ]}
            onPress={() => onAction && onAction(action.action)}
          >
            <Text style={
              action.type === 'primary' ? styles.retryButtonText : styles.cancelButtonText
            }>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Default retry button */}
        {actions.length === 0 && shouldShowRetry(errorType) && onRetry && (
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {/* Default cancel button */}
        {actions.length === 0 && onCancel && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Waiting for connectivity component
export const WaitingForConnectivity = ({ 
  onCancel, 
  style 
}) => {
  return (
    <View style={[styles.fallbackContainer, style]}>
      <ActivityIndicator size="large" color="#007AFF" />
      
      <Text style={styles.title}>
        Waiting for Connection
      </Text>
      
      <Text style={styles.message}>
        Waiting for internet connection to continue with authentication...
      </Text>
      
      {onCancel && (
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 16,
  },
  
  iconContainer: {
    marginBottom: 16,
  },
  
  iconText: {
    fontSize: 48,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
  },
  
  retryButton: {
    backgroundColor: '#007AFF',
  },
  
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  retryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    margin: 8,
  },
  
  retryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
  
  cancelRetryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  
  cancelRetryText: {
    color: '#666',
    fontSize: 12,
  },
  
  statusContainer: {
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    margin: 8,
  },
  
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  statusText: {
    fontSize: 12,
    color: '#856404',
  },
});

export default {
  ProviderUnavailableFallback,
  OfflineFallback,
  RetryIndicator,
  NetworkStatusIndicator,
  OAuthErrorFallback,
  WaitingForConnectivity
};