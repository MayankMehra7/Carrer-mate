/**
 * SplashScreen Component
 * Modern animated splash screen with CareerMate branding
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/theme';
import { announceForAccessibility } from '../utils/accessibility';

/**
 * Animated splash screen component
 * Shows CareerMate logo with smooth animations before navigating to login
 */
export const SplashScreen = () => {
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const taglineFadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Announce screen for accessibility
    announceForAccessibility('CareerMate app is loading');
    
    // Start entrance animations
    const startAnimations = () => {
      // Logo fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Tagline fade in after logo animation
        Animated.timing(taglineFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    };
    
    // Start animations after a brief delay
    const animationTimer = setTimeout(startAnimations, 200);
    
    // Navigate to login screen after total display time
    const navigationTimer = setTimeout(() => {
      announceForAccessibility('Loading complete, navigating to login');
      navigation.replace('Login');
    }, 2500);
    
    // Cleanup timers
    return () => {
      clearTimeout(animationTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigation, fadeAnim, scaleAnim, taglineFadeAnim]);
  
  return (
    <View style={authStyles.splashContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.primary} 
        translucent={false}
      />
      
      {/* Gradient background */}
      <LinearGradient
        colors={colors.gradients.primary}
        style={authStyles.splashGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Logo container with animations */}
        <Animated.View
          style={[
            authStyles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="CareerMate logo"
        >
          {/* Main logo text */}
          <Text 
            style={authStyles.logoText}
            accessible={true}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            CareerMate
          </Text>
          
          {/* Tagline with delayed fade in */}
          <Animated.Text
            style={[
              authStyles.tagline,
              {
                opacity: taglineFadeAnim,
              },
            ]}
            accessible={true}
            accessibilityRole="text"
          >
            Your Career Journey Starts Here
          </Animated.Text>
        </Animated.View>
        
        {/* Loading indicator (optional) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 80,
              alignSelf: 'center',
            },
            {
              opacity: taglineFadeAnim,
            },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.white,
              borderRadius: 2,
              opacity: 0.7,
            }}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

export default SplashScreen;