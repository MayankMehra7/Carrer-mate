/**
 * Simple test utility to verify font fallback logic
 * This file can be used for manual testing of the fallback system
 */

import {
    createFontSelectionStrategy,
    getCurrentPlatform,
    getFontFamilyWithFallback,
    getPlatformFallbackFont
} from '../styles/fonts';

/**
 * Test platform-specific fallback font selection
 */
export const testPlatformFallbacks = () => {
  const currentPlatform = getCurrentPlatform();
  console.log('Current platform:', currentPlatform);
  
  const weights = ['regular', 'medium', 'semiBold', 'bold'];
  const platforms = ['ios', 'android', 'web'];
  
  console.log('\n=== Platform Fallback Test ===');
  
  platforms.forEach(platform => {
    console.log(`\n${platform.toUpperCase()} Fallbacks:`);
    weights.forEach(weight => {
      const fallbackFont = getPlatformFallbackFont(weight, platform);
      console.log(`  ${weight}: ${fallbackFont}`);
    });
  });
};

/**
 * Test conditional font family selection
 */
export const testConditionalSelection = () => {
  console.log('\n=== Conditional Font Selection Test ===');
  
  const testCases = [
    { fontsLoaded: true, hasError: false, description: 'Fonts loaded successfully' },
    { fontsLoaded: false, hasError: false, description: 'Fonts not loaded yet' },
    { fontsLoaded: true, hasError: true, description: 'Fonts loaded with error' },
    { fontsLoaded: false, hasError: true, description: 'Fonts failed to load' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n${testCase.description}:`);
    const fontInfo = getFontFamilyWithFallback({
      weight: 'regular',
      fontsLoaded: testCase.fontsLoaded,
      hasError: testCase.hasError
    });
    
    console.log(`  Font Family: ${fontInfo.fontFamily}`);
    console.log(`  Is Custom Font: ${fontInfo.isCustomFont}`);
    console.log(`  Is Fallback: ${fontInfo.isFallback}`);
    console.log(`  Platform: ${fontInfo.platform}`);
    console.log(`  Fallback Reason: ${fontInfo.fallbackReason}`);
  });
};

/**
 * Test font selection strategy
 */
export const testFontSelectionStrategy = () => {
  console.log('\n=== Font Selection Strategy Test ===');
  
  const strategy = createFontSelectionStrategy({
    fontsLoaded: false,
    hasError: false
  });
  
  console.log('Strategy:', strategy.strategy);
  console.log('Platform:', strategy.platform);
  console.log('Should use custom fonts:', strategy.shouldUseCustomFonts);
  console.log('Recommended fallback:', strategy.recommendedFallback);
  
  console.log('\nAll fonts with strategy:');
  const allFonts = strategy.getAllFonts();
  Object.entries(allFonts).forEach(([weight, fontInfo]) => {
    console.log(`  ${weight}: ${fontInfo.fontFamily} (${fontInfo.isCustomFont ? 'custom' : 'fallback'})`);
  });
};

/**
 * Run all tests
 */
export const runAllFontFallbackTests = () => {
  console.log('🔤 Running Font Fallback Tests...\n');
  
  try {
    testPlatformFallbacks();
    testConditionalSelection();
    testFontSelectionStrategy();
    
    console.log('\n✅ All font fallback tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Font fallback test failed:', error);
  }
};

// Export for manual testing
export default {
  testPlatformFallbacks,
  testConditionalSelection,
  testFontSelectionStrategy,
  runAllFontFallbackTests
};