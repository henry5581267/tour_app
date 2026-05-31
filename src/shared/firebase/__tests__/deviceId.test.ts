import AsyncStorage from '@react-native-async-storage/async-storage'

const DEVICE_ID_KEY = '@tourapp/deviceId'

beforeEach(async () => {
  jest.resetModules()
  await (AsyncStorage as any).clear()
})

describe('getDeviceId', () => {
  it('generates a UUID v4 string on first call and persists it', async () => {
    const { getDeviceId } = require('../deviceId')
    const id = await getDeviceId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(await AsyncStorage.getItem(DEVICE_ID_KEY)).toBe(id)
  })

  it('returns the same ID on repeated calls within the same session', async () => {
    const { getDeviceId } = require('../deviceId')
    const id1 = await getDeviceId()
    const id2 = await getDeviceId()
    expect(id1).toBe(id2)
  })

  it('returns persisted ID from a previous session', async () => {
    await AsyncStorage.setItem(DEVICE_ID_KEY, 'saved-device-id')
    const { getDeviceId } = require('../deviceId')
    expect(await getDeviceId()).toBe('saved-device-id')
  })
})
