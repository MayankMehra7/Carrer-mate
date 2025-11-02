/**
 * Toast Notification Component
 * 
 * Provides toast notifications for OAuth events and other app notifications
 * Supports different types (success, error, warning, info) with animations
 * 
 * Requirements: 5.2, 5.4
 */

import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { spacing } from '../../styles/spacing';
import { colors, shadows, typography } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Toast Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether toast is visible
 * @param {string} props.message - Toast message text
 * @param {string} props.type - Toast type ('success', 'error', 'warning', 'info')
 * @param {number} props.duration - Auto-hide duration in milliseconds
 * @param {Function} props.onHide - Callback when toast is hidden
 * @param {string} props.position - Toast position ('top', 'bottom')
 * @param {Function} props.onPress - Callback when toast is pressed
 * @returns {JSX.Element} Toast component
 */
export const Toast = ({
  visible = false,
  message = '',
  type = 'info',
  duration = 4000,
  onHide,
  position = 'top',
  onPress,
  ...props
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      showToast();
      
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  if (!visible && opacity._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.containerTop : styles.containerBottom,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...props}
    >
      <TouchableOpacity
        style={[styles.toast, getToastStyle(), shadows.md]}
        onPress={onPress || hideToast}
        activeOpacity={0.9}
        accessibilityRole="alert"
        accessibilityLabel={`${type} notification: ${message}`}
        accessibilityHint="Tap to dismiss"
      >
        <View style={styles.content}>
          <Text style={styles.icon} accessibilityHidden>
            {getIcon()}
          </Text>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Toast Provider Context
 */
const ToastContext = React.createContext();

/**
 * Toast Provider Component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const showToast = (message, type = 'info', options = {}) => {
    const id = Date.now().toString();
    const toast = {
      id,
      message,
      type,
      visible: true,
      ...options,
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    const duration = options.duration !== undefined ? options.duration : 4000;
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  };

  const hideToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const hideAllToasts = () => {
    setToasts([]);
  };

  const contextValue = {
    showToast,
    hideToast,
    hideAllToasts,
    showSuccess: (message, options) => showToast(message, 'success', options),
    showError: (message, options) => showToast(message, 'error', options),
    showWarning: (message, options) => showToast(message, 'warning', options),
    showInfo: (message, options) => showToast(message, 'info', options),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            duration={0} // Managed by provider
            onHide={() => hideToast(toast.id)}
            position={toast.position || 'top'}
            style={{ zIndex: 1000 + index }}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = {
  container: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 1000,
  },
  
  containerTop: {
    top: spacing.xl + 40, // Account for status bar
  },
  
  containerBottom: {
    bottom: spacing.xl + 40, // Account for navigation bar
  },
  
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    maxWidth: screenWidth - (spacing.base * 2),
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  icon: {
    fontSize: 18,
    color: colors.white,
    marginRight: spacing.sm,
    fontWeight: typography.fontWeight.bold,
  },
  
  message: {
    ...typography.styles.body,
    color: colors.white,
    flex: 1,
    fontWeight: typography.fontWeight.medium,
  },
  
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

export default Toast;