import AsyncStorage from '@react-native-async-storage/async-storage'
import { WishlistItem } from '../types'

const KEY = '@tourapp/blacklist'

export async function getBlacklist(): Promise<WishlistItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function saveBlacklist(items: WishlistItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}
