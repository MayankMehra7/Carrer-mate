// src/screens/CoverLetterPreview.jsx
import { useContext, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
import { api } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import styles from "./CoverLetterPreview.styles";

export default function CoverLetterPreview({ route, navigation }) {
  const { resume_text } = route.params || {};
  const { user } = useContext(AuthContext);

  const [jd, setJd] = useState("");
  const [cover, setCover] = useState("");
  const [coverId, setCoverId] = useState(null);
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    if (!jd) return Alert.alert("Paste job description");
    setLoading(true);
    const res = await api.generateCover({ email: user.email, resume_text, job_description: jd, name: user.name });
    setLoading(false);
    if (res.ok) {
      setCover(res.data.cover_letter);
      setCoverId(res.data.cover_id);
    } else {
      Alert.alert("Failed to generate", res.data?.error || res.data?.message);
    }
  };

  const onAccept = async () => {
    if (!coverId) return Alert.alert("No cover id");
    const res = await api.acceptCover({ cover_id: coverId });
    if (res.ok) {
      Alert.alert("Saved", "Cover letter accepted and saved");
      navigation.navigate("Career");
    } else {
      Alert.alert("Error", res.data?.message || "Failed to accept");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Paste Job Description</Text>
      <TextInput value={jd} onChangeText={setJd} multiline numberOfLines={6} style={styles.textInput} />
      <Button title={loading ? "Generating..." : "Generate Cover Letter"} onPress={onGenerate} />
      {cover ? (
        <>
          <Text style={styles.coverTitle}>Cover Letter</Text>
          <Text>{cover}</Text>
          <Button title="Accept" onPress={onAccept} />
        </>
      ) : null}
    </ScrollView>
  );
}
