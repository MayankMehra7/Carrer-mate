# Font Fallback System Documentation

## Overview

The enhanced font fallback system provides robust platform-specific font selection with intelligent fallback logic for the CareerMate application.

## Platform-Specific Fallbacks

### iOS
- **System Font**: Uses the native iOS system font for all weights
- **Consistent**: All weights use 'System' for optimal iOS integration

### Android
- **Roboto Family**: Uses Android's native Roboto font family
- **Weight Mapping**:
  - Regular: 'Roboto'
  - Medium: 'Roboto-Medium'
  - SemiBold: 'Roboto-Medium' (fallback to Medium)
  - Bold: 'Roboto-Bold'

### Web
- **CSS Font Stack**: Uses comprehensive CSS font fallback chain
- **Includes**: Raleway, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif

## Conditional Font Selection

The system automatically selects fonts based on:

1. **Font Loading Success**: Uses Raleway if loaded successfully
2. **Font Loading Error**: Falls back to platform-specific fonts
3. **Loading State**: Uses fallbacks while fonts are loading
4. **Platform Detection**: Automatically detects iOS, Android, or Web

## Key Functions

### `getFontFamilyWithFallback(options)`
Main function for font selection with comprehensive options:
- `weight`: Font weight (regular, medium, semiBold, bold)
- `fontsLoaded`: Whether custom fonts are loaded
- `hasError`: Whether there was a loading error
- `platform`: Platform override
- `forceCustom`: Force custom font usage
- `forceFallback`: Force fallback font usage

### `getCurrentPlatform()`
Enhanced platform detection with error handling for various environments.

### `createFontSelectionStrategy(conditions)`
Creates a font selection strategy based on current conditions and performance requirements.

## Usage Examples

```javascript
// Basic usage
const fontInfo = getFontFamilyWithFallback({
  weight: 'bold',
  fontsLoaded: true,
  hasError: false
});

// Platform-specific override
const iosFontInfo = getFontFamilyWithFallback({
  weight: 'regular',
  fontsLoaded: false,
  platform: 'ios'
});

// Force fallback for testing
const fallbackInfo = getFontFamilyWithFallback({
  weight: 'semiBold',
  forceFallback: true
});
```

## Integration with Components

The HeadingText component automatically uses the enhanced fallback system:

```jsx
<HeadingText level="h1">
  This heading will use Raleway if loaded, or platform-specific fallback
</HeadingText>
```

## Error Handling

The system provides graceful degradation:
- Logs fallback usage for debugging
- Provides detailed metadata about font selection
- Maintains app functionality even with font loading failures
- Supports retry mechanisms for failed loads

## Performance Considerations

- Platform detection is cached for performance
- Font selection logic is optimized for minimal overhead
- Fallback fonts are immediately available (no loading required)
- Comprehensive logging helps identify performance issues

## Requirements Satisfied

This implementation satisfies requirements:
- **1.4**: Maintains fallback font options if Raleway fails to load
- **3.4**: Graceful fallback to system fonts with platform-specific selection

## Testing

Use `src/utils/fontFallbackTest.js` for manual testing of the fallback system:

```javascript
import { runAllFontFallbackTests } from '../utils/fontFallbackTest';
runAllFontFallbackTests();
```