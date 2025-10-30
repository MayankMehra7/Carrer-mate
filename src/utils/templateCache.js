// Template caching utilities for optimized LaTeX preview loading
// Based on research into pre-compiled thumbnails and performance optimization

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'template_preview_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Cache template preview data
 * @param {string} templateId - Template identifier
 * @param {Object} data - Template data to cache
 * @returns {Promise<boolean>} Success status
 */
export const cacheTemplatePreview = async (templateId, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY
    };
    
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${templateId}`,
      JSON.stringify(cacheData)
    );
    
    return true;
  } catch (error) {
    console.warn('Failed to cache template preview:', error);
    return false;
  }
};

/**
 * Retrieve cached template preview data
 * @param {string} templateId - Template identifier
 * @returns {Promise<Object|null>} Cached data or null if not found/expired
 */
export const getCachedTemplatePreview = async (templateId) => {
  try {
    const cachedItem = await AsyncStorage.getItem(`${CACHE_PREFIX}${templateId}`);
    
    if (!cachedItem) {
      return null;
    }
    
    const cacheData = JSON.parse(cachedItem);
    
    // Check if cache has expired
    if (Date.now() > cacheData.expiry) {
      // Remove expired cache
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${templateId}`);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn('Failed to retrieve cached template preview:', error);
    return null;
  }
};

/**
 * Clear all template preview caches
 * @returns {Promise<boolean>} Success status
 */
export const clearTemplateCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const templateKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    if (templateKeys.length > 0) {
      await AsyncStorage.multiRemove(templateKeys);
    }
    
    return true;
  } catch (error) {
    console.warn('Failed to clear template cache:', error);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
export const getCacheStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const templateKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    let validCaches = 0;
    let expiredCaches = 0;
    
    for (const key of templateKeys) {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        totalSize += item.length;
        const cacheData = JSON.parse(item);
        
        if (Date.now() > cacheData.expiry) {
          expiredCaches++;
        } else {
          validCaches++;
        }
      }
    }
    
    return {
      totalCaches: templateKeys.length,
      validCaches,
      expiredCaches,
      totalSize,
      formattedSize: formatBytes(totalSize)
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return {
      totalCaches: 0,
      validCaches: 0,
      expiredCaches: 0,
      totalSize: 0,
      formattedSize: '0 B'
    };
  }
};

/**
 * Clean up expired caches
 * @returns {Promise<number>} Number of expired caches removed
 */
export const cleanupExpiredCaches = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const templateKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    const expiredKeys = [];
    
    for (const key of templateKeys) {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        const cacheData = JSON.parse(item);
        if (Date.now() > cacheData.expiry) {
          expiredKeys.push(key);
        }
      }
    }
    
    if (expiredKeys.length > 0) {
      await AsyncStorage.multiRemove(expiredKeys);
    }
    
    return expiredKeys.length;
  } catch (error) {
    console.warn('Failed to cleanup expired caches:', error);
    return 0;
  }
};

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Preload and cache template previews
 * @param {Array} templates - Array of template objects
 * @returns {Promise<Object>} Results of caching operations
 */
export const preloadTemplateCache = async (templates) => {
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  for (const template of templates) {
    try {
      // Check if already cached and valid
      const cached = await getCachedTemplatePreview(template.id);
      if (cached) {
        results.skipped++;
        continue;
      }
      
      // Cache template data
      const success = await cacheTemplatePreview(template.id, {
        name: template.name,
        description: template.description,
        category: template.category,
        features: template.features,
        previewImage: template.previewImage,
        url: template.url
      });
      
      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.warn(`Failed to preload template ${template.id}:`, error);
      results.failed++;
    }
  }
  
  return results;
};