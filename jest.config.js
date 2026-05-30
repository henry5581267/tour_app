module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    '@react-native-async-storage/async-storage': '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js',
    'react-native-draggable-flatlist': '<rootDir>/__mocks__/react-native-draggable-flatlist.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|zustand)/)',
  ],
}
