/**
 * Quick test to verify PlatformDetector is working correctly
 * This can be run in the browser console to test platform detection
 */

import { getOAuthDebugInfo } from './config/oauth';
import { PlatformDetector } from './utils/PlatformDetector';

// Test platform detection
console.log('=== Platform Detection Test ===');
console.log('Detected Platform:', PlatformDetector.detectPlatform());
console.log('Platform Info:', PlatformDetector.getPlatformInfo());

// Test OAuth capabilities
console.log('\n=== OAuth Capabilities Test ===');
console.log('Web OAuth Capabilities:', PlatformDetector.getOAuthCapabilities('web'));
console.log('Google OAuth Available:', PlatformDetector.isNativeOAuthAvailable('google'));
console.log('GitHub OAuth Available:', PlatformDetector.isNativeOAuthAvailable('github'));

// Test OAuth configuration
console.log('\n=== OAuth Configuration Test ===');
console.log('OAuth Debug Info:', getOAuthDebugInfo());

// Test error messages
console.log('\n=== Error Message Test ===');
console.log('Native Unavailable Error:', PlatformDetector.getPlatformErrorMessage('native_unavailable', 'google'));
console.log('Storage Unavailable Error:', PlatformDetector.getPlatformErrorMessage('storage_unavailable', 'google'));

export { getOAuthDebugInfo, PlatformDetector };
