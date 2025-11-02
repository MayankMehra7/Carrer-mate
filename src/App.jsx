// src/App.jsx
import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { ToastProvider } from "./components/common/Toast";
import { initializeFeatureFlags } from "./config/featureFlags";
import { AuthProvider } from "./context/AuthContext";
import { useFonts } from "./hooks/useFonts";
import AppStack from "./navigation/AppStack";
import AuthNavigator from "./navigation/AuthNavigator";
import { colors } from "./styles/theme";

export default function App() {
  const { fontsLoaded } = useFonts();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlagsInitialized, setFeatureFlagsInitialized] = useState(false);

  // Initialize feature flags and check authentication status on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize feature flags first (Requirements: 3.1, 3.2, 3.3, 3.4)
        const flagsInitialized = await initializeFeatureFlags();
        setFeatureFlagsInitialized(flagsInitialized);
        
        if (!flagsInitialized) {
          console.warn('Feature flags initialization failed, using defaults');
        }

        // Check if user is logged in (check token, session, etc.)
        // For now, we'll default to showing auth screens for demo
        // In a real app, you'd check AsyncStorage, SecureStore, etc.
        
        // Simulate checking auth status
        setTimeout(() => {
          setIsAuthenticated(false); // Show auth screens for demo
          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error('Error during app initialization:', error);
        
        // Ensure feature flags are set to defaults even if initialization fails
        setFeatureFlagsInitialized(false);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    if (fontsLoaded) {
      initializeApp();
    }
  }, [fontsLoaded]);

  // Show nothing while fonts are loading or app is initializing
  if (!fontsLoaded || isLoading) {
    return null; // or a loading screen
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle="dark-content" 
            backgroundColor={colors.background}
            translucent={false}
          />
          {isAuthenticated ? (
            <AppStack />
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
      </AuthProvider>
    </ToastProvider>
  );
}
