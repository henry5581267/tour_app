/* Custom AsyncStorage mock that persists storage on global so it survives
 * jest.resetModules() calls. This allows tests that use jest.resetModules()
 * to re-require modules while still sharing the same storage state.
 */

if (!global.__ASYNC_STORAGE_STORE__) {
  global.__ASYNC_STORAGE_STORE__ = {}
}

const store = () => global.__ASYNC_STORAGE_STORE__

const asMock = {
  setItem: jest.fn(async (key, value) => {
    store()[key] = value
    return null
  }),

  getItem: jest.fn(async (key) => {
    return key in store() ? store()[key] : null
  }),

  removeItem: jest.fn(async (key) => {
    delete store()[key]
    return null
  }),

  clear: jest.fn(async () => {
    global.__ASYNC_STORAGE_STORE__ = {}
    return null
  }),

  getAllKeys: jest.fn(async () => {
    return Object.keys(store())
  }),

  multiGet: jest.fn(async (keys) => {
    return keys.map((key) => [key, key in store() ? store()[key] : null])
  }),

  multiSet: jest.fn(async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      store()[key] = value
    })
    return null
  }),

  multiRemove: jest.fn(async (keys) => {
    keys.forEach((key) => delete store()[key])
    return null
  }),

  flushGetRequests: jest.fn(),
  useAsyncStorage: jest.fn((key) => ({
    getItem: (...args) => asMock.getItem(key, ...args),
    setItem: (...args) => asMock.setItem(key, ...args),
    mergeItem: (...args) => asMock.mergeItem(key, ...args),
    removeItem: (...args) => asMock.removeItem(key, ...args),
  })),
}

module.exports = asMock
