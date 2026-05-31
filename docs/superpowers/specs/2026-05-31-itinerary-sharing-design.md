# Itinerary Sharing Design

**Date:** 2026-05-31  
**Status:** Approved

## Overview

Add real-time collaborative itinerary sharing to TourApp. Multiple users can view and edit the same trip simultaneously. No user accounts required — devices are identified by an anonymous UUID. Access is granted via a 6-digit invite code.

## Goals

- Allow a trip owner to share an itinerary with friends via a 6-digit code
- All members see changes in real time
- Prevent simultaneous edits to the same day via a lock mechanism
- Existing local trips are unaffected; sharing is opt-in

## Non-Goals

- User authentication / accounts
- Granular permissions (e.g. read-only members)
- Chat or comments
- Push notifications for changes

## Backend: Firebase Firestore

The user creates and owns a Firebase project (free Spark plan). API keys are stored in the app's `.env` file.

**Free tier limits (sufficient for friend-group usage):**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day

**New dependencies:**
- `@react-native-firebase/app`
- `@react-native-firebase/firestore`

## Device Identity

On first launch, the app generates a UUID `deviceId` and persists it in AsyncStorage. This ID represents the user across sessions. No login required.

## Data Model

### Firestore: `trips/{tripId}`

```ts
interface SharedTrip {
  id: string
  inviteCode: string          // 6-character alphanumeric, e.g. "A3K9F2"
  name: string
  days: number
  createdAt: string
  members: string[]           // deviceIds of all participants
  tripDays: SharedTripDay[]
}

interface SharedTripDay {
  dayIndex: number
  places: TripPlace[]         // same TripPlace type as local
  editingBy: string | null    // deviceId currently editing this day
  editingAt: number | null    // Unix timestamp of lock acquisition
}
```

Invite codes are stored in a separate lookup collection for fast resolution:

### Firestore: `inviteCodes/{code}`

```ts
{ tripId: string }
```

## Local vs Shared Trips

The existing `Trip` type gains one new field:

```ts
interface Trip {
  // ...existing fields unchanged...
  isShared: boolean    // false = local (AsyncStorage), true = shared (Firestore)
}
```

Local trips continue using AsyncStorage exactly as today. Shared trips are read from and written to Firestore. The Zustand store exposes both as a unified `trips` array — screens do not need to know which storage backend is used.

## State Management Changes

`useItineraryStore` is extended with:

```ts
// New state
sharedTrips: Trip[]
// Note: Firestore unsubscribe functions are stored in a module-level variable
// outside Zustand (not state) to avoid triggering re-renders:
//   const _listeners: Record<string, () => void> = {}

// New actions
shareTrip: (tripId: string) => Promise<string>        // returns inviteCode
joinTrip: (inviteCode: string) => Promise<void>
leaveTrip: (tripId: string) => Promise<void>
acquireDayLock: (tripId: string, dayIndex: number) => Promise<boolean>
releaseDayLock: (tripId: string, dayIndex: number) => Promise<void>
subscribeToSharedTrip: (tripId: string) => void
```

All existing write actions (`addPlaceToTrip`, `removePlaceFromTrip`, etc.) check `isShared` and route to Firestore instead of AsyncStorage when true.

## Locking Mechanism

**Acquiring a lock:**
When a user opens a day for editing (e.g. taps "+" or drag-handles appear), the app runs a Firestore transaction:
- If `editingBy` is `null` or `editingAt` is older than 30 seconds → set `editingBy: deviceId`, `editingAt: now`
- If locked by another device → return failure; show toast "OOO 正在編輯中"

**Holding a lock:**
While editing, the app refreshes `editingAt` every 10 seconds (keepalive) so the lock does not expire.

**Releasing a lock:**
On `useEffect` cleanup (screen unmount / navigation away), the app writes `editingBy: null, editingAt: null`.

**Stale lock timeout:** 30 seconds. If `editingAt` is more than 30 seconds old, any device may overwrite the lock. This handles app crashes and network drops.

## User-Facing Flows

### Sharing a local trip

1. Long-press a trip card in ItineraryListScreen → "分享行程"
2. App uploads the trip to Firestore, generates a 6-char invite code
3. A modal displays the code with a "複製" button
4. The local copy is replaced by the shared version (same `tripId`)

### Joining a shared trip

1. Tap "加入行程" button (top-right of ItineraryListScreen)
2. Enter the 6-digit code
3. App looks up `inviteCodes/{code}` → fetches trip → adds `deviceId` to `members`
4. Trip appears in the list; real-time listener starts

### Leaving a shared trip

1. Long-press trip card → "離開行程"
2. `deviceId` removed from `members`; local listener unsubscribed
3. Trip removed from local list (Firestore document remains for other members)

## UI Indicators

| Element | Indicator |
|---------|-----------|
| Trip card (shared) | 👥 icon on card |
| Trip detail header | "N 人協作中" subtitle |
| Day locked by others | 🔒 + "X 正在編輯" label; add/remove/sort buttons disabled |
| Day locked by self | Normal edit UI |

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Invalid invite code | Toast "找不到此行程" |
| Network offline during edit | Write queued by Firestore SDK; syncs on reconnect |
| Lock acquisition failed | Toast "OOO 正在編輯中，請稍後再試" |
| Trip deleted by owner | Members see toast "此行程已被刪除"，trip removed from list |

## Migration

- No forced migration. Existing local trips stay local.
- Sharing is opt-in via long-press → "分享行程".
- There is no "convert back to local" flow (keep it simple).

## Out of Scope for v1

- Offline-first conflict resolution (OT/CRDT)
- Push notifications for changes
- Trip ownership transfer
- Member management UI (kick members, see who joined)
