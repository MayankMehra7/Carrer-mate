// src/components/common/TemplateCard.jsx
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { HeadingText } from './HeadingText';
import styles from './TemplateCard.styles';

export default function TemplateCard({ template, onPreview }) {
  const handleOpenTemplate = async () => {
    try {
      const supported = await Linking.canOpenURL(template.url);
      if (supported) {
        await Linking.openURL(template.url);
      } else {
        Alert.alert(
          "Can't open link", 
          `Don't know how to open this URL: ${template.url}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open template link');
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(template);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <HeadingText level="h3" style={styles.title}>
          {template.name}
        </HeadingText>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{template.category}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {template.description}
      </Text>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresLabel}>Features:</Text>
        <View style={styles.featuresTags}>
          {template.features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.button, styles.previewButton]}
          onPress={handlePreview}
          android_ripple={{ color: '#e3f2fd' }}
        >
          <Text style={styles.previewButtonText}>👁️ Preview</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.openButton]}
          onPress={handleOpenTemplate}
          android_ripple={{ color: '#e8f5e8' }}
        >
          <Text style={styles.openButtonText}>🚀 Open Template</Text>
        </Pressable>
      </View>
    </View>
  );
}