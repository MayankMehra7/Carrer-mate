import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { HeadingText } from '../components/common/HeadingText';
import styles from './ResumePreview.styles';

export default function ResumePreview({ navigation, route }) {
  const [isEditing, setIsEditing] = useState(false);
  const [resumeData, setResumeData] = useState({
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    website: 'johndoe.com',
    summary: 'Experienced software developer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable solutions and leading development teams.',
    experience: [
      {
        company: 'Tech Solutions Inc.',
        position: 'Senior Software Developer',
        duration: 'Jan 2022 - Present',
        description: '• Led development of microservices architecture serving 1M+ users\n• Improved application performance by 40% through optimization\n• Mentored junior developers and conducted code reviews'
      },
      {
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        duration: 'Jun 2020 - Dec 2021',
        description: '• Built responsive web applications using React and Node.js\n• Implemented CI/CD pipelines reducing deployment time by 60%\n• Collaborated with cross-functional teams in agile environment'
      }
    ],
    education: [
      {
        institution: 'University of Technology',
        degree: 'Bachelor of Science in Computer Science',
        duration: '2016 - 2020',
        details: 'GPA: 3.8/4.0, Dean\'s List, Relevant Coursework: Data Structures, Algorithms, Software Engineering'
      }
    ],
    skills: 'JavaScript, React, Node.js, Python, AWS, Docker, Git, MongoDB, PostgreSQL, Agile/Scrum, Team Leadership',
    projects: [
      {
        name: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform with React frontend and Node.js backend, supporting 10,000+ products and real-time inventory management.',
        technologies: 'React, Node.js, MongoDB, Stripe API, AWS'
      }
    ]
  });

  // Load resume data from route params if available
  useEffect(() => {
    if (route.params?.resumeData) {
      setResumeData(route.params.resumeData);
    }
  }, [route.params]);

  const updateField = (section, field, value, index = null) => {
    setResumeData(prev => {
      if (index !== null) {
        // For array fields like experience, education, projects
        const newArray = [...prev[section]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      } else {
        // For simple fields
        return { ...prev, [field]: value };
      }
    });
  };

  const addArrayItem = (section, template) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], template]
    }));
  };

  const removeArrayItem = (section, index) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const EditableText = ({ value, onChangeText, style, multiline = false, placeholder }) => {
    if (!isEditing) {
      return <Text style={style}>{value}</Text>;
    }
    
    return (
      <TextInput
        style={[style, styles.editableInput]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
      />
    );
  };

  const EditableHeading = ({ level, value, onChangeText, style }) => {
    if (!isEditing) {
      return <HeadingText level={level} style={style}>{value}</HeadingText>;
    }
    
    return (
      <TextInput
        style={[style, styles.editableHeading]}
        value={value}
        onChangeText={onChangeText}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Edit Toggle */}
      <View style={styles.header}>
        <HeadingText level="h2" style={styles.headerTitle}>Resume Preview</HeadingText>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.toggleButton, isEditing && styles.toggleButtonActive]}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={[styles.toggleButtonText, isEditing && styles.toggleButtonTextActive]}>
              {isEditing ? '✓ Done' : '✏️ Edit'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => Alert.alert('Success', 'Resume saved!')}
          >
            <Text style={styles.saveButtonText}>💾 Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.previewContainer} contentContainerStyle={styles.previewContent}>
        {/* Personal Information */}
        <View style={styles.section}>
          <EditableHeading 
            level="h1" 
            value={resumeData.name}
            onChangeText={(text) => updateField(null, 'name', text)}
            style={styles.name}
          />
          
          <View style={styles.contactInfo}>
            <EditableText 
              value={resumeData.email}
              onChangeText={(text) => updateField(null, 'email', text)}
              style={styles.contactItem}
            />
            <EditableText 
              value={resumeData.phone}
              onChangeText={(text) => updateField(null, 'phone', text)}
              style={styles.contactItem}
            />
            <EditableText 
              value={resumeData.location}
              onChangeText={(text) => updateField(null, 'location', text)}
              style={styles.contactItem}
            />
            <EditableText 
              value={resumeData.linkedin}
              onChangeText={(text) => updateField(null, 'linkedin', text)}
              style={styles.contactItem}
            />
            <EditableText 
              value={resumeData.website}
              onChangeText={(text) => updateField(null, 'website', text)}
              style={styles.contactItem}
            />
          </View>
        </View>

        {/* Professional Summary */}
        <View style={styles.section}>
          <HeadingText level="h2" style={styles.sectionTitle}>PROFESSIONAL SUMMARY</HeadingText>
          <EditableText 
            value={resumeData.summary}
            onChangeText={(text) => updateField(null, 'summary', text)}
            style={styles.summaryText}
            multiline={true}
            placeholder="Enter your professional summary..."
          />
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HeadingText level="h2" style={styles.sectionTitle}>EXPERIENCE</HeadingText>
            {isEditing && (
              <TouchableOpacity 
                onPress={() => addArrayItem('experience', {
                  company: 'Company Name',
                  position: 'Job Title',
                  duration: 'Start - End',
                  description: 'Job description and achievements...'
                })}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {resumeData.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              {isEditing && resumeData.experience.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeArrayItem('experience', index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.experienceHeader}>
                <EditableHeading 
                  level="h3"
                  value={exp.position}
                  onChangeText={(text) => updateField('experience', 'position', text, index)}
                  style={styles.jobTitle}
                />
                <EditableText 
                  value={exp.duration}
                  onChangeText={(text) => updateField('experience', 'duration', text, index)}
                  style={styles.duration}
                />
              </View>
              
              <EditableText 
                value={exp.company}
                onChangeText={(text) => updateField('experience', 'company', text, index)}
                style={styles.company}
              />
              
              <EditableText 
                value={exp.description}
                onChangeText={(text) => updateField('experience', 'description', text, index)}
                style={styles.description}
                multiline={true}
              />
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HeadingText level="h2" style={styles.sectionTitle}>EDUCATION</HeadingText>
            {isEditing && (
              <TouchableOpacity 
                onPress={() => addArrayItem('education', {
                  institution: 'Institution Name',
                  degree: 'Degree',
                  duration: 'Start - End',
                  details: 'Additional details...'
                })}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {resumeData.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              {isEditing && resumeData.education.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeArrayItem('education', index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.educationHeader}>
                <EditableHeading 
                  level="h3"
                  value={edu.degree}
                  onChangeText={(text) => updateField('education', 'degree', text, index)}
                  style={styles.degree}
                />
                <EditableText 
                  value={edu.duration}
                  onChangeText={(text) => updateField('education', 'duration', text, index)}
                  style={styles.duration}
                />
              </View>
              
              <EditableText 
                value={edu.institution}
                onChangeText={(text) => updateField('education', 'institution', text, index)}
                style={styles.institution}
              />
              
              <EditableText 
                value={edu.details}
                onChangeText={(text) => updateField('education', 'details', text, index)}
                style={styles.details}
                multiline={true}
              />
            </View>
          ))}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <HeadingText level="h2" style={styles.sectionTitle}>SKILLS</HeadingText>
          <EditableText 
            value={resumeData.skills}
            onChangeText={(text) => updateField(null, 'skills', text)}
            style={styles.skillsText}
            multiline={true}
            placeholder="List your skills..."
          />
        </View>

        {/* Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HeadingText level="h2" style={styles.sectionTitle}>PROJECTS</HeadingText>
            {isEditing && (
              <TouchableOpacity 
                onPress={() => addArrayItem('projects', {
                  name: 'Project Name',
                  description: 'Project description...',
                  technologies: 'Technologies used'
                })}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {resumeData.projects.map((proj, index) => (
            <View key={index} style={styles.projectItem}>
              {isEditing && resumeData.projects.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeArrayItem('projects', index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
              
              <EditableHeading 
                level="h3"
                value={proj.name}
                onChangeText={(text) => updateField('projects', 'name', text, index)}
                style={styles.projectName}
              />
              
              <EditableText 
                value={proj.description}
                onChangeText={(text) => updateField('projects', 'description', text, index)}
                style={styles.projectDescription}
                multiline={true}
              />
              
              <EditableText 
                value={proj.technologies}
                onChangeText={(text) => updateField('projects', 'technologies', text, index)}
                style={styles.technologies}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}