const mockCallable = jest.fn()

const mockFunctionsInstance = {
  httpsCallable: jest.fn(() => mockCallable),
}

const functions = jest.fn(() => mockFunctionsInstance)
functions.__mockCallable = mockCallable
functions.__mockInstance = mockFunctionsInstance

module.exports = functions
