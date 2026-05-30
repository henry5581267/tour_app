import AsyncStorage from '@react-native-async-storage/async-storage'
import { CACHE_TTL_MS } from '../config'

interface CacheEntry<T> {
  data: T
  savedAt: number
}

function cacheKey(query: string): string {
  return `places_cache:${query.toLowerCase().trim()}`
}

export async function getCached<T>(query: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(cacheKey(query))
  if (!raw) return null
  const entry = JSON.parse(raw) as CacheEntry<T>
  if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
    await AsyncStorage.removeItem(cacheKey(query))
    return null
  }
  return entry.data
}

export async function setCache<T>(query: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, savedAt: Date.now() }
  await AsyncStorage.setItem(cacheKey(query), JSON.stringify(entry))
}
