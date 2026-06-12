import { create } from 'zustand'
import { WishlistItem, PlaceSearchResult } from '../../../shared/types'
import {
  getBlacklist, saveBlacklist,
  getBlacklistMeta, saveBlacklistMeta,
} from '../../../shared/storage/blacklistStorage'
import {
  uploadBlacklist,
  fetchBlacklistByCode,
  addBlacklistMember,
  removeBlacklistMember,
  updateSharedBlacklist,
  deleteBlacklist as deleteBlacklistFirestore,
  subscribeToBlacklist,
} from '../../../shared/firebase/blacklistFirestore'
import { getDeviceId } from '../../../shared/firebase/deviceId'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

let _items: WishlistItem[] = []
let _unsub: (() => void) | null = null

interface BlacklistState {
  items: WishlistItem[]
  isShared: boolean
  firestoreId?: string
  inviteCode?: string
  load: () => Promise<void>
  add: (place: PlaceSearchResult) => Promise<void>
  remove: (id: string) => Promise<void>
  share: () => Promise<string>
  join: (code: string) => Promise<void>
  leave: () => Promise<void>
  dissolve: () => Promise<void>
}

export const useBlacklistStore = create<BlacklistState>((set, get) => ({
  items: [],
  isShared: false,
  firestoreId: undefined,
  inviteCode: undefined,

  load: async () => {
    const items = await getBlacklist()
    const meta = await getBlacklistMeta()
    _items = items
    set({
      items: [..._items],
      isShared: meta.isShared,
      firestoreId: meta.firestoreId,
      inviteCode: meta.inviteCode,
    })
    if (meta.isShared && meta.firestoreId) {
      _startSubscription(meta.firestoreId)
    }
  },

  add: async (place) => {
    const already = _items.some(b =>
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
    _items.push(item)
    set({ items: [..._items] })
    await saveBlacklist(_items)
    const { isShared, firestoreId } = get()
    if (isShared && firestoreId) await updateSharedBlacklist(firestoreId, _items)
  },

  remove: async (id) => {
    _items = _items.filter(b => b.id !== id)
    set({ items: [..._items] })
    await saveBlacklist(_items)
    const { isShared, firestoreId } = get()
    if (isShared && firestoreId) await updateSharedBlacklist(firestoreId, _items)
  },

  share: async () => {
    const deviceId = await getDeviceId()
    const id = generateId()
    const code = await uploadBlacklist(id, _items, deviceId)
    const meta = { isShared: true, firestoreId: id, inviteCode: code }
    await saveBlacklistMeta(meta)
    set({ isShared: true, firestoreId: id, inviteCode: code })
    _startSubscription(id)
    return code
  },

  join: async (code) => {
    const result = await fetchBlacklistByCode(code)
    if (!result) throw new Error('找不到黑名單，請確認邀請碼是否正確')
    const merged = [...result.items]
    for (const local of _items) {
      const exists = merged.some(r =>
        local.googlePlaceId ? r.googlePlaceId === local.googlePlaceId : r.name === local.name
      )
      if (!exists) merged.push(local)
    }
    const deviceId = await getDeviceId()
    await addBlacklistMember(result.id, deviceId)
    await updateSharedBlacklist(result.id, merged)
    _items = merged
    await saveBlacklist(_items)
    await saveBlacklistMeta({ isShared: true, firestoreId: result.id })
    set({ items: [..._items], isShared: true, firestoreId: result.id, inviteCode: undefined })
    _startSubscription(result.id)
  },

  leave: async () => {
    const { firestoreId } = get()
    if (firestoreId) {
      const deviceId = await getDeviceId()
      await removeBlacklistMember(firestoreId, deviceId)
    }
    _stopSubscription()
    await saveBlacklistMeta({ isShared: false })
    set({ isShared: false, firestoreId: undefined, inviteCode: undefined })
  },

  dissolve: async () => {
    const { firestoreId, inviteCode } = get()
    if (firestoreId) await deleteBlacklistFirestore(firestoreId, inviteCode)
    _stopSubscription()
    await saveBlacklistMeta({ isShared: false })
    set({ isShared: false, firestoreId: undefined, inviteCode: undefined })
  },
}))

function _startSubscription(firestoreId: string) {
  _stopSubscription()
  _unsub = subscribeToBlacklist(firestoreId, (items) => {
    if (items === null) {
      _stopSubscription()
      saveBlacklistMeta({ isShared: false })
      useBlacklistStore.setState({ isShared: false, firestoreId: undefined, inviteCode: undefined })
      return
    }
    _items = items
    useBlacklistStore.setState({ items: [..._items] })
    saveBlacklist(_items)
  })
}

function _stopSubscription() {
  if (_unsub) { _unsub(); _unsub = null }
}
