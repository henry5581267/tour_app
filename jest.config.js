module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
  },
}
