// src/screens/JobDescriptionCover.jsx
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { HeadingText } from "../components/common/HeadingText";
import styles from "./JobDescriptionCover.styles";

export default function JobDescriptionCover({ navigation }) {
  const { user } = useContext(AuthContext);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeSuggestions, setResumeSuggestions] = useState("");
  const [coverId, setCoverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    checkForStoredResume();
  }, []);

  const checkForStoredResume = async () => {
    try {
      const res = await api.getResume(user?.email);
      if (res.ok) {
        setHasResume(true);
      } else {
        setHasResume(false);
      }
    } catch (error) {
      setHasResume(false);
    }
  };

  const onGenerate = async () => {
    if (!jobDescription.trim()) {
      return Alert.alert("Error", "Please paste the job description");
    }

    if (!hasResume) {
      return Alert.alert(
        "No Resume Found", 
        "Please upload your resume first before generating a cover letter.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upload Resume", onPress: () => navigation.navigate("ResumeUpload") }
        ]
      );
    }

    setLoading(true);
    try {
      const res = await api.generateCoverFromStored({
        email: user.email,
        job_description: jobDescription,
        job_title: jobTitle || "Position",
        name: user.name
      });

      if (res.ok) {
        setCoverLetter(res.data.cover_letter);
        setResumeSuggestions(res.data.resume_suggestions);
        setCoverId(res.data.cover_id);
      } else {
        Alert.alert("Error", res.data?.error || "Failed to generate cover letter");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onAccept = async () => {
    if (!coverId) return Alert.alert("Error", "No cover letter to accept");
    
    const res = await api.acceptCover({ cover_id: coverId });
    if (res.ok) {
      Alert.alert("Success", "Cover letter saved successfully!");
      navigation.navigate("Career");
    } else {
      Alert.alert("Error", res.data?.message || "Failed to save cover letter");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText level="h1" style={styles.title}>Generate Cover Letter from Job Description</HeadingText>
      
      {!hasResume && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ No resume found. Please upload your resume first.</Text>
          <Button title="Upload Resume" onPress={() => navigation.navigate("ResumeUpload")} />
        </View>
      )}

      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>Job Title (Optional)</HeadingText>
        <TextInput 
          value={jobTitle} 
          onChangeText={setJobTitle} 
          placeholder="e.g., Software Engineer, Marketing Manager"
          style={styles.titleInput} 
        />
      </View>

      <View style={styles.section}>
        <HeadingText level="h2" style={styles.sectionTitle}>Job Description *</HeadingText>
        <TextInput 
          value={jobDescription} 
          onChangeText={setJobDescription} 
          multiline 
          numberOfLines={8} 
          placeholder="Paste the complete job description here..."
          style={styles.textInput} 
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "🤖 Generating..." : "🚀 Generate Cover Letter & Resume Tips"} 
          onPress={onGenerate} 
          disabled={loading || !hasResume}
        />
      </View>

      {coverLetter ? (
        <View style={styles.resultContainer}>
          <HeadingText level="h2" style={styles.resultTitle}>📝 Generated Cover Letter</HeadingText>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>{coverLetter}</Text>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <Button title="✅ Accept & Save" onPress={onAccept} color="#28a745" />
          </View>
        </View>
      ) : null}

      {resumeSuggestions ? (
        <View style={styles.resultContainer}>
          <HeadingText level="h2" style={styles.resultTitle}>💡 Resume Improvement Suggestions</HeadingText>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>{resumeSuggestions}</Text>
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

