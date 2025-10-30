// src/screens/ResumeEditor.jsx
import { useContext, useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../api/api";
import { HeadingText } from "../components/common/HeadingText";
import { AuthContext } from "../context/AuthContext";
import styles from "./ResumeEditor.styles";

export default function ResumeEditor({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  
  // Resume sections
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    linkedin: "",
    website: ""
  });
  
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState([
    { company: "", position: "", duration: "", description: "" }
  ]);
  const [education, setEducation] = useState([
    { institution: "", degree: "", duration: "", details: "" }
  ]);
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState([
    { name: "", description: "", technologies: "" }
  ]);

  useEffect(() => {
    // Load existing resume if available
    loadExistingResume();
  }, []);

  const loadExistingResume = async () => {
    try {
      const res = await api.getResume(user?.email);
      if (res.ok && res.data.resume_text) {
        // Parse existing resume text and populate fields
        parseResumeText(res.data.resume_text);
      }
    } catch (error) {
      console.log("No existing resume found");
    }
  };

  const parseResumeText = (resumeText) => {
    // Basic parsing - in a real app, you'd use more sophisticated parsing
    const lines = resumeText.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase().trim();
      if (lowerLine.includes('summary') || lowerLine.includes('objective')) {
        currentSection = 'summary';
      } else if (lowerLine.includes('experience') || lowerLine.includes('work')) {
        currentSection = 'experience';
      } else if (lowerLine.includes('education')) {
        currentSection = 'education';
      } else if (lowerLine.includes('skills')) {
        currentSection = 'skills';
      }
      
      // Simple parsing logic - you can enhance this
      if (currentSection === 'summary' && line.trim() && !lowerLine.includes('summary')) {
        setSummary(prev => prev + line + '\n');
      }
    });
  };

  const addExperience = () => {
    setExperience([...experience, { company: "", position: "", duration: "", description: "" }]);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    const updated = experience.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    setExperience(updated);
  };

  const addEducation = () => {
    setEducation([...education, { institution: "", degree: "", duration: "", details: "" }]);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    const updated = education.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    );
    setEducation(updated);
  };

  const addProject = () => {
    setProjects([...projects, { name: "", description: "", technologies: "" }]);
  };

  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index, field, value) => {
    const updated = projects.map((proj, i) => 
      i === index ? { ...proj, [field]: value } : proj
    );
    setProjects(updated);
  };

  const generateResumeText = () => {
    let resumeText = `${personalInfo.name}\n`;
    if (personalInfo.email) resumeText += `Email: ${personalInfo.email}\n`;
    if (personalInfo.phone) resumeText += `Phone: ${personalInfo.phone}\n`;
    if (personalInfo.location) resumeText += `Location: ${personalInfo.location}\n`;
    if (personalInfo.linkedin) resumeText += `LinkedIn: ${personalInfo.linkedin}\n`;
    if (personalInfo.website) resumeText += `Website: ${personalInfo.website}\n`;
    
    if (summary) {
      resumeText += `\nSUMMARY\n${summary}\n`;
    }
    
    if (experience.some(exp => exp.company || exp.position)) {
      resumeText += `\nEXPERIENCE\n`;
      experience.forEach(exp => {
        if (exp.company || exp.position) {
          resumeText += `${exp.position} at ${exp.company} (${exp.duration})\n`;
          if (exp.description) resumeText += `${exp.description}\n\n`;
        }
      });
    }
    
    if (education.some(edu => edu.institution || edu.degree)) {
      resumeText += `\nEDUCATION\n`;
      education.forEach(edu => {
        if (edu.institution || edu.degree) {
          resumeText += `${edu.degree} - ${edu.institution} (${edu.duration})\n`;
          if (edu.details) resumeText += `${edu.details}\n\n`;
        }
      });
    }
    
    if (skills) {
      resumeText += `\nSKILLS\n${skills}\n`;
    }
    
    if (projects.some(proj => proj.name)) {
      resumeText += `\nPROJECTS\n`;
      projects.forEach(proj => {
        if (proj.name) {
          resumeText += `${proj.name}\n`;
          if (proj.description) resumeText += `${proj.description}\n`;
          if (proj.technologies) resumeText += `Technologies: ${proj.technologies}\n\n`;
        }
      });
    }
    
    return resumeText;
  };

  const saveResume = async () => {
    const resumeText = generateResumeText();
    if (!resumeText.trim()) {
      return Alert.alert("Error", "Please fill in at least some resume information");
    }
    
    setLoading(true);
    const res = await api.uploadResume({ email: user?.email, resume_text: resumeText });
    setLoading(false);
    
    if (res.ok) {
      Alert.alert("Success", "Resume saved successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert("Error", res.data?.error || "Failed to save resume");
    }
  };

  const getAISuggestions = async (section) => {
    const resumeText = generateResumeText();
    if (!resumeText.trim()) {
      return Alert.alert("No Content", "Please fill in some resume information first");
    }
    
    setAiSuggesting(true);
    
    try {
      const res = await api.getAISuggestions({
        section: section,
        resume_text: resumeText,
        email: user?.email
      });
      
      if (res.ok) {
        Alert.alert(`AI Suggestions - ${section.charAt(0).toUpperCase() + section.slice(1)}`, res.data.suggestions);
      } else {
        Alert.alert("Error", res.data?.error || "Failed to get AI suggestions");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get AI suggestions");
    } finally {
      setAiSuggesting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText level="h1" style={styles.title}>Resume Editor</HeadingText>
      
      {/* Personal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HeadingText level="h2" style={styles.sectionTitle}>👤 Personal Information</HeadingText>
          <TouchableOpacity onPress={() => getAISuggestions('personal information')}>
            <Text style={styles.aiButton}>🤖 AI Help</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={personalInfo.name}
          onChangeText={(text) => setPersonalInfo({...personalInfo, name: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={personalInfo.email}
          onChangeText={(text) => setPersonalInfo({...personalInfo, email: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={personalInfo.phone}
          onChangeText={(text) => setPersonalInfo({...personalInfo, phone: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Location (City, State)"
          value={personalInfo.location}
          onChangeText={(text) => setPersonalInfo({...personalInfo, location: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="LinkedIn Profile"
          value={personalInfo.linkedin}
          onChangeText={(text) => setPersonalInfo({...personalInfo, linkedin: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Website/Portfolio"
          value={personalInfo.website}
          onChangeText={(text) => setPersonalInfo({...personalInfo, website: text})}
        />
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HeadingText level="h2" style={styles.sectionTitle}>📝 Professional Summary</HeadingText>
          <TouchableOpacity onPress={() => getAISuggestions('summary')}>
            <Text style={styles.aiButton}>🤖 AI Help</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="Write a compelling professional summary..."
          value={summary}
          onChangeText={setSummary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HeadingText level="h2" style={styles.sectionTitle}>💼 Work Experience</HeadingText>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => getAISuggestions('experience')}>
              <Text style={styles.aiButton}>🤖 AI Help</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addExperience}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {experience.map((exp, index) => (
          <View key={index} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <HeadingText level="h3" style={styles.itemTitle}>Experience {index + 1}</HeadingText>
              {experience.length > 1 && (
                <TouchableOpacity onPress={() => removeExperience(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Company Name"
              value={exp.company}
              onChangeText={(text) => updateExperience(index, 'company', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Job Title"
              value={exp.position}
              onChangeText={(text) => updateExperience(index, 'position', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (e.g., Jan 2020 - Present)"
              value={exp.duration}
              onChangeText={(text) => updateExperience(index, 'duration', text)}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Job description and achievements..."
              value={exp.description}
              onChangeText={(text) => updateExperience(index, 'description', text)}
              multiline
              numberOfLines={3}
            />
          </View>
        ))}
      </View>

      {/* Education */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HeadingText level="h2" style={styles.sectionTitle}>🎓 Education</HeadingText>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => getAISuggestions('education')}>
              <Text style={styles.aiButton}>🤖 AI Help</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addEducation}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {education.map((edu, index) => (
          <View key={index} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <HeadingText level="h3" style={styles.itemTitle}>Education {index + 1}</HeadingText>
              {education.length > 1 && (
                <TouchableOpacity onPress={() => removeEducation(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Institution Name"
              value={edu.institution}
              onChangeText={(text) => updateEducation(index, 'institution', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Degree (e.g., Bachelor of Science in Computer Science)"
              value={edu.degree}
              onChangeText={(text) => updateEducation(index, 'degree', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (e.g., 2018 - 2022)"
              value={edu.duration}
              onChangeText={(text) => updateEducation(index, 'duration', text)}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Additional details (GPA, honors, relevant coursework)..."
              value={edu.details}
              onChangeText={(text) => updateEducation(index, 'details', text)}
              multiline
              numberOfLines={2}
            />
          </View>
        ))}
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HeadingText level="h2" style={styles.sectionTitle}>🛠️ Skills</HeadingText>
          <TouchableOpacity onPress={() => getAISuggestions('skills')}>
            <Text style={styles.aiButton}>🤖 AI Help</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="List your technical and soft skills (e.g., Python, JavaScript, Project Management, Communication)..."
          value={skills}
          onChangeText={setSkills}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Projects */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <HeadingText level="h2" style={styles.sectionTitle}>🚀 Projects</HeadingText>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => getAISuggestions('projects')}>
              <Text style={styles.aiButton}>🤖 AI Help</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addProject}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {projects.map((proj, index) => (
          <View key={index} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <HeadingText level="h3" style={styles.itemTitle}>Project {index + 1}</HeadingText>
              {projects.length > 1 && (
                <TouchableOpacity onPress={() => removeProject(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Project Name"
              value={proj.name}
              onChangeText={(text) => updateProject(index, 'name', text)}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Project description and impact..."
              value={proj.description}
              onChangeText={(text) => updateProject(index, 'description', text)}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Technologies Used"
              value={proj.technologies}
              onChangeText={(text) => updateProject(index, 'technologies', text)}
            />
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Saving..." : "💾 Save Resume"} 
          onPress={saveResume} 
          disabled={loading}
        />
        <View style={styles.buttonSpacing} />
        <Button 
          title="👁️ Live Preview & Edit" 
          onPress={() => {
            // Convert current form data to resume data format
            const resumeData = {
              name: personalInfo.name,
              email: personalInfo.email,
              phone: personalInfo.phone,
              location: personalInfo.location,
              linkedin: personalInfo.linkedin,
              website: personalInfo.website,
              summary: summary,
              experience: experience.filter(exp => exp.company || exp.position),
              education: education.filter(edu => edu.institution || edu.degree),
              skills: skills,
              projects: projects.filter(proj => proj.name)
            };
            navigation.navigate('ResumePreview', { resumeData });
          }}
          color="#007AFF"
        />
        <View style={styles.buttonSpacing} />
        <Button 
          title="📄 Text Preview" 
          onPress={() => {
            const resumeText = generateResumeText();
            Alert.alert("Resume Preview", resumeText);
          }}
          color="#6c757d"
        />
      </View>
    </ScrollView>
  );
}

