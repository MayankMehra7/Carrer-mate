// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default)
  },
  StyleSheet: {
    create: jest.fn((styles) => styles)
  },
  Text: 'Text',
  View: 'View',
  ScrollView: 'ScrollView',
  Button: 'Button',
  ActivityIndicator: 'ActivityIndicator',
  TouchableOpacity: 'TouchableOpacity'
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null])
}));

// Mock expo modules
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn()
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

// Mock Google Sign In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: '0',
    IN_PROGRESS: '1',
    PLAY_SERVICES_NOT_AVAILABLE: '2',
  },
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'http://localhost'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  ResponseType: { Code: 'code' },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Global test setup
global.__DEV__ = true;