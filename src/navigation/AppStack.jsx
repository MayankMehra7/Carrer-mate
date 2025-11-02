// src/navigation/AppStack.jsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import CareerPage from "../screens/CareerPage";
import CoverLetterPreview from "../screens/CoverLetterPreview";
import ForgotPassword from "../screens/ForgotPassword";
import JobDescriptionCover from "../screens/JobDescriptionCover";
import OtpVerify from "../screens/OtpVerify";
import ResetPassword from "../screens/ResetPassword";
import ResumeEditor from "../screens/ResumeEditor";
import ResumePreview from "../screens/ResumePreview";
import ResumeTemplates from "../screens/ResumeTemplates";
import ResumeUpload from "../screens/ResumeUpload";
import TemplatePreview from "../screens/TemplatePreview";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  const { user, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Main App Screens - Only for authenticated users */}
        <Stack.Screen name="Career" component={CareerPage} />
        <Stack.Screen name="ResumeEditor" component={ResumeEditor} />
        <Stack.Screen name="ResumePreview" component={ResumePreview} />
        <Stack.Screen name="ResumeUpload" component={ResumeUpload} />
        <Stack.Screen name="ResumeTemplates" component={ResumeTemplates} />
        <Stack.Screen name="TemplatePreview" component={TemplatePreview} />
        <Stack.Screen name="JobDescriptionCover" component={JobDescriptionCover} />
        <Stack.Screen name="CoverPreview" component={CoverLetterPreview} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        
        {/* Auth-related screens that might be needed after login */}
        <Stack.Screen name="OtpVerify" component={OtpVerify} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
