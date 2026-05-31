module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    '@react-native-async-storage/async-storage': '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js',
    'react-native-draggable-flatlist': '<rootDir>/__mocks__/react-native-draggable-flatlist.js',
    '@react-native-firebase/app': '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '@react-native-firebase/firestore': '<rootDir>/__mocks__/@react-native-firebase/firestore.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|@react-native-firebase|zustand)/)',
  ],
}
