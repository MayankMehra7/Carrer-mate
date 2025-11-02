/**
 * OAuth Loading Indicator Component
 * 
 * Enhanced loading indicator for OAuth authentication flows
 * Supports different loading states and progress indication
 * 
 * Requirements: 5.1
 */

import React from 'react';
import {
    ActivityIndicator,
    Animated,
    Text,
    View
} from 'react-native';
import { spacing } from '../../styles/spacing';
import { colors, typography } from '../../styles/theme';

/**
 * OAuth Loading Indicator Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.stage - Current loading stage ('initializing', 'authenticating', 'validating', 'completing')
 * @param {string} props.provider - OAuth provider name ('Google', 'GitHub')
 * @param {boolean} props.showStage - Whether to show the current stage text
 * @param {string} props.size - Size of the loading indicator ('small', 'large')
 * @param {string} props.color - Color of the loading indicator
 * @param {Object} props.style - Additional styles
 * @returns {JSX.Element} OAuth loading indicator component
 */
export const OAuthLoadingIndicator = ({
  stage = 'authenticating',
  provider = '',
  showStage = false,
  size = 'small',
  color = colors.primary,
  style,
  ...props
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const getStageText = () => {
    switch (stage) {
      case 'initializing':
        return `Initializing ${provider} sign-in...`;
      case 'authenticating':
        return `Authenticating with ${provider}...`;
      case 'validating':
        return `Validating ${provider} credentials...`;
      case 'completing':
        return `Completing ${provider} sign-in...`;
      default:
        return `Signing in with ${provider}...`;
    }
  };

  return (
    <View style={[styles.container, style]} {...props}>
      <Animated.View style={[styles.indicatorContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator
          size={size}
          color={color}
          accessibilityLabel={`Loading ${provider} authentication`}
        />
      </Animated.View>
      
      {showStage && (
        <Text style={styles.stageText} accessibilityLiveRegion="polite">
          {getStageText()}
        </Text>
      )}
    </View>
  );
};

/**
 * OAuth Progress Indicator Component
 * Shows progress through multi-step OAuth process
 */
export const OAuthProgressIndicator = ({
  currentStep = 1,
  totalSteps = 3,
  provider = '',
  style,
  ...props
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={[styles.progressContainer, style]} {...props}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress}%` }
          ]} 
        />
      </View>
      
      <Text style={styles.progressText} accessibilityLiveRegion="polite">
        {`${provider} sign-in: Step ${currentStep} of ${totalSteps}`}
      </Text>
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  indicatorContainer: {
    marginRight: spacing.sm,
  },
  
  stageText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  progressContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  
  progressText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
};

export default OAuthLoadingIndicator;