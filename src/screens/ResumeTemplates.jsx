// src/screens/ResumeTemplates.jsx
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { HeadingText } from '../components/common/HeadingText';
import TemplateCard from '../components/common/TemplateCard';
import { resumeTemplates, templateCategories } from '../data/resumeTemplates';
import styles from './ResumeTemplates.styles';

export default function ResumeTemplates({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading and validate data
    try {
      if (resumeTemplates && templateCategories) {
        setIsLoaded(true);
      } else {
        setError('Template data not available');
      }
    } catch (e) {
      setError('Failed to load templates: ' + e.message);
    }
  }, []);

  // Show loading state
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <HeadingText level="h1" style={styles.title}>
            📄 Resume Templates
          </HeadingText>
          <Text style={styles.subtitle}>Loading templates...</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading templates...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <HeadingText level="h1" style={styles.title}>
            📄 Resume Templates
          </HeadingText>
          <Text style={styles.subtitle}>Error loading templates</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <Text style={styles.emptySubtext}>Please try again later</Text>
        </View>
      </View>
    );
  }

  // Validate templates data
  if (!resumeTemplates || !Array.isArray(resumeTemplates)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <HeadingText level="h1" style={styles.title}>
            📄 Resume Templates
          </HeadingText>
          <Text style={styles.subtitle}>No templates available</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Templates data not available</Text>
          <Text style={styles.emptySubtext}>Please check your internet connection and try again</Text>
        </View>
      </View>
    );
  }

  const filteredTemplates = resumeTemplates.filter((template) => {
    try {
      if (!template || !template.name || !template.category) {
        console.warn('Invalid template data:', template);
        return false;
      }

      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (template.features && Array.isArray(template.features) && template.features.some(feature =>
          feature && feature.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      return matchesCategory && matchesSearch;
    } catch (error) {
      console.error('Error filtering template:', template, error);
      return false;
    }
  });

  const handlePreview = (template) => {
    navigation.navigate('TemplatePreview', { template });
  };



  const renderTemplate = ({ item }) => {
    try {
      return (
        <TemplateCard
          template={item}
          onPreview={handlePreview}
        />
      );
    } catch (error) {
      console.error('Error rendering template card:', error);
      return (
        <View style={{ padding: 16, backgroundColor: '#ffebee', margin: 8, borderRadius: 8 }}>
          <Text style={{ color: '#d32f2f' }}>Error loading template: {item?.name || 'Unknown'}</Text>
        </View>
      );
    }
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryScrollContent}
    >
      {templateCategories.map((category) => (
        <Pressable
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.categoryButtonTextActive,
            ]}
          >
            {category}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeadingText level="h1" style={styles.title}>
          📄 Resume Templates
        </HeadingText>
        <Text style={styles.subtitle}>
          Choose from professional LaTeX templates
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {renderCategoryFilter()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No templates found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or category filter
            </Text>
          </View>
        }
      />
    </View>
  );
}