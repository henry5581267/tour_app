import AsyncStorage from '@react-native-async-storage/async-storage'
import { Wishlist } from '../types'

const KEY = '@tourapp/wishlists'

export async function getWishlists(): Promise<Wishlist[]> {
  try {
    const json = await AsyncStorage.getItem(KEY)
    if (!json) return []
    return JSON.parse(json) as Wishlist[]
  } catch (err) {
    console.error('Failed to load wishlists:', err)
    return []
  }
}

export async function saveWishlists(lists: Wishlist[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(lists))
  } catch (err) {
    console.error('Failed to save wishlists:', err)
  }
}
