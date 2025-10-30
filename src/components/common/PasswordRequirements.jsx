/**
 * PasswordRequirements Component
 * Displays a visual checklist of password requirements with smooth transitions and enhanced UX
 * Requirements: 4.1, 4.2, 4.3, 4.4, 6.2, 6.3, 6.4
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import styles from './PasswordRequirements.styles';

/**
 * Password requirements checklist component with enhanced UX
 * @param {Object} props - Component props
 * @param {Object} props.validation - Validation state from usePasswordValidation hook
 * @param {boolean} props.showTitle - Whether to show the requirements title (default: true)
 * @param {boolean} props.showTooltips - Whether to show helpful tooltips (default: true)
 * @param {boolean} props.showProgress - Whether to show progress indicator (default: true)
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} Enhanced password requirements checklist
 */
export const PasswordRequirements = ({ 
  validation, 
  showTitle = true, 
  showTooltips = true,
  showProgress = true,
  style 
}) => {
  // State for managing tooltips and animations
  const [activeTooltip, setActiveTooltip] = useState(null);
  const animatedValues = useRef({});
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Requirement 4.1: Enhanced requirements with helpful explanations
  const requirements = [
    { 
      key: 'length', 
      label: 'At least 10 characters', 
      tooltip: 'Longer passwords are harder to crack. Aim for 12+ characters for extra security.',
      met: validation.requirements.length,
      icon: '📏'
    },
    { 
      key: 'uppercase', 
      label: 'At least one uppercase letter (A-Z)', 
      tooltip: 'Include capital letters like A, B, C to increase password complexity.',
      met: validation.requirements.uppercase,
      icon: '🔤'
    },
    { 
      key: 'lowercase', 
      label: 'At least one lowercase letter (a-z)', 
      tooltip: 'Include small letters like a, b, c for better password strength.',
      met: validation.requirements.lowercase,
      icon: '🔡'
    },
    { 
      key: 'number', 
      label: 'At least one number (0-9)', 
      tooltip: 'Add numbers like 1, 2, 3 to make your password more secure.',
      met: validation.requirements.number,
      icon: '🔢'
    },
    { 
      key: 'special', 
      label: 'At least one special character', 
      tooltip: 'Use symbols like !@#$%^&* to significantly strengthen your password.',
      met: validation.requirements.special,
      icon: '🔣'
    },
    { 
      key: 'noPersonalInfo', 
      label: 'No personal information', 
      tooltip: 'Avoid using your name, email, or username in your password.',
      met: validation.requirements.noPersonalInfo,
      icon: '🚫'
    },
    { 
      key: 'notCompromised', 
      label: 'Not found in data breaches', 
      tooltip: 'We check if your password has appeared in known security breaches.',
      met: validation.requirements.notCompromised,
      loading: validation.isCheckingHIBP,
      icon: '🛡️'
    }
  ];

  // Initialize animated values for each requirement
  useEffect(() => {
    requirements.forEach(req => {
      if (!animatedValues.current[req.key]) {
        animatedValues.current[req.key] = new Animated.Value(req.met ? 1 : 0);
      }
    });
  }, []);

  // Animate requirement status changes
  useEffect(() => {
    requirements.forEach(req => {
      if (animatedValues.current[req.key]) {
        Animated.timing(animatedValues.current[req.key], {
          toValue: req.met ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [validation.requirements]);

  // Animate progress bar
  useEffect(() => {
    const progress = validation.progressPercentage / 100;
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [validation.progressPercentage]);

  const toggleTooltip = (key) => {
    setActiveTooltip(activeTooltip === key ? null : key);
  };

  return (
    <View style={[styles.requirementsContainer, style]}>
      {showTitle && (
        <View style={styles.headerContainer}>
          <Text style={styles.requirementsTitle}>Password Requirements</Text>
          {showProgress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {validation.metRequirementsCount}/{validation.totalRequirementsCount} complete
              </Text>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      )}
      
      {requirements.map((req) => {
        const animatedValue = animatedValues.current[req.key];
        
        return (
          <View key={req.key}>
            <TouchableOpacity 
              style={styles.requirementRow}
              onPress={() => showTooltips && toggleTooltip(req.key)}
              activeOpacity={showTooltips ? 0.7 : 1}
            >
              {/* Enhanced visual indicators with smooth transitions */}
              <View style={styles.iconContainer}>
                {req.loading ? (
                  <Text style={styles.loadingIcon}>⏳</Text>
                ) : (
                  <Animated.View
                    style={{
                      transform: [{
                        scale: animatedValue ? animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.1],
                        }) : 1,
                      }],
                    }}
                  >
                    <Text style={req.met ? styles.metIcon : styles.unmetIcon}>
                      {req.met ? '✅' : req.icon}
                    </Text>
                  </Animated.View>
                )}
              </View>
              
              {/* Enhanced requirement text with animations */}
              <Animated.View 
                style={[
                  styles.requirementTextContainer,
                  animatedValue && {
                    backgroundColor: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', '#f8fff8'],
                    }),
                  }
                ]}
              >
                <Text style={[
                  styles.requirementText,
                  req.met ? styles.metText : styles.unmetText
                ]}>
                  {req.label}
                </Text>
                
                {showTooltips && (
                  <Text style={styles.tooltipIndicator}>ℹ️</Text>
                )}
              </Animated.View>
            </TouchableOpacity>
            
            {/* Tooltip display */}
            {showTooltips && activeTooltip === req.key && (
              <Animated.View 
                style={styles.tooltipContainer}
                entering="fadeIn"
                exiting="fadeOut"
              >
                <Text style={styles.tooltipText}>{req.tooltip}</Text>
              </Animated.View>
            )}
          </View>
        );
      })}
      
      {/* Overall status message */}
      {validation.isValid && (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>
            Great! Your password meets all security requirements.
          </Text>
        </View>
      )}
      
      {/* HIBP status message */}
      {validation.hibpError && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Security check temporarily unavailable - password validation continues
          </Text>
        </View>
      )}
    </View>
  );
};

export default PasswordRequirements;