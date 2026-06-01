import { create } from 'zustand'
import { Wishlist, WishlistItem, PlaceSearchResult } from '../../shared/types'
import { getWishlist, saveWishlist } from '../../shared/storage/wishlistStorage'
import { uploadWishlist, fetchWishlistByCode, addWishlistMember, removeWishlistMember } from '../../shared/firebase/wishlistFirestore'
import { getDeviceId } from '../../shared/firebase/deviceId'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function freshWishlist(): Wishlist {
  return { id: generateId(), items: [], isShared: false }
}

interface WishlistState {
  wishlist: Wishlist
  loadWishlist: () => Promise<void>
  addItem: (place: PlaceSearchResult) => Promise<void>
  removeItem: (id: string) => Promise<void>
  shareWishlist: () => Promise<string>
  joinWishlist: (code: string) => Promise<void>
  leaveSharedWishlist: () => Promise<void>
  hasItem: (googlePlaceId: string | null, name: string) => boolean
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: freshWishlist(),

  loadWishlist: async () => {
    const stored = await getWishlist()
    set({ wishlist: stored ?? freshWishlist() })
  },

  addItem: async (place) => {
    const item: WishlistItem = {
      id: generateId(),
      googlePlaceId: place.googlePlaceId,
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      address: place.address,
      photo: place.photo,
      addedAt: new Date().toISOString(),
    }
    const updated = { ...get().wishlist, items: [...get().wishlist.items, item] }
    set({ wishlist: updated })
    await saveWishlist(updated)
  },

  removeItem: async (id) => {
    const updated = { ...get().wishlist, items: get().wishlist.items.filter(i => i.id !== id) }
    set({ wishlist: updated })
    await saveWishlist(updated)
  },

  shareWishlist: async () => {
    const deviceId = await getDeviceId()
    const code = await uploadWishlist(get().wishlist, deviceId)
    const updated = { ...get().wishlist, isShared: true, inviteCode: code }
    set({ wishlist: updated })
    await saveWishlist(updated)
    return code
  },

  joinWishlist: async (code) => {
    const result = await fetchWishlistByCode(code)
    if (!result) throw new Error('找不到該收藏清單，請確認邀請碼是否正確')
    const deviceId = await getDeviceId()
    await addWishlistMember(result.id, deviceId)
    const joined: Wishlist = {
      id: result.id,
      items: result.items,
      isShared: true,
      inviteCode: code.toUpperCase(),
    }
    set({ wishlist: joined })
    await saveWishlist(joined)
  },

  leaveSharedWishlist: async () => {
    const { wishlist } = get()
    if (wishlist.isShared) {
      const deviceId = await getDeviceId()
      await removeWishlistMember(wishlist.id, deviceId)
    }
    const fresh = freshWishlist()
    set({ wishlist: fresh })
    await saveWishlist(fresh)
  },

  hasItem: (googlePlaceId, name) => {
    const { items } = get().wishlist
    if (googlePlaceId) return items.some(i => i.googlePlaceId === googlePlaceId)
    return items.some(i => i.name === name)
  },
}))
