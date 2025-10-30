// src/screens/ResumeUpload.jsx
import * as DocumentPicker from 'expo-document-picker';
import { useContext, useState } from "react";
import { Alert, Button, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { HeadingText } from "../components/common/HeadingText";
import styles from "./ResumeUpload.styles";

export default function ResumeUpload({ navigation }) {
  const [resumeText, setResumeText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name);
        setLoading(true);
        
        try {
          // Create a File object for the API
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const fileObj = new File([blob], file.name, { type: file.mimeType });
          
          // Try to extract text automatically
          const extractResult = await api.extractFileText(fileObj);
          
          if (extractResult.ok) {
            setResumeText(extractResult.data.text);
            Alert.alert(
              "✅ Success!", 
              `Text extracted from ${file.name}\n\nYou can now click "Analyze Resume" or edit the text if needed.`
            );
          } else {
            // Fallback to manual instructions
            Alert.alert(
              "Manual Input Required", 
              `Selected: ${file.name}\n\n${extractResult.data?.error || 'Could not extract text automatically'}\n\nPlease copy the text from your file and paste it in the text area below.`
            );
          }
        } catch (error) {
          console.error('File processing error:', error);
          Alert.alert(
            "Manual Input Required", 
            `Selected: ${file.name}\n\nAutomatic text extraction failed. Please copy the text from your file and paste it in the text area below.`
          );
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
      setLoading(false);
    }
  };

  const onAnalyze = async () => {
    if (!resumeText.trim()) {
      return Alert.alert(
        "Resume Text Required", 
        fileName 
          ? `Please paste the text content from "${fileName}" in the text area below.`
          : "Please upload a file or paste your resume text to analyze."
      );
    }
    
    setLoading(true);
    const res = await api.uploadResume({ email: user?.email, resume_text: resumeText });
    setLoading(false);
    
    if (res.ok) {
      setFeedback(res.data.feedback);
    } else {
      Alert.alert("Error", res.data?.error || "Analysis failed");
    }
  };

  const onGenerateCover = async () => {
    if (!resumeText) return Alert.alert("Error", "Please add your resume text first");
    navigation.navigate("CoverPreview", { resume_text: resumeText });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText level="h1" style={styles.title}>Upload Your Resume</HeadingText>
      
      {/* File Upload Section */}
      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>📄 Upload Resume File</HeadingText>
        <Button title="Choose File (PDF/DOC/TXT)" onPress={pickDocument} />
        {fileName ? (
          <View style={styles.fileStatus}>
            <Text style={styles.fileName}>✅ Selected: {fileName}</Text>
            {resumeText ? (
              <Text style={styles.fileInstruction}>
                🎉 Text extracted automatically! Ready to analyze.
              </Text>
            ) : (
              <Text style={styles.fileInstruction}>
                ⏳ Processing file... If text doesn't appear, paste it manually below.
              </Text>
            )}
          </View>
        ) : null}
      </View>

      {/* Text Input Section - Only show if no file selected or extraction failed */}
      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>
          {fileName ? "📝 Edit or Paste Resume Text" : "📝 Or Paste Resume Text Directly"}
        </HeadingText>
        <TextInput 
          value={resumeText} 
          onChangeText={setResumeText} 
          multiline 
          numberOfLines={10} 
          placeholder={fileName ? "Edit the extracted text or paste your resume text here..." : "Paste your resume text here..."}
          style={styles.textInput} 
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Analyzing..." : "🔍 Analyze Resume"} 
          onPress={onAnalyze} 
          disabled={loading}
        />
        <View style={styles.buttonSpacing} />
        <Button 
          title="📝 Generate Cover Letter" 
          onPress={onGenerateCover} 
          color="#007AFF"
        />
      </View>

      {/* Feedback Section */}
      {feedback ? (
        <View style={styles.feedbackContainer}>
          <HeadingText level="h2" style={styles.feedbackTitle}>🤖 AI Feedback</HeadingText>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

