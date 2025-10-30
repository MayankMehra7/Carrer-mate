// Image optimization utilities for LaTeX template previews
// Based on research into pre-compiled PDF thumbnails and compression optimization

/**
 * Generates optimized image URL with compression parameters
 * @param {string} originalUrl - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (originalUrl, options = {}) => {
  const {
    width = 800,
    quality = 85,
    format = 'webp',
    fallbackFormat = 'png'
  } = options;

  // For Overleaf images, we can add optimization parameters
  if (originalUrl.includes('overleaf.com') || originalUrl.includes('images.overleaf.com')) {
    // Add compression and format parameters if the service supports it
    const url = new URL(originalUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', format);
    return url.toString();
  }

  // For other images, return original URL
  return originalUrl;
};

/**
 * Generates multiple image sources for progressive loading
 * @param {string} originalUrl - Original image URL
 * @returns {Array} Array of image sources with different qualities
 */
export const getProgressiveImageSources = (originalUrl) => {
  return [
    {
      uri: getOptimizedImageUrl(originalUrl, { width: 400, quality: 60 }),
      priority: 'low'
    },
    {
      uri: getOptimizedImageUrl(originalUrl, { width: 800, quality: 85 }),
      priority: 'normal'
    },
    {
      uri: originalUrl,
      priority: 'high'
    }
  ];
};

/**
 * Creates a placeholder image data URI for loading states
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Data URI for placeholder
 */
export const createPlaceholderImage = (width = 800, height = 400) => {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa"/>
      <rect x="20%" y="20%" width="60%" height="60%" fill="#e0e0e0" rx="8"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#666">
        Loading Preview...
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Preloads images for better performance
 * @param {Array} imageUrls - Array of image URLs to preload
 * @returns {Promise} Promise that resolves when all images are loaded
 */
export const preloadImages = (imageUrls) => {
  const promises = imageUrls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  });

  return Promise.allSettled(promises);
};

/**
 * Calculates optimal image dimensions based on screen size
 * @param {Object} screenDimensions - Screen width and height
 * @param {number} aspectRatio - Desired aspect ratio
 * @returns {Object} Optimal width and height
 */
export const calculateOptimalDimensions = (screenDimensions, aspectRatio = 1.414) => {
  const { width: screenWidth, height: screenHeight } = screenDimensions;
  const maxWidth = Math.min(screenWidth * 0.9, 800);
  const maxHeight = Math.min(screenHeight * 0.6, 600);

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};