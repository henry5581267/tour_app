import { create } from 'zustand'
import { Wishlist, WishlistItem, PlaceSearchResult } from '../../shared/types'
import { getWishlists, saveWishlists } from '../../shared/storage/wishlistStorage'
import { uploadWishlist, fetchWishlistByCode, addWishlistMember, removeWishlistMember } from '../../shared/firebase/wishlistFirestore'
import { getDeviceId } from '../../shared/firebase/deviceId'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

let _wishlists: Wishlist[] = []

interface WishlistState {
  wishlists: Wishlist[]
  loadWishlists: () => Promise<void>
  createWishlist: (name: string) => Promise<Wishlist>
  deleteWishlist: (id: string) => Promise<void>
  renameWishlist: (id: string, name: string) => Promise<void>
  addItemToWishlist: (wishlistId: string, place: PlaceSearchResult) => Promise<void>
  removeItemFromWishlist: (wishlistId: string, itemId: string) => Promise<void>
  shareWishlist: (id: string) => Promise<string>
  joinWishlist: (code: string) => Promise<void>
  leaveWishlist: (id: string) => Promise<void>
  isInAnyWishlist: (googlePlaceId: string | null, name: string) => boolean
  getWishlistsContaining: (googlePlaceId: string | null, name: string) => string[]
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlists: [],

  loadWishlists: async () => {
    const stored = await getWishlists()
    _wishlists = stored
    set({ wishlists: [..._wishlists] })
  },

  createWishlist: async (name) => {
    const newList: Wishlist = {
      id: generateId(),
      name,
      items: [],
      isShared: false,
    }
    _wishlists.push(newList)
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
    return newList
  },

  deleteWishlist: async (id) => {
    _wishlists = _wishlists.filter(w => w.id !== id)
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
  },

  renameWishlist: async (id, name) => {
    _wishlists = _wishlists.map(w => w.id === id ? { ...w, name } : w)
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
  },

  addItemToWishlist: async (wishlistId, place) => {
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
    _wishlists = _wishlists.map(w =>
      w.id === wishlistId ? { ...w, items: [...w.items, item] } : w
    )
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
  },

  removeItemFromWishlist: async (wishlistId, itemId) => {
    _wishlists = _wishlists.map(w =>
      w.id === wishlistId ? { ...w, items: w.items.filter(i => i.id !== itemId) } : w
    )
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
  },

  shareWishlist: async (id) => {
    const wishlist = _wishlists.find(w => w.id === id)
    if (!wishlist) throw new Error('清單不存在')
    const deviceId = await getDeviceId()
    const code = await uploadWishlist(wishlist, deviceId)
    _wishlists = _wishlists.map(w => w.id === id ? { ...w, isShared: true, inviteCode: code } : w)
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
    return code
  },

  joinWishlist: async (code) => {
    const result = await fetchWishlistByCode(code)
    if (!result) throw new Error('找不到該收藏清單，請確認邀請碼是否正確')
    const deviceId = await getDeviceId()
    await addWishlistMember(result.id, deviceId)
    const joined: Wishlist = {
      id: result.id,
      name: result.name ?? '共享清單',
      items: result.items,
      isShared: true,
      inviteCode: code.toUpperCase(),
    }
    _wishlists.push(joined)
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
  },

  leaveWishlist: async (id) => {
    const wishlist = _wishlists.find(w => w.id === id)
    if (wishlist?.isShared) {
      const deviceId = await getDeviceId()
      await removeWishlistMember(id, deviceId)
    }
    _wishlists = _wishlists.filter(w => w.id !== id)
    set({ wishlists: [..._wishlists] })
    await saveWishlists(_wishlists)
  },

  isInAnyWishlist: (googlePlaceId, name) => {
    return _wishlists.some(w =>
      googlePlaceId
        ? w.items.some(i => i.googlePlaceId === googlePlaceId)
        : w.items.some(i => i.name === name)
    )
  },

  getWishlistsContaining: (googlePlaceId, name) => {
    return _wishlists
      .filter(w =>
        googlePlaceId
          ? w.items.some(i => i.googlePlaceId === googlePlaceId)
          : w.items.some(i => i.name === name)
      )
      .map(w => w.id)
  },
}))
