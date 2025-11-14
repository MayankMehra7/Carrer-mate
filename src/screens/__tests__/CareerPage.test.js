/**
 * Integration Tests for CareerPage Header Logout Functionality
 * Tests logout button rendering, functionality, and ensures no duplicates
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CareerPage from '../CareerPage';
import { AuthContext } from '../../context/AuthContext';
import { FeatureFlagHelpers } from '../../config/featureFlags';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

// Mock AuthContext
const mockLogout = jest.fn();
const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
};

const mockAuthContextValue = {
  user: mockUser,
  logout: mockLogout,
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

describe('CareerPage Header Logout Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for feature flags
    FeatureFlagHelpers.getMultipleFlags.mockResolvedValue({
      'resume-templates-enabled': true,
      'ai-suggestions-enabled': true,
      'resume-upload-enabled': true,
      'cover-letter-generation': true,
      'job-description-parsing': true,
      'live-edit-demo': false,
      'debug-mode': false,
    });
  });

  /**
   * Test 1: Verify logout button renders in header
   * Requirement: 2.1
   */
  test('logout button renders in header', async () => {
    const { getByLabelText, getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify logout button exists with accessibility label
    const logoutButton = getByLabelText('Logout');
    expect(logoutButton).toBeTruthy();
    
    // Verify logout button text
    expect(getByText('🚪 Logout')).toBeTruthy();
  });

  /**
   * Test 2: Verify logout function is called when button is pressed
   * Requirement: 2.2
   */
  test('logout function is called when button is pressed', async () => {
    const { getByLabelText, getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Find and press logout button
    const logoutButton = getByLabelText('Logout');
    fireEvent.press(logoutButton);

    // Verify logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 3: Verify no duplicate logout buttons exist
   * Requirement: 2.3, 2.4
   */
  test('no duplicate logout buttons exist', async () => {
    const { getAllByText, getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Find all elements with logout text
    const logoutElements = getAllByText('🚪 Logout');
    
    // Should only be one logout button
    expect(logoutElements).toHaveLength(1);
  });

  /**
   * Test 4: Verify user info displays correctly in header
   * Requirement: 2.1
   */
  test('user info displays correctly in header', async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify user name is displayed
    expect(getByText('Test User')).toBeTruthy();
  });

  /**
   * Test 5: Verify user email fallback when name is not available
   * Requirement: 2.1
   */
  test('user email displays when name is not available', async () => {
    const userWithoutName = {
      email: 'test@example.com',
    };

    const { getByText } = render(
      <AuthContext.Provider value={{ user: userWithoutName, logout: mockLogout }}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Verify email is displayed
    expect(getByText('test@example.com')).toBeTruthy();
  });

  /**
   * Test 6: Verify logout button has correct accessibility properties
   * Requirement: 2.2, 2.5
   */
  test('logout button has correct accessibility properties', async () => {
    const { getByLabelText, getByText } = render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <CareerPage navigation={mockNavigation} />
      </AuthContext.Provider>
    );

    // Wait for feature flags to load
    await waitFor(() => {
      expect(getByText('🚀 AI-Powered Career Tools')).toBeTruthy();
    });

    // Get logout button by accessibility label
    const logoutButton = getByLabelText('Logout');
    
    // Verify button exists and has correct role
    expect(logoutButton).toBeTruthy();
    expect(logoutButton.props.accessibilityRole).toBe('button');
  });
});
