/**
 * Tests for CareerPage Feature Flag Loading and Error Handling
 * Tests feature flag loading on mount, error handling, and loading state
 * Requirements: 1.1, 4.1, 4.2, 4.3
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import CareerPage from '../CareerPage';
import { AuthContext } from '../../context/AuthContext';
import { FeatureFlagHelpers } from '../../config/featureFlags';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock AuthContext
const mockAuthContextValue = {
  user: { name: 'Test User', email: 'test@example.com' },
  logout: jest.fn(),
};

// Mock FeatureFlagHelpers
jest.mock('../../config/featureFlags', () => ({
  FeatureFlagHelpers: {
    getMultipleFlags: jest.fn(),
  },
  FeatureFlags: {
    RESUME_TEMPLATES_ENABLED: 'resume-templates-enabled',
    AI_SUGGESTIONS_ENABLED: 'ai-suggestions-enabled',
    RESUME_UPLOAD_ENABLED: 'resume-upload-enabled',
    COVER_LETTER_GENERATION: 'cover-letter-generation',
    JOB_DESCRIPTION_PARSING: 'job-description-parsing',
    LIVE_EDIT_DEMO: 'live-edit-demo',
    DEBUG_MODE: 'debug-mode',
  },
}));

// Mock featureFlagManager
jest.mock('../../services/FeatureFlagManager', () => ({
  featureFlagManager: {
    getStats: jest.fn(() => ({
      serviceHealthy: true,
      cache: { hitRate: 0.95 },
    })),
  },
}));

// Mock HeadingText component
jest.mock('../../components/common/HeadingText', () => ({
  HeadingText: ({ children, ...props }) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('CareerPage Feature Flag Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  /**
   * Test 1: Verify feature flags load on component mount
   * Requirement: 1.1, 4.1
   */
  test('feature flags load on component mount', async () => {
    const mockFlags = {
      'resume-templates-enabled': true,
      'ai-suggestions-enabled': true,
      'resume-upload-enabled': true,
      'cover-letter-generation': true,
      'job-description-parsing': true,
      'live-edit-demo': false,
      'debug-mode': false,
    };

    FeatureFlagHelpers.getMultipleFlags.mockResolvedValue(mockFlags);

    const { getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Verify loading state is shown initially
    expect(getByText('Loading features...')).toBeTruthy();

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify getMultipleFlags was called
    expect(FeatureFlagHelpers.getMultipleFlags).toHaveBeenCalledTimes(1);
    
    // Verify console logs
    expect(console.log).toHaveBeenCalledWith('[CareerPage] Loading feature flags...');
    expect(console.log).toHaveBeenCalledWith('[CareerPage] Loaded flags:', mockFlags);
    expect(console.log).toHaveBeenCalledWith('[CareerPage] Feature flags set successfully');
  });

  /**
   * Test 2: Verify default flags are used when loading fails
   * Requirement: 4.2, 4.3
   */
  test('default flags are used when loading fails', async () => {
    const mockError = new Error('Network error');
    FeatureFlagHelpers.getMultipleFlags.mockRejectedValue(mockError);

    const { getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for error handling and default flags
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('[CareerPage] Error loading feature flags:', mockError);
    expect(console.error).toHaveBeenCalledWith('[CareerPage] Error details:', {
      message: mockError.message,
      stack: mockError.stack,
      name: mockError.name,
    });
    
    // Verify default flags were set
    expect(console.log).toHaveBeenCalledWith('[CareerPage] Default feature flags set after error');

    // Verify features are still displayed (using default flags)
    expect(getByText('📄 Resume Templates')).toBeTruthy();
  });

  /**
   * Test 3: Verify loading state displays correctly
   * Requirement: 1.1, 4.4
   */
  test('loading state displays correctly', async () => {
    // Create a promise that we can control
    let resolveFlags;
    const flagsPromise = new Promise((resolve) => {
      resolveFlags = resolve;
    });

    FeatureFlagHelpers.getMultipleFlags.mockReturnValue(flagsPromise);

    const { getByText, queryByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Verify loading state is shown
    expect(getByText('Loading features...')).toBeTruthy();
    
    // Verify features container is not shown yet
    expect(queryByText('🚀 AI-Powered Career Tools')).toBeNull();

    // Resolve the flags
    resolveFlags({
      'resume-templates-enabled': true,
      'ai-suggestions-enabled': true,
      'resume-upload-enabled': true,
      'cover-letter-generation': true,
      'job-description-parsing': true,
      'live-edit-demo': false,
      'debug-mode': false,
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify loading state is no longer shown
    expect(queryByText('Loading features...')).toBeNull();
  });

  /**
   * Test 4: Verify feature flags control feature visibility
   * Requirement: 1.1
   */
  test('feature flags control feature visibility', async () => {
    const mockFlags = {
      'resume-templates-enabled': false, // Disabled
      'ai-suggestions-enabled': true,
      'resume-upload-enabled': true,
      'cover-letter-generation': false, // Disabled
      'job-description-parsing': true,
      'live-edit-demo': false,
      'debug-mode': false,
    };

    FeatureFlagHelpers.getMultipleFlags.mockResolvedValue(mockFlags);

    const { getByText, queryByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify disabled features are not shown
    expect(queryByText('📄 Resume Templates')).toBeNull();
    expect(queryByText('✍️ Custom Cover Letters')).toBeNull();
    
    // Verify enabled features are shown
    expect(getByText('📄 Resume Builder & Analysis')).toBeTruthy();
  });

  /**
   * Test 5: Verify error handling with different error types
   * Requirement: 4.2, 4.3
   */
  test('handles different error types gracefully', async () => {
    const testCases = [
      { error: new Error('Timeout'), name: 'Timeout error' },
      { error: new Error('Service unavailable'), name: 'Service error' },
      { error: new TypeError('Invalid response'), name: 'Type error' },
    ];

    for (const testCase of testCases) {
      jest.clearAllMocks();
      FeatureFlagHelpers.getMultipleFlags.mockRejectedValue(testCase.error);

      const { getByText, unmount } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <CareerPage navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      // Wait for error handling
      await waitFor(() => {
        expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
      });

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        '[CareerPage] Error loading feature flags:',
        testCase.error
      );

      // Verify default flags were set
      expect(console.log).toHaveBeenCalledWith('[CareerPage] Default feature flags set after error');

      // Verify app still functions
      expect(getByText('📄 Resume Templates')).toBeTruthy();

      unmount();
    }
  });

  /**
   * Test 6: Verify loading completes even on error
   * Requirement: 4.4
   */
  test('loading state completes even when flag loading fails', async () => {
    FeatureFlagHelpers.getMultipleFlags.mockRejectedValue(new Error('Failed'));

    const { getByText, queryByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Initially shows loading
    expect(getByText('Loading features...')).toBeTruthy();

    // Wait for error handling to complete
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Loading state should be gone
    expect(queryByText('Loading features...')).toBeNull();
  });
});
