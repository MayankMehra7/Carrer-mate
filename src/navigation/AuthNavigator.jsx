/**
 * AuthNavigator Component
 * Navigation structure for authentication screens with smooth transitions
 * Requirements: 4.1, 4.2, 4.3
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Easing } from 'react-native';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Import theme
import { colors } from '../styles/theme';

const Stack = createNativeStackNavigator();

/**
 * Custom transition configuration for smooth animations
 * Requirements: 4.1, 4.2, 4.3 - Smooth transitions between screens
 */
const transitionConfig = {
  // Slide transition for login/signup
  slideFromRight: {
    animation: 'slide_from_right',
    config: {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    },
  },
  
  // Fade transition for splash screen
  fade: {
    animation: 'fade',
    config: {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    },
  },
  
  // Modal-style transition for signup
  modal: {
    animation: 'slide_from_bottom',
    config: {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    },
  },
};

/**
 * Authentication Navigator
 * Handles navigation between splash, login, and signup screens
 */
export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
        animationDuration: 300,
        // Custom transition timing
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
              easing: Easing.out(Easing.cubic),
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
              easing: Easing.in(Easing.cubic),
            },
          },
        },
        // Card style for consistent background
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {/* Splash Screen */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false, // Disable gesture for splash
          animationDuration: 400,
        }}
      />
      
      {/* Login Screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          animationDuration: 300,
          // Custom header for accessibility
          headerShown: false,
          title: 'Login',
        }}
      />
      
      {/* Signup Screen */}
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          animationDuration: 300,
          // Allow swipe back to login
          gestureDirection: 'horizontal',
          title: 'Sign Up',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Navigation types for TypeScript support
 */
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
};

/**
 * Navigation helpers
 */
export const AuthScreens = {
  SPLASH: 'Splash' as const,
  LOGIN: 'Login' as const,
  SIGNUP: 'Signup' as const,
};

/**
 * Custom navigation options for different screen types
 */
export const getAuthScreenOptions = (screenName) => {
  const baseOptions = {
    headerShown: false,
    gestureEnabled: true,
    cardStyle: {
      backgroundColor: colors.background,
    },
  };
  
  switch (screenName) {
    case AuthScreens.SPLASH:
      return {
        ...baseOptions,
        animation: 'fade',
        gestureEnabled: false,
        animationDuration: 400,
      };
      
    case AuthScreens.LOGIN:
      return {
        ...baseOptions,
        animation: 'slide_from_right',
        animationDuration: 300,
      };
      
    case AuthScreens.SIGNUP:
      return {
        ...baseOptions,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureDirection: 'horizontal',
      };
      
    default:
      return baseOptions;
  }
};

/**
 * Navigation animation presets
 */
export const AuthAnimationPresets = {
  // Slide from right (default)
  slideFromRight: {
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      };
    },
  },
  
  // Fade transition
  fade: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current }) => {
      return {
        cardStyle: {
          opacity: current.progress,
        },
      };
    },
  },
  
  // Modal-style (slide from bottom)
  modal: {
    gestureDirection: 'vertical',
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
      };
    },
  },
};

export default AuthNavigator;