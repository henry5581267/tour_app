import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = '@tourapp/deviceId'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

let _cached: string | null = null

export async function getDeviceId(): Promise<string> {
  if (_cached) return _cached
  const existing = await AsyncStorage.getItem(KEY)
  if (existing) { _cached = existing; return _cached }
  const id = generateUUID()
  await AsyncStorage.setItem(KEY, id)
  _cached = id
  return _cached
}
