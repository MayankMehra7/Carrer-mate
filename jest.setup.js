// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default)
  },
  Text: 'Text',
  View: 'View',
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

// Global test setup
global.__DEV__ = true;