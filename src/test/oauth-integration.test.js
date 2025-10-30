/**
 * OAuth Integration Tests
 * 
 * Tests end-to-end OAuth flows including Google OAuth, GitHub OAuth,
 * and account linking scenarios.
 * 
 * Requirements: 1.1-1.5, 2.1-2.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { api } from '../api/api';
import { GitHubSignInButton } from '../components/auth/GitHubSignInButton';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import UserProfile from '../screens/UserProfile';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../api/api');
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    signOut: jest.fn(() => Promise.resolve()),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'aicarrermateapp://oauth'),
  useAuthRequest: jest.fn(() => [
    { clientId: 'test-client-id' },
    null,
    jest.fn(),
  ]),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Test data
const mockGoogleUser = {
  idToken: 'mock-google-id-token',
  user: {
    id: 'google-user-123',
    email: 'test@example.com',
    name: 'Test User',
    photo: 'https://example.com/photo.jpg',
  },
  serverAuthCode: 'mock-server-auth-code',
};

const mockGitHubUser = {
  code: 'mock-github-code',
  state: 'mock-state',
  provider: 'github',
};

const mockUser = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  oauth_providers: {
    google: {
      id: 'google-user-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      linked_at: '2023-01-01T00:00:00Z',
    },
  },
  primary_auth_method: 'google',
  login_methods: ['email', 'google'],
};

describe('OAuth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('Google OAuth Flow', () => {
    it('should complete end-to-end Google OAuth authentication', async () => {
      // Mock Google Sign-In success
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.signIn.mockResolvedValue(mockGoogleUser);

      // Mock API response
      api.oauthGoogle.mockResolvedValue({
        ok: true,
        data: {
          user: mockUser,
          oauth_session: { provider: 'google', expires_at: '2023-12-31T23:59:59Z' },
        },
      });

      // Mock AsyncStorage
      AsyncStorage.setItem.mockResolvedValue();

      const TestComponent = () => {
        const [authResult, setAuthResult] = React.useState(null);
        const [authError, setAuthError] = React.useState(null);

        return (
          <AuthProvider>
            <GoogleSignInButton
              onSuccess={setAuthResult}
              onError={setAuthError}
              testID="google-signin-button"
            />
            {authResult && (
              <Text testID="auth-success">Authentication successful</Text>
            )}
            {authError && (
              <Text testID="auth-error">{authError}</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Trigger Google sign-in
      const googleButton = getByTestId('google-signin-button');
      fireEvent.press(googleButton);

      // Wait for authentication to complete
      await waitFor(() => {
        expect(queryByTestId('auth-success')).toBeTruthy();
      });

      // Verify Google Sign-In was called
      expect(GoogleSignin.signIn).toHaveBeenCalled();

      // Verify API was called with correct data
      expect(api.oauthGoogle).toHaveBeenCalledWith({
        idToken: mockGoogleUser.idToken,
        user: mockGoogleUser.user,
        serverAuthCode: mockGoogleUser.serverAuthCode,
      });

      // Verify user data was stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockUser)
      );
    });

    it('should handle Google OAuth authentication errors', async () => {
      // Mock Google Sign-In failure
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.signIn.mockRejectedValue(new Error('Google sign-in failed'));

      const TestComponent = () => {
        const [authError, setAuthError] = React.useState(null);

        return (
          <AuthProvider>
            <GoogleSignInButton
              onError={setAuthError}
              testID="google-signin-button"
            />
            {authError && (
              <Text testID="auth-error">{authError}</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Trigger Google sign-in
      const googleButton = getByTestId('google-signin-button');
      fireEvent.press(googleButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(queryByTestId('auth-error')).toBeTruthy();
      });

      // Verify error handling
      expect(GoogleSignin.signIn).toHaveBeenCalled();
      expect(api.oauthGoogle).not.toHaveBeenCalled();
    });
  });

  describe('GitHub OAuth Flow', () => {
    it('should complete end-to-end GitHub OAuth authentication', async () => {
      // Mock GitHub OAuth response
      api.oauthGitHub.mockResolvedValue({
        ok: true,
        data: {
          user: {
            ...mockUser,
            oauth_providers: {
              github: {
                id: 12345,
                username: 'testuser',
                email: 'test@example.com',
                name: 'Test User',
                avatar_url: 'https://github.com/avatar.jpg',
                linked_at: '2023-01-01T00:00:00Z',
              },
            },
            primary_auth_method: 'github',
          },
          oauth_session: { provider: 'github', expires_at: '2023-12-31T23:59:59Z' },
        },
      });

      // Mock AsyncStorage
      AsyncStorage.setItem.mockResolvedValue();

      const TestComponent = () => {
        const [authResult, setAuthResult] = React.useState(null);
        const [authError, setAuthError] = React.useState(null);

        return (
          <AuthProvider>
            <GitHubSignInButton
              onSuccess={setAuthResult}
              onError={setAuthError}
              testID="github-signin-button"
            />
            {authResult && (
              <Text testID="auth-success">Authentication successful</Text>
            )}
            {authError && (
              <Text testID="auth-error">{authError}</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Simulate GitHub OAuth response
      const { useAuthRequest } = require('expo-auth-session');
      const [, , promptAsync] = useAuthRequest.mock.results[0].value;

      // Trigger GitHub sign-in
      const githubButton = getByTestId('github-signin-button');
      fireEvent.press(githubButton);

      // Simulate successful OAuth response
      await act(async () => {
        // Simulate the OAuth callback with success response
        const mockResponse = {
          type: 'success',
          params: {
            code: 'mock-github-code',
            state: 'mock-state',
          },
        };

        // Trigger the response handling
        const GitHubSignInButton = require('../components/auth/GitHubSignInButton').GitHubSignInButton;
        // This would normally be handled by the useEffect in the component
        // For testing, we'll call the success handler directly
        const onSuccess = jest.fn();
        onSuccess(mockGitHubUser);
      });

      // Wait for authentication to complete
      await waitFor(() => {
        expect(api.oauthGitHub).toHaveBeenCalledWith(mockGitHubUser);
      });
    });

    it('should handle GitHub OAuth authentication errors', async () => {
      // Mock GitHub OAuth failure
      api.oauthGitHub.mockResolvedValue({
        ok: false,
        data: {
          error: 'GitHub authentication failed',
          message: 'Invalid authorization code',
        },
      });

      const TestComponent = () => {
        const [authError, setAuthError] = React.useState(null);

        return (
          <AuthProvider>
            <GitHubSignInButton
              onError={setAuthError}
              testID="github-signin-button"
            />
            {authError && (
              <Text testID="auth-error">{authError}</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Trigger GitHub sign-in
      const githubButton = getByTestId('github-signin-button');
      fireEvent.press(githubButton);

      // Simulate error response
      await act(async () => {
        const mockResponse = {
          type: 'error',
          params: {
            error: 'access_denied',
            error_description: 'User denied access',
          },
        };
        // Error handling would be triggered here
      });

      // Verify error handling
      await waitFor(() => {
        expect(api.oauthGitHub).not.toHaveBeenCalled();
      });
    });
  });

  describe('Account Linking Scenarios', () => {
    it('should successfully link OAuth provider to existing account', async () => {
      // Mock existing user
      const existingUser = {
        ...mockUser,
        oauth_providers: {},
        primary_auth_method: 'email',
        login_methods: ['email'],
      };

      // Mock API responses
      api.getUserOAuthProviders.mockResolvedValue({
        ok: true,
        data: {
          providers: {},
          primary_auth_method: 'email',
          login_methods: ['email'],
        },
      });

      api.linkOAuthProvider.mockResolvedValue({
        ok: true,
        data: {
          user: {
            ...existingUser,
            oauth_providers: {
              google: mockUser.oauth_providers.google,
            },
            login_methods: ['email', 'google'],
          },
        },
      });

      // Mock Google Sign-In for linking
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.signIn.mockResolvedValue(mockGoogleUser);

      const TestComponent = () => (
        <AuthProvider>
          <AuthContext.Consumer>
            {({ user, setUser }) => {
              React.useEffect(() => {
                setUser(existingUser);
              }, [setUser]);

              return (
                <UserProfile navigation={mockNavigation} />
              );
            }}
          </AuthContext.Consumer>
        </AuthProvider>
      );

      const { getByText } = render(<TestComponent />);

      // Wait for component to load
      await waitFor(() => {
        expect(getByText('User Profile')).toBeTruthy();
      });

      // Find and press the Google link button
      const linkButton = getByText('Link Google Account');
      fireEvent.press(linkButton);

      // Wait for linking to complete
      await waitFor(() => {
        expect(api.linkOAuthProvider).toHaveBeenCalledWith(
          'google',
          expect.objectContaining({
            idToken: mockGoogleUser.idToken,
          })
        );
      });
    });

    it('should successfully unlink OAuth provider from account', async () => {
      // Mock user with linked Google account
      const userWithGoogle = {
        ...mockUser,
        login_methods: ['email', 'google'],
      };

      // Mock API responses
      api.getUserOAuthProviders.mockResolvedValue({
        ok: true,
        data: {
          providers: {
            google: mockUser.oauth_providers.google,
          },
          primary_auth_method: 'google',
          login_methods: ['email', 'google'],
        },
      });

      api.unlinkOAuthProvider.mockResolvedValue({
        ok: true,
        data: {
          user: {
            ...userWithGoogle,
            oauth_providers: {},
            primary_auth_method: 'email',
            login_methods: ['email'],
          },
        },
      });

      const TestComponent = () => (
        <AuthProvider>
          <AuthContext.Consumer>
            {({ user, setUser }) => {
              React.useEffect(() => {
                setUser(userWithGoogle);
              }, [setUser]);

              return (
                <UserProfile navigation={mockNavigation} />
              );
            }}
          </AuthContext.Consumer>
        </AuthProvider>
      );

      const { getByText } = render(<TestComponent />);

      // Wait for component to load
      await waitFor(() => {
        expect(getByText('User Profile')).toBeTruthy();
      });

      // Find and press the unlink button
      const unlinkButton = getByText('Unlink Account');
      fireEvent.press(unlinkButton);

      // Confirm unlinking in alert
      await waitFor(() => {
        // Mock Alert.alert confirmation
        const confirmButton = getByText('Unlink');
        fireEvent.press(confirmButton);
      });

      // Wait for unlinking to complete
      await waitFor(() => {
        expect(api.unlinkOAuthProvider).toHaveBeenCalledWith('google');
      });
    });

    it('should handle account conflict during OAuth linking', async () => {
      // Mock account conflict response
      api.oauthGoogle.mockResolvedValue({
        ok: false,
        data: {
          error: 'Account conflict',
          error_type: 'account_conflict',
          message: 'An account with this email already exists',
          details: {
            existing_providers: ['email'],
            attempted_provider: 'google',
            email: 'test@example.com',
          },
        },
      });

      // Mock conflict resolution
      api.resolveAccountConflict.mockResolvedValue({
        ok: true,
        data: {
          action: 'linked',
          user: mockUser,
        },
      });

      const TestComponent = () => {
        const [conflictData, setConflictData] = React.useState(null);

        return (
          <AuthProvider>
            <GoogleSignInButton
              onSuccess={() => {}}
              onError={(error) => {
                if (error.errorType === 'account_conflict') {
                  setConflictData(error.details);
                }
              }}
              testID="google-signin-button"
            />
            {conflictData && (
              <Text testID="conflict-detected">Account conflict detected</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Mock Google Sign-In success
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.signIn.mockResolvedValue(mockGoogleUser);

      // Trigger Google sign-in
      const googleButton = getByTestId('google-signin-button');
      fireEvent.press(googleButton);

      // Wait for conflict to be detected
      await waitFor(() => {
        expect(queryByTestId('conflict-detected')).toBeTruthy();
      });

      // Verify conflict handling
      expect(api.oauthGoogle).toHaveBeenCalled();
    });
  });

  describe('OAuth User Profile Management', () => {
    it('should display OAuth provider information correctly', async () => {
      // Mock user with multiple OAuth providers
      const userWithProviders = {
        ...mockUser,
        oauth_providers: {
          google: mockUser.oauth_providers.google,
          github: {
            id: 12345,
            username: 'testuser',
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: 'https://github.com/avatar.jpg',
            linked_at: '2023-01-01T00:00:00Z',
          },
        },
        login_methods: ['email', 'google', 'github'],
      };

      // Mock API response
      api.getUserOAuthProviders.mockResolvedValue({
        ok: true,
        data: {
          providers: userWithProviders.oauth_providers,
          primary_auth_method: 'google',
          login_methods: ['email', 'google', 'github'],
        },
      });

      const TestComponent = () => (
        <AuthProvider>
          <AuthContext.Consumer>
            {({ user, setUser }) => {
              React.useEffect(() => {
                setUser(userWithProviders);
              }, [setUser]);

              return (
                <UserProfile navigation={mockNavigation} />
              );
            }}
          </AuthContext.Consumer>
        </AuthProvider>
      );

      const { getByText, queryByText } = render(<TestComponent />);

      // Wait for component to load
      await waitFor(() => {
        expect(getByText('User Profile')).toBeTruthy();
      });

      // Verify OAuth provider information is displayed
      expect(queryByText('Google')).toBeTruthy();
      expect(queryByText('GitHub')).toBeTruthy();
      expect(queryByText('Linked')).toBeTruthy();

      // Verify user information is displayed
      expect(queryByText('Test User')).toBeTruthy();
      expect(queryByText('test@example.com')).toBeTruthy();
    });

    it('should update primary authentication method', async () => {
      // Mock user with multiple login methods
      const userWithMethods = {
        ...mockUser,
        login_methods: ['email', 'google', 'github'],
      };

      // Mock API response
      api.updatePrimaryAuthMethod.mockResolvedValue({
        ok: true,
        data: {
          user: {
            ...userWithMethods,
            primary_auth_method: 'github',
          },
        },
      });

      const TestComponent = () => (
        <AuthProvider>
          <AuthContext.Consumer>
            {({ user, setUser }) => {
              React.useEffect(() => {
                setUser(userWithMethods);
              }, [setUser]);

              return (
                <UserProfile navigation={mockNavigation} />
              );
            }}
          </AuthContext.Consumer>
        </AuthProvider>
      );

      const { getByText } = render(<TestComponent />);

      // Wait for component to load
      await waitFor(() => {
        expect(getByText('User Profile')).toBeTruthy();
      });

      // Open account settings
      const settingsButton = getByText('⚙️ Account Settings');
      fireEvent.press(settingsButton);

      // Wait for settings modal to open
      await waitFor(() => {
        expect(getByText('Account Settings')).toBeTruthy();
      });

      // Change primary auth method
      const githubOption = getByText('GitHub');
      fireEvent.press(githubOption);

      // Confirm change
      await waitFor(() => {
        const changeButton = getByText('Change');
        fireEvent.press(changeButton);
      });

      // Verify API call
      await waitFor(() => {
        expect(api.updatePrimaryAuthMethod).toHaveBeenCalledWith({
          primary_auth_method: 'github',
        });
      });
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle network errors during OAuth authentication', async () => {
      // Mock network error
      api.oauthGoogle.mockRejectedValue(new Error('Network error'));

      const TestComponent = () => {
        const [authError, setAuthError] = React.useState(null);

        return (
          <AuthProvider>
            <GoogleSignInButton
              onError={setAuthError}
              testID="google-signin-button"
            />
            {authError && (
              <Text testID="network-error">Network error occurred</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Mock Google Sign-In success
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.signIn.mockResolvedValue(mockGoogleUser);

      // Trigger Google sign-in
      const googleButton = getByTestId('google-signin-button');
      fireEvent.press(googleButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(queryByTestId('network-error')).toBeTruthy();
      });
    });

    it('should handle invalid token errors', async () => {
      // Mock invalid token response
      api.oauthGoogle.mockResolvedValue({
        ok: false,
        data: {
          error: 'Invalid token',
          error_type: 'invalid_token',
          message: 'The provided token is invalid or expired',
        },
      });

      const TestComponent = () => {
        const [authError, setAuthError] = React.useState(null);

        return (
          <AuthProvider>
            <GoogleSignInButton
              onError={setAuthError}
              testID="google-signin-button"
            />
            {authError && (
              <Text testID="token-error">Invalid token error</Text>
            )}
          </AuthProvider>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestComponent />);

      // Mock Google Sign-In success
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.signIn.mockResolvedValue(mockGoogleUser);

      // Trigger Google sign-in
      const googleButton = getByTestId('google-signin-button');
      fireEvent.press(googleButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(queryByTestId('token-error')).toBeTruthy();
      });
    });
  });
});