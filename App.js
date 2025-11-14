import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import styles from './App.styles';
import { AuthContext, AuthProvider } from './src/context/AuthContext.jsx'; // Updated import
import { initializeFeatureFlags } from './src/config/featureFlags';
// import { useAppFonts } from './src/hooks/useFonts'; // Assuming fonts are not the focus

// Import all your screens
import CareerPage from './src/screens/CareerPage';
import CoverLetterPreview from './src/screens/CoverLetterPreview';
import ForgotPassword from './src/screens/ForgotPassword';
import JobDescriptionCover from './src/screens/JobDescriptionCover';
import Login from './src/screens/Login'; // Ensure this is the new Login screen
import OtpVerify from './src/screens/OtpVerify';
import ResetPassword from './src/screens/ResetPassword';
import ResumeEditor from './src/screens/ResumeEditor';
import ResumePreview from './src/screens/ResumePreview';
import ResumeTemplates from './src/screens/ResumeTemplates';
import ResumeUpload from './src/screens/ResumeUpload';
import Signup from './src/screens/Signup';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loadingAuth } = useContext(AuthContext);
  const [featureFlagsInitialized, setFeatureFlagsInitialized] = useState(false);
  const [initializingFlags, setInitializingFlags] = useState(true);

  // Initialize feature flags on app start
  useEffect(() => {
    const initFlags = async () => {
      try {
        setInitializingFlags(true);
        const success = await initializeFeatureFlags();
        setFeatureFlagsInitialized(success);
        
        if (!success) {
          console.warn('Feature flags initialization failed, using defaults');
        }
      } catch (error) {
        console.error('Error initializing feature flags:', error);
        setFeatureFlagsInitialized(false);
      } finally {
        setInitializingFlags(false);
      }
    };

    initFlags();
  }, []);

  // Show loading screen while initializing
  if (loadingAuth || initializingFlags) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {initializingFlags ? 'Initializing...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Career" : "Login"}>
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="Career" 
              component={CareerPage} 
              options={{ headerShown: false }}
            />
            <Stack.Screen name="ResumeUpload" component={ResumeUpload} />
            <Stack.Screen name="ResumeEditor" component={ResumeEditor} />
            <Stack.Screen name="ResumePreview" component={ResumePreview} />
            <Stack.Screen name="ResumeTemplates" component={ResumeTemplates} />
            <Stack.Screen name="CoverPreview" component={CoverLetterPreview} />
            <Stack.Screen name="JobDescriptionCover" component={JobDescriptionCover} />
          </>
        ) : (
          // Authentication screens
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="OtpVerify" component={OtpVerify} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}