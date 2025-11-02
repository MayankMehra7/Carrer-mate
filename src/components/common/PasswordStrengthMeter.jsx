/**
 * PasswordStrengthMeter Component
 * Visual password strength indicator with score and improvement tips
 * Matches the design shown in the user's example
 */

import { useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../../styles/spacing';
import { borderRadius, colors, typography } from '../../styles/theme';

/**
 * Password strength meter component
 * @param {Object} props - Component props
 * @param {string} props.password - Current password value
 * @param {Object} props.validation - Validation state from usePasswordValidation hook
 * @param {boolean} props.showScore - Whether to show numerical score
 * @param {boolean} props.showTips - Whether to show improvement tips
 * @returns {JSX.Element} Password strength meter with score and tips
 */
export const PasswordStrengthMeter = ({
  password,
  validation,
  showScore = true,
  showTips = true,
}) => {
  // Calculate password strength score and level
  const strengthData = useMemo(() => {
    if (!password || password.length === 0) {
      return {
        score: 0,
        level: 'None',
        color: colors.border.default,
        percentage: 0,
        tips: []
      };
    }

    let score = 0;
    const tips = [];

    // Length scoring (0-25 points)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;
    else if (password.length < 12) tips.push('Consider making it even longer');

    // Character variety scoring (0-40 points)
    if (validation.requirements.uppercase) score += 10;
    else tips.push('Add uppercase letters (A-Z)');

    if (validation.requirements.lowercase) score += 10;
    else tips.push('Add lowercase letters (a-z)');

    if (validation.requirements.number) score += 10;
    else tips.push('Add numbers (0-9)');

    if (validation.requirements.special) score += 10;
    else tips.push('Add special characters (!@#$%^&*)');

    // Personal info check (0-15 points)
    if (validation.requirements.noPersonalInfo) score += 15;
    else tips.push('Avoid using personal information');

    // HIBP check (0-20 points)
    if (validation.requirements.notCompromised === true) {
      score += 20;
    } else if (validation.requirements.notCompromised === false) {
      score -= 10; // Penalty for compromised passwords
      tips.push('Choose a less common password');
    }

    // Determine strength level and color
    let level, color;
    if (score < 30) {
      level = 'Weak';
      color = colors.error;
    } else if (score < 60) {
      level = 'Fair';
      color = colors.warning;
    } else if (score < 80) {
      level = 'Good';
      color = colors.primary;
    } else {
      level = 'Strong';
      color = colors.success;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      color,
      percentage: Math.max(0, Math.min(100, score)),
      tips: tips.slice(0, 3) // Limit to 3 tips
    };
  }, [password, validation.requirements]);

  if (!password || password.length === 0) {
    return null;
  }

  return (
    <View style={styles.strengthMeterContainer}>
      {/* Header with label and score */}
      <View style={styles.strengthMeterHeader}>
        <Text style={styles.strengthLabel}>
          Password Strength: <Text style={[
            styles.strengthScore,
            { color: strengthData.color }
          ]}>
            {strengthData.level}
          </Text>
        </Text>
        
        {showScore && (
          <Text style={[
            styles.strengthScore,
            { color: strengthData.color }
          ]}>
            {strengthData.score}/100
          </Text>
        )}
      </View>

      {/* Strength bar */}
      <View style={styles.strengthBar}>
        <Animated.View
          style={[
            styles.strengthBarFill,
            {
              width: `${strengthData.percentage}%`,
              backgroundColor: strengthData.color,
            },
          ]}
        />
      </View>

      {/* Improvement tips */}
      {showTips && strengthData.tips.length > 0 && (
        <View style={styles.strengthTips}>
          <Text style={styles.strengthTipsTitle}>
            💡 Tips to improve:
          </Text>
          {strengthData.tips.map((tip, index) => (
            <Text key={index} style={styles.strengthTip}>
              • {tip}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  strengthMeterContainer: {
    marginTop: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  
  strengthMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  strengthLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  
  strengthScore: {
    ...typography.styles.labelSmall,
    fontWeight: typography.fontWeight.semibold,
  },
  
  strengthBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  
  strengthBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
    transition: 'width 0.3s ease',
  },
  
  strengthTips: {
    marginTop: spacing.xs,
  },
  
  strengthTipsTitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  
  strengthTip: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
});

export default PasswordStrengthMeter;