import AsyncStorage from '@react-native-async-storage/async-storage'
import { WishlistItem } from '../types'

const KEY = '@tourapp/blacklist'
const META_KEY = '@tourapp/blacklistMeta'

export interface BlacklistMeta {
  isShared: boolean
  firestoreId?: string
  inviteCode?: string
}

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

export async function getBlacklistMeta(): Promise<BlacklistMeta> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : { isShared: false }
  } catch {
    return { isShared: false }
  }
}

export async function saveBlacklistMeta(meta: BlacklistMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {}
}
