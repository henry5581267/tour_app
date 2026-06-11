# Shared Blacklist Design

**Date:** 2026-06-11
**Status:** Approved

## Overview

Make the single global blacklist shareable via invite code, with real-time Firestore sync. All members can add/remove items collaboratively. Joining merges local items into the shared list.

## Decisions

- Single blacklist per device (not a list of lists)
- Collaborative: all members can add/remove, real-time sync via onSnapshot
- Join behavior: local items merge into shared blacklist (union, deduped by googlePlaceId or name)
- Architecture: new `blacklistFirestore.ts` + new `useBlacklistStore` (separate from wishlist store)

## Data Structures

### Firestore

```
blacklists/{blacklistId}
  id:          string
  inviteCode:  string
  items:       WishlistItem[]
  members:     string[]        // deviceId array

blacklistInviteCodes/{code}
  blacklistId: string
```

### Local (AsyncStorage)

Existing key `@tourapp/blacklist` keeps the items array unchanged.

New key `@tourapp/blacklistMeta`:

```ts
interface BlacklistMeta {
  isShared: boolean
  firestoreId?: string
  inviteCode?: string   // only present for the creator
}
```

### Zustand State (`useBlacklistStore`)

```ts
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
}
```

## New Files

### `src/shared/firebase/blacklistFirestore.ts`

Mirrors `wishlistFirestore.ts` with collections `blacklists` / `blacklistInviteCodes`:

| Function | Description |
|----------|-------------|
| `uploadBlacklist(items, deviceId)` | Creates Firestore doc + invite code doc, returns code |
| `fetchBlacklistByCode(code)` | Looks up invite code, returns `{ id, items }` or null |
| `addBlacklistMember(id, deviceId)` | arrayUnion deviceId into members |
| `removeBlacklistMember(id, deviceId)` | arrayRemove deviceId from members |
| `updateSharedBlacklist(id, items)` | Overwrites items array |
| `deleteBlacklist(id, inviteCode?)` | Batch deletes doc + invite code doc |
| `subscribeToBlacklist(id, onUpdate)` | onSnapshot listener, returns unsubscribe fn |

### `src/features/wishlist/store/blacklistStore.ts`

New Zustand store. Action logic:

- **`load()`**: reads items from `@tourapp/blacklist`, reads meta from `@tourapp/blacklistMeta`, if `isShared` re-subscribes to Firestore snapshot
- **`share()`**: calls `uploadBlacklist`, saves meta (`isShared=true`, `firestoreId`, `inviteCode`), starts onSnapshot
- **`join(code)`**: fetches blacklist by code, merges local items into fetched items (dedup by `googlePlaceId ?? name`), calls `updateSharedBlacklist` with merged list, calls `addBlacklistMember`, saves meta (`isShared=true`, `firestoreId`, no `inviteCode`), starts onSnapshot
- **`leave()`**: calls `removeBlacklistMember`, clears meta (`isShared=false`), cancels onSnapshot, keeps current items as local snapshot
- **`add(place)`**: adds to local items array; if `isShared` also calls `updateSharedBlacklist` (onSnapshot will propagate to all members)
- **`remove(id)`**: removes from local items; if `isShared` also calls `updateSharedBlacklist`
- **onSnapshot callback**: overwrites `items` state and saves to `@tourapp/blacklist`

### `src/features/wishlist/components/JoinBlacklistModal.tsx`

TextInput for invite code + confirm button. Same design as `JoinWishlistModal`.

## Modified Files

### `src/shared/storage/blacklistStorage.ts`

Add meta read/write alongside existing items functions:

```ts
export async function getBlacklistMeta(): Promise<BlacklistMeta>
export async function saveBlacklistMeta(meta: BlacklistMeta): Promise<void>
```

### `src/features/wishlist/screens/BlacklistScreen.tsx`

Add status bar and actions based on sharing state:

| State | Status bar | Header right |
|-------|-----------|--------------|
| Local | (none) | `📤 分享` button |
| Shared — creator | `👥 共享中　邀請碼：XXXXXX` (long press → dissolve alert) | `邀請碼` → modal |
| Shared — member | `👥 共享中` | `離開` → confirm alert → `leave()` |

Bottom bar:
- Local: `加入共享黑名單` button + FAB `＋`
- Shared: FAB `＋` only

### `src/features/wishlist/store.ts`

Remove blacklist state/actions (`blacklist`, `addToBlacklist`, `removeFromBlacklist`, `loadWishlists` blacklist portion). All callers switch to `useBlacklistStore`.

### All blacklist consumers

- `src/features/itinerary/components/AITripModal.tsx`: `blacklist` from `useBlacklistStore`
- `App.tsx`: call `useBlacklistStore.getState().load()` alongside `loadWishlists()`

## UI Flow

**Sharing:**
1. User taps `📤 分享` in header → `share()` called → code returned → Modal shows code

**Joining:**
1. User taps `加入共享黑名單` → `JoinBlacklistModal` opens
2. Enters code → `join(code)` called → local items merged into shared → real-time sync begins

**Leaving (member):**
1. Tap `離開` in header → confirm alert → `leave()` → back to local with snapshot of current items

**Dissolving (creator):**
1. Long press on status bar → alert `停止共享` → `deleteBlacklist` → clear meta → back to local

## Out of Scope

- Multiple blacklists per user
- Read-only member mode
- Blacklist naming
