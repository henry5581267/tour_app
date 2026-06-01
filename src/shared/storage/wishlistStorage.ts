import AsyncStorage from '@react-native-async-storage/async-storage'
import { Wishlist } from '../types'

const WISHLIST_KEY = '@tourapp/wishlist'

export async function getWishlist(): Promise<Wishlist | null> {
  try {
    const json = await AsyncStorage.getItem(WISHLIST_KEY)
    if (!json) return null
    return JSON.parse(json) as Wishlist
  } catch (err) {
    console.error('Failed to load wishlist:', err)
    return null
  }
}

export async function saveWishlist(wishlist: Wishlist): Promise<void> {
  try {
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  } catch (err) {
    console.error('Failed to save wishlist:', err)
  }
}
