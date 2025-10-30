import { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Linking, ScrollView, Text, View } from 'react-native';
import { HeadingText } from '../components/common/HeadingText';
import styles from './TemplatePreview.styles';

export default function TemplatePreview({ route, navigation }) {
  const { template } = route.params;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [optimizedImageUrl, setOptimizedImageUrl] = useState('');

  useEffect(() => {
    // Get screen dimensions for optimal image sizing
    const screenData = Dimensions.get('window');
    const optimizedUrl = setOptimizedImageUrl(template.previewImage, {
      width: Math.min(screenData.width * 0.9, 800),
      quality: 85,
      format: 'webp'
    });
    setOptimizedImageUrl(optimizedUrl);
  }, [template.previewImage]);

  const handleOpenTemplate = async () => {
    try {
      const supported = await Linking.canOpenURL(template.url);
      if (supported) {
        await Linking.openURL(template.url);
      } else {
        Alert.alert(
          "Can't open link",
          `Unable to open this template URL: ${template.url}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open template link');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <HeadingText level="h1" style={styles.title}>
          {template.name}
        </HeadingText>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{template.category}</Text>
        </View>
      </View>

      {/* Template Preview Image */}
      <View style={styles.previewContainer}>
        {imageLoading && !imageError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}

        {imageError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📄</Text>
            <Text style={styles.errorText}>Preview not available</Text>
            <Text style={styles.errorSubtext}>Template preview could not be loaded</Text>
          </View>
        ) : (
          <Image
            source={{ uri: optimizedImageUrl || template.previewImage }}
            style={[styles.previewImage, imageLoading && styles.hiddenImage]}
            resizeMode="contain"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              console.warn('Failed to load preview image:', optimizedImageUrl || template.previewImage);
              setImageLoading(false);
              setImageError(true);
            }}
            // Optimize image loading for better performance
            loadingIndicatorSource={{ uri: createPlaceholderImage(800, 400) }}
            progressiveRenderingEnabled={true}
            fadeDuration={300}
          />
        )}
      </View>

      {/* Template Details */}
      <View style={styles.detailsContainer}>
        <HeadingText level="h2" style={styles.sectionTitle}>
          Description
        </HeadingText>
        <Text style={styles.description}>{template.description}</Text>

        <HeadingText level="h2" style={styles.sectionTitle}>
          Features
        </HeadingText>
        <View style={styles.featuresContainer}>
          {template.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <HeadingText level="h2" style={styles.sectionTitle}>
          Template Information
        </HeadingText>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{template.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>Overleaf (LaTeX)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Format:</Text>
            <Text style={styles.infoValue}>PDF Export</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Compilation:</Text>
            <Text style={styles.infoValue}>Secure Sandboxed</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Preview:</Text>
            <Text style={styles.infoValue}>Pre-compiled Thumbnail</Text>
          </View>
        </View>

        <HeadingText level="h2" style={styles.sectionTitle}>
          Usage Instructions
        </HeadingText>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            1. Click "Open in Overleaf" to access the template
          </Text>
          <Text style={styles.instructionText}>
            2. Edit the LaTeX code with your information
          </Text>
          <Text style={styles.instructionText}>
            3. Compile to generate your PDF resume
          </Text>
          <Text style={styles.instructionText}>
            4. Download and use for job applications
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.buttonSpacing}>
          <Button
            title="🚀 Open in Overleaf"
            onPress={handleOpenTemplate}
            color="#28a745"
          />
        </View>
        <View style={styles.buttonSpacing}>
          <Button
            title="← Back to Templates"
            onPress={() => navigation.goBack()}
            color="#6c757d"
          />
        </View>
      </View>
    </ScrollView>
  );
}