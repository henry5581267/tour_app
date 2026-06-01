import AsyncStorage from '@react-native-async-storage/async-storage'
import { Wishlist } from '../types'

const WISHLIST_KEY = '@tourapp/wishlist'

export async function getWishlist(): Promise<Wishlist | null> {
  const json = await AsyncStorage.getItem(WISHLIST_KEY)
  if (!json) return null
  return JSON.parse(json) as Wishlist
}

export async function saveWishlist(wishlist: Wishlist): Promise<void> {
  await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
}
