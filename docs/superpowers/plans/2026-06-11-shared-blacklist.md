# Shared Blacklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the single blacklist shareable via invite code with real-time Firestore sync and collaborative add/remove for all members.

**Architecture:** New `blacklistFirestore.ts` mirrors the wishlist Firestore pattern. New `useBlacklistStore` (independent Zustand store) holds all blacklist state and sharing logic. The wishlist store loses its blacklist responsibility entirely.

**Tech Stack:** React Native, TypeScript, Zustand, `@react-native-firebase/firestore`, AsyncStorage

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/shared/storage/blacklistStorage.ts` |
| Create | `src/shared/firebase/blacklistFirestore.ts` |
| Create | `src/features/wishlist/store/blacklistStore.ts` |
| Modify | `src/features/wishlist/store.ts` |
| Create | `src/features/wishlist/components/JoinBlacklistModal.tsx` |
| Modify | `src/features/wishlist/screens/BlacklistScreen.tsx` |
| Modify | `src/features/itinerary/components/AITripModal.tsx` |
| Modify | `App.tsx` |

---

### Task 1: Extend `blacklistStorage.ts` with meta read/write

**Files:**
- Modify: `src/shared/storage/blacklistStorage.ts`

- [ ] **Step 1: Replace the file contents**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/storage/blacklistStorage.ts
git commit -m "feat: add blacklist meta storage for sharing state"
```

---

### Task 2: Create `blacklistFirestore.ts`

**Files:**
- Create: `src/shared/firebase/blacklistFirestore.ts`

- [ ] **Step 1: Create the file**

```ts
import firestore from '@react-native-firebase/firestore'
import { WishlistItem } from '../types'

const BLACKLISTS = 'blacklists'
const BLACKLIST_INVITE_CODES = 'blacklistInviteCodes'
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export async function uploadBlacklist(
  id: string,
  items: WishlistItem[],
  deviceId: string,
): Promise<string> {
  const code = generateInviteCode().toUpperCase()
  const batch = firestore().batch()
  batch.set(firestore().collection(BLACKLISTS).doc(id), {
    id,
    inviteCode: code,
    items,
    members: [deviceId],
  })
  batch.set(firestore().collection(BLACKLIST_INVITE_CODES).doc(code), {
    blacklistId: id,
  })
  await batch.commit()
  return code
}

export async function fetchBlacklistByCode(
  code: string,
): Promise<{ id: string; items: WishlistItem[] } | null> {
  const upperCode = code.toUpperCase()
  const codeSnap = await firestore()
    .collection(BLACKLIST_INVITE_CODES)
    .doc(upperCode)
    .get()
  if (!codeSnap.exists) return null

  const { blacklistId } = (codeSnap as any).data() as { blacklistId: string }
  const snap = await firestore().collection(BLACKLISTS).doc(blacklistId).get()
  if (!snap.exists) return null

  const data = (snap as any).data() as { id: string; items: WishlistItem[] }
  return { id: data.id, items: data.items ?? [] }
}

export async function addBlacklistMember(
  blacklistId: string,
  deviceId: string,
): Promise<void> {
  await firestore()
    .collection(BLACKLISTS)
    .doc(blacklistId)
    .update({ members: (firestore as any).FieldValue.arrayUnion(deviceId) })
}

export async function removeBlacklistMember(
  blacklistId: string,
  deviceId: string,
): Promise<void> {
  await firestore()
    .collection(BLACKLISTS)
    .doc(blacklistId)
    .update({ members: (firestore as any).FieldValue.arrayRemove(deviceId) })
}

export async function updateSharedBlacklist(
  blacklistId: string,
  items: WishlistItem[],
): Promise<void> {
  await firestore().collection(BLACKLISTS).doc(blacklistId).update({ items })
}

export async function deleteBlacklist(
  blacklistId: string,
  inviteCode?: string,
): Promise<void> {
  const batch = firestore().batch()
  batch.delete(firestore().collection(BLACKLISTS).doc(blacklistId))
  if (inviteCode) {
    batch.delete(
      firestore().collection(BLACKLIST_INVITE_CODES).doc(inviteCode.toUpperCase()),
    )
  }
  await batch.commit()
}

export function subscribeToBlacklist(
  blacklistId: string,
  onUpdate: (items: WishlistItem[]) => void,
): () => void {
  return firestore()
    .collection(BLACKLISTS)
    .doc(blacklistId)
    .onSnapshot(snap => {
      if (!snap.exists) return
      const data = (snap as any).data() as { items: WishlistItem[] }
      onUpdate(data.items ?? [])
    })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/firebase/blacklistFirestore.ts
git commit -m "feat: add blacklistFirestore module (upload, join, sync, delete)"
```

---

### Task 3: Create `useBlacklistStore`

**Files:**
- Create: `src/features/wishlist/store/blacklistStore.ts`

Note: create the `store/` subdirectory first — `blacklistStore.ts` lives at `src/features/wishlist/store/blacklistStore.ts`.

- [ ] **Step 1: Create the file**

```ts
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
    await updateSharedBlacklist(result.id, merged)
    await addBlacklistMember(result.id, deviceId)
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
    _items = items
    useBlacklistStore.setState({ items: [..._items] })
    saveBlacklist(_items)
  })
}

function _stopSubscription() {
  if (_unsub) { _unsub(); _unsub = null }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/wishlist/store/blacklistStore.ts
git commit -m "feat: add useBlacklistStore with share/join/leave/dissolve actions"
```

---

### Task 4: Remove blacklist from `wishlist/store.ts`

**Files:**
- Modify: `src/features/wishlist/store.ts`

- [ ] **Step 1: Remove the `getBlacklist`/`saveBlacklist` import line**

Remove this line from the imports at the top of `src/features/wishlist/store.ts`:
```ts
import { getBlacklist, saveBlacklist } from '../../shared/storage/blacklistStorage'
```

- [ ] **Step 2: Remove `_blacklist` module-level variable**

Remove:
```ts
let _blacklist: WishlistItem[] = []
```

- [ ] **Step 3: Remove blacklist fields from the `WishlistState` interface**

Remove these three lines from the interface:
```ts
  blacklist: WishlistItem[]
  addToBlacklist: (place: PlaceSearchResult) => Promise<void>
  removeFromBlacklist: (id: string) => Promise<void>
```

- [ ] **Step 4: Update `loadWishlists` — remove the blacklist lines**

Find the `loadWishlists` action. Remove:
```ts
    _blacklist = await getBlacklist()
    set({ wishlists: _merged(), blacklist: _blacklist })
```
Replace with:
```ts
    set({ wishlists: _merged() })
```

- [ ] **Step 5: Remove `addToBlacklist` and `removeFromBlacklist` implementations**

Remove the entire `addToBlacklist` action block:
```ts
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
```

Remove the entire `removeFromBlacklist` action block:
```ts
  removeFromBlacklist: async (id) => {
    _blacklist = _blacklist.filter(b => b.id !== id)
    set({ blacklist: [..._blacklist] })
    await saveBlacklist(_blacklist)
  },
```

- [ ] **Step 6: Remove the initial `blacklist: []` from the store initial state**

Remove:
```ts
  blacklist: [],
```

- [ ] **Step 7: Check for any remaining TypeScript errors**

Run: `npx tsc --noEmit`

Fix any "property does not exist" errors (there should be none if steps above were done correctly).

- [ ] **Step 8: Commit**

```bash
git add src/features/wishlist/store.ts
git commit -m "refactor: remove blacklist state from wishlist store"
```

---

### Task 5: Create `JoinBlacklistModal.tsx`

**Files:**
- Create: `src/features/wishlist/components/JoinBlacklistModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useBlacklistStore } from '../store/blacklistStore'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export function JoinBlacklistModal({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme()
  const join = useBlacklistStore(s => s.join)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = code.trim().length === 6 && !loading

  const handleJoin = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await join(code.trim().toUpperCase())
      setCode('')
      onSuccess()
      onClose()
    } catch {
      Alert.alert('加入失敗', '找不到此黑名單，請確認邀請碼是否正確')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>加入共享黑名單</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>輸入朋友分享的 6 位邀請碼</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={code}
            onChangeText={t => setCode(t.toUpperCase().slice(0, 6))}
            placeholder="A1B2C3"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: canSubmit ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleJoin}
              disabled={!canSubmit}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[styles.joinBtnText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>加入</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet: { width: '100%', borderRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 16, fontSize: 28, fontWeight: '800', letterSpacing: 6, textAlign: 'center', marginBottom: 24 },
  btns: { gap: 12 },
  joinBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinBtnText: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 15 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/features/wishlist/components/JoinBlacklistModal.tsx
git commit -m "feat: add JoinBlacklistModal component"
```

---

### Task 6: Rewrite `BlacklistScreen.tsx`

**Files:**
- Modify: `src/features/wishlist/screens/BlacklistScreen.tsx`

The screen needs:
- `useBlacklistStore` instead of `useWishlistStore` for `blacklist`/`addToBlacklist`/`removeFromBlacklist`
- Header right button set via `useLayoutEffect` + `navigation.setOptions`
- Status bar when shared
- Bottom bar: "加入共享黑名單" when local, nothing when shared
- `JoinBlacklistModal` rendered in the tree

- [ ] **Step 1: Replace the entire file**

```tsx
import React, { useState, useLayoutEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useBlacklistStore } from '../store/blacklistStore'
import { searchPlaces } from '../../../shared/api/places'
import { PlaceSearchResult } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { EmptyState } from '../../../shared/components/EmptyState'
import { JoinBlacklistModal } from '../components/JoinBlacklistModal'

export function BlacklistScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation()

  const items = useBlacklistStore(s => s.items)
  const isShared = useBlacklistStore(s => s.isShared)
  const inviteCode = useBlacklistStore(s => s.inviteCode)
  const add = useBlacklistStore(s => s.add)
  const remove = useBlacklistStore(s => s.remove)
  const share = useBlacklistStore(s => s.share)
  const leave = useBlacklistStore(s => s.leave)
  const dissolve = useBlacklistStore(s => s.dissolve)

  const isCreator = isShared && !!inviteCode
  const isMember = isShared && !inviteCode

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [sharing, setSharing] = useState(false)

  useLayoutEffect(() => {
    if (!isShared) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing
              ? <ActivityIndicator size="small" />
              : <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>📤 分享</Text>
            }
          </TouchableOpacity>
        ),
      })
    } else if (isCreator) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => Alert.alert('邀請碼', inviteCode!, [{ text: '確定' }])}
          >
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>邀請碼</Text>
          </TouchableOpacity>
        ),
      })
    } else {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={handleLeave}
          >
            <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>離開</Text>
          </TouchableOpacity>
        ),
      })
    }
  }, [isShared, isCreator, inviteCode, sharing, colors])

  const handleShare = async () => {
    setSharing(true)
    try {
      const code = await share()
      Alert.alert('共享黑名單', `邀請碼：${code}\n\n分享給朋友，他們可以在黑名單頁面輸入邀請碼加入`)
    } catch {
      Alert.alert('分享失敗', '請稍後再試')
    } finally {
      setSharing(false)
    }
  }

  const handleLeave = () => {
    Alert.alert('離開共享黑名單', '確定要離開？離開後你的本機會保留目前的黑名單快照', [
      { text: '取消', style: 'cancel' },
      { text: '離開', style: 'destructive', onPress: () => leave() },
    ])
  }

  const handleDissolve = () => {
    Alert.alert('停止共享', '確定要解散共享黑名單？所有成員將失去同步連線', [
      { text: '取消', style: 'cancel' },
      { text: '解散', style: 'destructive', onPress: () => dissolve() },
    ])
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchPlaces(query.trim())
      setResults(res.slice(0, 5))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async (place: PlaceSearchResult) => {
    await add(place)
    setQuery('')
    setResults([])
    Alert.alert('已加入黑名單', `「${place.name}」加入黑名單，AI 規劃時可選擇避開`)
  }

  const handleRemove = (id: string, name: string) => {
    Alert.alert('移除黑名單', `確定移除「${name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: () => remove(id) },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* 共享狀態列 */}
      {isShared && (
        <TouchableOpacity
          style={[styles.sharedBar, { backgroundColor: colors.primary + '18', borderBottomColor: colors.border }]}
          onLongPress={isCreator ? handleDissolve : undefined}
          activeOpacity={isCreator ? 0.6 : 1}
        >
          <Text style={[styles.sharedBarText, { color: colors.primary }]}>
            👥 共享中{isCreator ? `　邀請碼：${inviteCode}` : ''}
          </Text>
          {isCreator && (
            <Text style={[styles.sharedBarHint, { color: colors.textTertiary }]}>長按可解散</Text>
          )}
        </TouchableOpacity>
      )}

      {/* 搜尋區 */}
      {showSearch ? (
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋要加入黑名單的地點"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={handleSearch}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>搜尋</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelSearch} onPress={() => { setShowSearch(false); setQuery(''); setResults([]) }}>
            <Text style={[styles.cancelSearchText, { color: colors.textSecondary }]}>取消</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 搜尋結果 */}
      {results.length > 0 && (
        <View style={[styles.resultsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {results.map(r => (
            <TouchableOpacity
              key={r.googlePlaceId}
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
              onPress={() => handleAdd(r)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultName, { color: colors.text }]}>{r.name}</Text>
                <Text style={[styles.resultAddr, { color: colors.textSecondary }]} numberOfLines={1}>{r.address}</Text>
              </View>
              <Text style={[styles.addBtn, { color: colors.primary }]}>＋</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 黑名單列表 */}
      <FlatList
        data={items}
        keyExtractor={b => b.id}
        contentContainerStyle={items.length === 0 ? styles.emptyFlex : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            message="黑名單是空的"
            subtext="點右上角 ＋ 搜尋並加入不想去的地點，AI 規劃時可選擇避開"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onLongPress={() => handleRemove(item.id, item.name)}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <View style={styles.info}>
              <CategoryBadge category={item.category} />
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.addr, { color: colors.textSecondary }]} numberOfLines={1}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 底部列（本地時顯示加入按鈕） */}
      {!isShared && !showSearch && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.joinSharedBtn, { borderColor: colors.border }]}
            onPress={() => setShowJoin(true)}
          >
            <Text style={[styles.joinSharedText, { color: colors.text }]}>加入共享黑名單</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB 加入 */}
      {!showSearch && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setShowSearch(true)}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      <JoinBlacklistModal
        visible={showJoin}
        onClose={() => setShowJoin(false)}
        onSuccess={() => {}}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyFlex: { flex: 1 },
  listContent: { padding: 16, gap: 10, paddingBottom: 90 },
  sharedBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sharedBarText: { fontSize: 13, fontWeight: '600' },
  sharedBarHint: { fontSize: 11 },
  searchBox: { padding: 12, borderBottomWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 14 },
  searchBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelSearch: { paddingHorizontal: 4 },
  cancelSearchText: { fontSize: 14 },
  resultsBox: { borderBottomWidth: 1, borderTopWidth: 1 },
  resultRow: { padding: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  resultName: { fontSize: 14, fontWeight: '600' },
  resultAddr: { fontSize: 12, marginTop: 2 },
  addBtn: { fontSize: 22, fontWeight: '700', paddingLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  addr: { fontSize: 12, marginTop: 2 },
  bottomBar: { flexDirection: 'row', padding: 16, borderTopWidth: 1, paddingBottom: 24 },
  joinSharedBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: 'center' },
  joinSharedText: { fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', right: 24, bottom: 28,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/features/wishlist/screens/BlacklistScreen.tsx
git commit -m "feat: update BlacklistScreen with share/join/leave UI"
```

---

### Task 7: Update `AITripModal.tsx` to use `useBlacklistStore`

**Files:**
- Modify: `src/features/itinerary/components/AITripModal.tsx`

- [ ] **Step 1: Replace the `useWishlistStore` blacklist import**

At the top of the file, add the import:
```ts
import { useBlacklistStore } from '../../wishlist/store/blacklistStore'
```

- [ ] **Step 2: Replace the blacklist selector line**

Find:
```ts
  const blacklist = useWishlistStore(s => s.blacklist)
```
Replace with:
```ts
  const blacklist = useBlacklistStore(s => s.items)
```

- [ ] **Step 3: Commit**

```bash
git add src/features/itinerary/components/AITripModal.tsx
git commit -m "refactor: AITripModal reads blacklist from useBlacklistStore"
```

---

### Task 8: Update `App.tsx` to load blacklist on startup

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Add the import**

Add below the existing wishlist store import:
```ts
import { useBlacklistStore } from './src/features/wishlist/store/blacklistStore'
```

- [ ] **Step 2: Call `load()` inside the `useEffect`**

Find:
```ts
  useEffect(() => {
    loadTrips()
    useWishlistStore.getState().loadWishlists()
  }, [])
```
Replace with:
```ts
  useEffect(() => {
    loadTrips()
    useWishlistStore.getState().loadWishlists()
    useBlacklistStore.getState().load()
  }, [])
```

- [ ] **Step 3: Check TypeScript**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: load shared blacklist state on app startup"
```

---

## Verification

After all tasks are complete:

1. **Local flow**: Open app → BlacklistScreen → header shows `📤 分享` → tap it → invite code displayed
2. **Share flow**: Tap `📤 分享` → status bar appears with `👥 共享中　邀請碼：XXXXXX`
3. **Join flow (second device/simulator)**: Open BlacklistScreen → tap "加入共享黑名單" → enter code → items merge → status bar shows `👥 共享中`
4. **Real-time sync**: Add item on device A → appears on device B within a few seconds
5. **Leave flow (member)**: Header `離開` → confirm → status bar disappears → items kept locally
6. **Dissolve flow (creator)**: Long press status bar → `停止共享` → all devices revert to local
7. **AI trip modal**: `blacklist` still populated correctly from `useBlacklistStore`
