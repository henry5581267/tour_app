module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    '@react-native-async-storage/async-storage': '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
}
