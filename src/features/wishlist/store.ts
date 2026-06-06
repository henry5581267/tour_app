import { create } from 'zustand'
import { Wishlist, WishlistItem, PlaceSearchResult } from '../../shared/types'
import { getWishlists, saveWishlists } from '../../shared/storage/wishlistStorage'
import { getBlacklist, saveBlacklist } from '../../shared/storage/blacklistStorage'
import {
  uploadWishlist,
  fetchWishlistByCode,
  addWishlistMember,
  removeWishlistMember,
  updateSharedWishlist,
  subscribeToWishlist,
  deleteWishlist as deleteWishlistFirebase,
} from '../../shared/firebase/wishlistFirestore'
import { getDeviceId } from '../../shared/firebase/deviceId'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const _listeners: Record<string, () => void> = {}
let _localWishlists: Wishlist[] = []
const _sharedWishlists = new Map<string, Wishlist>()
let _blacklist: WishlistItem[] = []

function _merged(): Wishlist[] {
  return [..._localWishlists, ..._sharedWishlists.values()]
}

interface WishlistState {
  wishlists: Wishlist[]
  blacklist: WishlistItem[]
  loadWishlists: () => Promise<void>
  addToBlacklist: (place: PlaceSearchResult) => Promise<void>
  removeFromBlacklist: (id: string) => Promise<void>
  createWishlist: (name: string) => Promise<Wishlist>
  deleteWishlist: (id: string) => Promise<void>
  renameWishlist: (id: string, name: string) => Promise<void>
  addItemToWishlist: (wishlistId: string, place: PlaceSearchResult) => Promise<void>
  removeItemFromWishlist: (wishlistId: string, itemId: string) => Promise<void>
  shareWishlist: (id: string) => Promise<string>
  joinWishlist: (code: string) => Promise<void>
  leaveWishlist: (id: string) => Promise<void>
  subscribeToSharedWishlist: (id: string) => void
  isInAnyWishlist: (googlePlaceId: string | null, name: string) => boolean
  getWishlistsContaining: (googlePlaceId: string | null, name: string) => string[]
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlists: [],
  blacklist: [],

  loadWishlists: async () => {
    const stored = await getWishlists()
    _localWishlists = stored.filter(w => !w.isShared)
    const sharedStored = stored.filter(w => w.isShared)
    sharedStored.forEach(w => _sharedWishlists.set(w.id, w))
    _blacklist = await getBlacklist()
    set({ wishlists: _merged(), blacklist: _blacklist })
    // Re-subscribe to all shared wishlists
    sharedStored.forEach(w => get().subscribeToSharedWishlist(w.id))
  },

  addToBlacklist: async (place) => {
    const already = _blacklist.some(b =>
      place.googlePlaceId ? b.googlePlaceId === place.googlePlaceId : b.name === place.name
    )
    if (already) return
    const item: WishlistItem = {
      id: generateId(),
      googlePlaceId: place.googlePlaceId,
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      address: place.address,
      photo: place.photo,
      rating: place.rating,
      addedAt: new Date().toISOString(),
    }
    _blacklist.push(item)
    set({ blacklist: [..._blacklist] })
    await saveBlacklist(_blacklist)
  },

  removeFromBlacklist: async (id) => {
    _blacklist = _blacklist.filter(b => b.id !== id)
    set({ blacklist: [..._blacklist] })
    await saveBlacklist(_blacklist)
  },

  createWishlist: async (name) => {
    const newList: Wishlist = { id: generateId(), name, items: [], isShared: false }
    _localWishlists.push(newList)
    set({ wishlists: _merged() })
    await saveWishlists(_merged())
    return newList
  },

  deleteWishlist: async (id) => {
    const shared = _sharedWishlists.get(id)
    if (shared) {
      _sharedWishlists.delete(id)
      if (_listeners[id]) { _listeners[id](); delete _listeners[id] }
      await deleteWishlistFirebase(id, shared.inviteCode)
    } else {
      _localWishlists = _localWishlists.filter(w => w.id !== id)
    }
    set({ wishlists: _merged() })
    await saveWishlists(_merged())
  },

  renameWishlist: async (id, name) => {
    const shared = _sharedWishlists.get(id)
    if (shared) {
      _sharedWishlists.set(id, { ...shared, name })
      await updateSharedWishlist(id, undefined, name)
    } else {
      _localWishlists = _localWishlists.map(w => w.id === id ? { ...w, name } : w)
    }
    set({ wishlists: _merged() })
    await saveWishlists(_merged())
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
      rating: place.rating,
      addedAt: new Date().toISOString(),
    }
    const shared = _sharedWishlists.get(wishlistId)
    if (shared) {
      const updated = { ...shared, items: [...shared.items, item] }
      _sharedWishlists.set(wishlistId, updated)
      set({ wishlists: _merged() })
      await updateSharedWishlist(wishlistId, updated.items)
    } else {
      _localWishlists = _localWishlists.map(w =>
        w.id === wishlistId ? { ...w, items: [...w.items, item] } : w
      )
      set({ wishlists: _merged() })
      await saveWishlists(_merged())
    }
  },

  removeItemFromWishlist: async (wishlistId, itemId) => {
    const shared = _sharedWishlists.get(wishlistId)
    if (shared) {
      const updated = { ...shared, items: shared.items.filter(i => i.id !== itemId) }
      _sharedWishlists.set(wishlistId, updated)
      set({ wishlists: _merged() })
      await updateSharedWishlist(wishlistId, updated.items)
    } else {
      _localWishlists = _localWishlists.map(w =>
        w.id === wishlistId ? { ...w, items: w.items.filter(i => i.id !== itemId) } : w
      )
      set({ wishlists: _merged() })
      await saveWishlists(_merged())
    }
  },

  shareWishlist: async (id) => {
    const wishlist = _localWishlists.find(w => w.id === id)
    if (!wishlist) throw new Error('清單不存在')
    const deviceId = await getDeviceId()
    const code = await uploadWishlist(wishlist, deviceId)
    const shared = { ...wishlist, isShared: true, inviteCode: code }
    _localWishlists = _localWishlists.filter(w => w.id !== id)
    _sharedWishlists.set(id, shared)
    set({ wishlists: _merged() })
    await saveWishlists(_merged())
    get().subscribeToSharedWishlist(id)
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
    _sharedWishlists.set(joined.id, joined)
    set({ wishlists: _merged() })
    await saveWishlists(_merged())
    get().subscribeToSharedWishlist(joined.id)
  },

  leaveWishlist: async (id) => {
    if (_listeners[id]) { _listeners[id](); delete _listeners[id] }
    const wishlist = _sharedWishlists.get(id)
    if (wishlist?.isShared) {
      const deviceId = await getDeviceId()
      await removeWishlistMember(id, deviceId)
    }
    _sharedWishlists.delete(id)
    set({ wishlists: _merged() })
    await saveWishlists(_merged())
  },

  subscribeToSharedWishlist: (id) => {
    if (_listeners[id]) return
    const unsub = subscribeToWishlist(id, (data) => {
      if (!data) return
      const existing = _sharedWishlists.get(id)
      if (!existing) return
      _sharedWishlists.set(id, { ...existing, items: data.items, name: data.name ?? existing.name })
      useWishlistStore.setState({ wishlists: _merged() })
      saveWishlists(_merged())
    })
    _listeners[id] = unsub
  },

  isInAnyWishlist: (googlePlaceId, name) => {
    return _merged().some(w =>
      googlePlaceId
        ? w.items.some(i => i.googlePlaceId === googlePlaceId)
        : w.items.some(i => i.name === name)
    )
  },

  getWishlistsContaining: (googlePlaceId, name) => {
    return _merged()
      .filter(w =>
        googlePlaceId
          ? w.items.some(i => i.googlePlaceId === googlePlaceId)
          : w.items.some(i => i.name === name)
      )
      .map(w => w.id)
  },
}))
