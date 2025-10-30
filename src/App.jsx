// src/App.jsx
import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from "./context/AuthContext";
import { useFonts } from "./hooks/useFonts";
import AppStack from "./navigation/AppStack";
import AuthNavigator from "./navigation/AuthNavigator";
import { colors } from "./styles/theme";

export default function App() {
  const { fontsLoaded } = useFonts();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is logged in (check token, session, etc.)
        // For now, we'll default to showing auth screens for demo
        // In a real app, you'd check AsyncStorage, SecureStore, etc.
        
        // Simulate checking auth status
        setTimeout(() => {
          setIsAuthenticated(false); // Show auth screens for demo
          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    if (fontsLoaded) {
      checkAuthStatus();
    }
  }, [fontsLoaded]);

  // Show nothing while fonts are loading
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
