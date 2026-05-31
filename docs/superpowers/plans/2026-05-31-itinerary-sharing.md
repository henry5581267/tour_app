# Itinerary Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time collaborative trip sharing via Firebase Firestore, with anonymous device IDs and 6-character invite codes.

**Architecture:** Local trips remain in AsyncStorage unchanged. Shared trips live in Firestore and sync via `onSnapshot` listeners. Module-level maps track active listeners and shared trip state. Day-level locking uses Firestore transactions with a 30-second stale timeout to prevent simultaneous edits.

**Tech Stack:** `@react-native-firebase/app`, `@react-native-firebase/firestore`, Zustand (existing), AsyncStorage (existing)

---

## File Map

**New files:**
- `src/shared/firebase/config.ts` — Firebase import side-effect (no-op module)
- `src/shared/firebase/deviceId.ts` — generate/persist anonymous UUID
- `src/shared/firebase/tripsFirestore.ts` — all Firestore read/write operations
- `src/features/itinerary/components/ShareTripModal.tsx` — display invite code + copy button
- `src/features/itinerary/components/JoinTripModal.tsx` — enter invite code to join a trip
- `src/shared/firebase/__tests__/deviceId.test.ts`
- `src/shared/firebase/__tests__/tripsFirestore.test.ts`
- `__mocks__/@react-native-firebase/app.js`
- `__mocks__/@react-native-firebase/firestore.js`

**Modified files:**
- `android/build.gradle` — add Google Services classpath
- `android/app/build.gradle` — apply Google Services plugin
- `.env` — add Firebase config keys (values from Firebase console)
- `jest.config.js` — add Firebase mocks + update transformIgnorePatterns
- `src/shared/types/index.ts` — add `isShared: boolean` to Trip
- `src/shared/storage/tripsStorage.ts` — add `getSharedTripIds`/`saveSharedTripIds`; backward-compat `getTrips`
- `src/shared/storage/__tests__/tripsStorage.test.ts` — add `isShared` to fixtures + sharedTripIds tests
- `src/features/itinerary/store.ts` — extend with sharing/locking; module-level listener map
- `src/features/itinerary/screens/ItineraryListScreen.tsx` — share/join UI + shared badge
- `src/features/itinerary/components/DaySection.tsx` — locked day UI
- `src/features/itinerary/screens/ItineraryDetailScreen.tsx` — subscription + lock wiring

---

## Task 1: Firebase Android setup

**Files:**
- Modify: `android/build.gradle`
- Modify: `android/app/build.gradle`
- Modify: `.env`
- Create: `src/shared/firebase/config.ts`

**Manual steps — complete before writing any code:**
1. Go to https://console.firebase.google.com → create a new project (e.g. "TourApp")
2. Add an Android app with package name `com.tourapp`
3. Download `google-services.json` → place at `android/app/google-services.json`
4. In Firebase console: Firestore Database → Create database → choose **test mode**

- [ ] **Step 1: Add Google Services classpath to `android/build.gradle`**

Replace the `dependencies` block in `buildscript`:

```gradle
dependencies {
    classpath("com.android.tools.build:gradle")
    classpath("com.facebook.react:react-native-gradle-plugin")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
    classpath("com.google.gms:google-services:4.4.2")
}
```

- [ ] **Step 2: Apply Google Services plugin in `android/app/build.gradle`**

Add this line directly after `apply plugin: "com.facebook.react"`:

```gradle
apply plugin: "com.google.gms.google-services"
```

- [ ] **Step 3: Install Firebase npm packages**

```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 4: Add Firebase config to `.env`**

Append to `.env` (get values from Firebase console → Project settings → Your apps → SDK config):

```
FIREBASE_PROJECT_ID=your_project_id_here
```

(React Native Firebase reads `google-services.json` natively on Android; only `PROJECT_ID` is needed in `.env` for future reference.)

- [ ] **Step 5: Create `src/shared/firebase/config.ts`**

```ts
// Importing @react-native-firebase/app initialises the native Firebase SDK.
// This file is imported for its side-effect only.
import '@react-native-firebase/app'

export {}
```

- [ ] **Step 6: Import config in app entry point**

In `index.js` (root), add at the very top:

```ts
import './src/shared/firebase/config'
```

- [ ] **Step 7: Verify Android build still succeeds**

```bash
cd android && gradlew assembleDebug 2>&1 | tail -5
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 8: Commit**

```bash
git add android/build.gradle android/app/build.gradle .env src/shared/firebase/config.ts index.js
git commit -m "feat: add Firebase Android setup for trip sharing"
```

---

## Task 2: Jest mocks for Firebase + update jest config

**Files:**
- Create: `__mocks__/@react-native-firebase/app.js`
- Create: `__mocks__/@react-native-firebase/firestore.js`
- Modify: `jest.config.js`

- [ ] **Step 1: Create mock directory**

```bash
mkdir -p __mocks__/@react-native-firebase
```

- [ ] **Step 2: Create `__mocks__/@react-native-firebase/app.js`**

```js
module.exports = { default: {} }
```

- [ ] **Step 3: Create `__mocks__/@react-native-firebase/firestore.js`**

```js
const mockDocRef = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  onSnapshot: jest.fn(() => jest.fn()),
}

const mockCollectionRef = {
  doc: jest.fn(() => mockDocRef),
}

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
}

const mockFirestore = {
  collection: jest.fn(() => mockCollectionRef),
  batch: jest.fn(() => mockBatch),
  runTransaction: jest.fn(),
}

const firestore = jest.fn(() => mockFirestore)

firestore.FieldValue = {
  arrayUnion: jest.fn((...args) => ({ _type: 'arrayUnion', args })),
  arrayRemove: jest.fn((...args) => ({ _type: 'arrayRemove', args })),
}

// Expose internals for tests via (firestore as any).__mock*
firestore.__mockFirestore = mockFirestore
firestore.__mockDocRef = mockDocRef
firestore.__mockCollectionRef = mockCollectionRef
firestore.__mockBatch = mockBatch

module.exports = firestore
```

- [ ] **Step 4: Update `jest.config.js`**

```js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEach: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    '@react-native-async-storage/async-storage':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js',
    'react-native-draggable-flatlist': '<rootDir>/__mocks__/react-native-draggable-flatlist.js',
    '@react-native-firebase/app': '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '@react-native-firebase/firestore': '<rootDir>/__mocks__/@react-native-firebase/firestore.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|@react-native-firebase|zustand)/)',
  ],
}
```

**Note:** The key `setupFilesAfterEach` must be `setupFilesAfterEnv` — fix it to:
```js
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
```

- [ ] **Step 5: Run existing tests to verify nothing broke**

```bash
npx jest --passWithNoTests 2>&1 | tail -10
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add __mocks__/ jest.config.js
git commit -m "test: add Firebase jest mocks and update transformIgnorePatterns"
```

---

## Task 3: Update Trip type + storage backward compat

**Files:**
- Modify: `src/shared/types/index.ts`
- Modify: `src/shared/storage/tripsStorage.ts`
- Modify: `src/shared/storage/__tests__/tripsStorage.test.ts`

- [ ] **Step 1: Add `isShared` to `Trip` in `src/shared/types/index.ts`**

Replace the `Trip` interface:

```ts
export interface Trip {
  id: string
  name: string
  days: number
  createdAt: string
  isShared: boolean
  tripDays: TripDay[]
}
```

- [ ] **Step 2: Update `getTrips` in `src/shared/storage/tripsStorage.ts` for backward compat**

Replace the existing `getTrips` function:

```ts
export async function getTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return []
  const trips = JSON.parse(raw) as Trip[]
  return trips.map(t => ({ ...t, isShared: t.isShared ?? false }))
}
```

- [ ] **Step 3: Append `sharedTripIds` helpers to `src/shared/storage/tripsStorage.ts`**

```ts
const SHARED_IDS_KEY = '@tourapp/sharedTripIds'

export async function getSharedTripIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SHARED_IDS_KEY)
  return raw ? (JSON.parse(raw) as string[]) : []
}

export async function saveSharedTripIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SHARED_IDS_KEY, JSON.stringify(ids))
}
```

- [ ] **Step 4: Update `src/shared/storage/__tests__/tripsStorage.test.ts`**

Replace the `trip1` and `trip2` fixtures and add `isShared`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTrips, saveTrips, addTrip, updateTrip, deleteTrip, getSharedTripIds, saveSharedTripIds } from '../tripsStorage'
import { Trip } from '../../types'

const trip1: Trip = {
  id: '1', name: 'Tokyo Trip', days: 3,
  createdAt: '2026-01-01T00:00:00Z',
  isShared: false,
  tripDays: [{ dayIndex: 0, places: [] }],
}
const trip2: Trip = { ...trip1, id: '2', name: 'Osaka Trip' }

beforeEach(() => (AsyncStorage as any).clear())

describe('tripsStorage', () => {
  it('getTrips returns [] when nothing saved', async () => {
    expect(await getTrips()).toEqual([])
  })

  it('saveTrips and getTrips round-trip', async () => {
    await saveTrips([trip1])
    expect(await getTrips()).toEqual([trip1])
  })

  it('addTrip appends to existing trips', async () => {
    await saveTrips([trip1])
    await addTrip(trip2)
    const trips = await getTrips()
    expect(trips).toHaveLength(2)
    expect(trips[1].id).toBe('2')
  })

  it('updateTrip replaces matching trip', async () => {
    await saveTrips([trip1])
    await updateTrip({ ...trip1, name: 'Updated' })
    expect((await getTrips())[0].name).toBe('Updated')
  })

  it('deleteTrip removes matching trip', async () => {
    await saveTrips([trip1, trip2])
    await deleteTrip('1')
    const trips = await getTrips()
    expect(trips).toHaveLength(1)
    expect(trips[0].id).toBe('2')
  })

  it('getTrips fills isShared:false for legacy trips missing the field', async () => {
    const legacy = [{ id: '99', name: 'Old', days: 1, createdAt: '2025-01-01T00:00:00Z', tripDays: [] }]
    await AsyncStorage.setItem('trips', JSON.stringify(legacy))
    expect((await getTrips())[0].isShared).toBe(false)
  })
})

describe('sharedTripIds', () => {
  it('returns [] when nothing saved', async () => {
    expect(await getSharedTripIds()).toEqual([])
  })

  it('round-trips saved IDs', async () => {
    await saveSharedTripIds(['trip1', 'trip2'])
    expect(await getSharedTripIds()).toEqual(['trip1', 'trip2'])
  })

  it('overwrites previous list', async () => {
    await saveSharedTripIds(['trip1'])
    await saveSharedTripIds(['trip2', 'trip3'])
    expect(await getSharedTripIds()).toEqual(['trip2', 'trip3'])
  })
})
```

- [ ] **Step 5: Run tests**

```bash
npx jest src/shared/storage/__tests__/tripsStorage.test.ts --verbose
```

Expected: 9 tests pass.

- [ ] **Step 6: Fix TypeScript errors from the new required `isShared` field**

In `src/features/itinerary/store.ts`, update the `createTrip` trip literal to add `isShared: false`:

```ts
const trip: Trip = {
  id: generateId(),
  name,
  days,
  createdAt: new Date().toISOString(),
  isShared: false,
  tripDays: Array.from({ length: days }, (_, i) => ({ dayIndex: i, places: [] })),
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/shared/types/index.ts src/shared/storage/tripsStorage.ts src/shared/storage/__tests__/tripsStorage.test.ts src/features/itinerary/store.ts
git commit -m "feat: add isShared to Trip type with backward-compat migration and sharedTripIds storage"
```

---

## Task 4: Device ID module

**Files:**
- Create: `src/shared/firebase/deviceId.ts`
- Create: `src/shared/firebase/__tests__/deviceId.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/shared/firebase/__tests__/deviceId.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const DEVICE_ID_KEY = '@tourapp/deviceId'

beforeEach(async () => {
  jest.resetModules()
  await (AsyncStorage as any).clear()
})

describe('getDeviceId', () => {
  it('generates a UUID v4 string on first call and persists it', async () => {
    const { getDeviceId } = require('../deviceId')
    const id = await getDeviceId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(await AsyncStorage.getItem(DEVICE_ID_KEY)).toBe(id)
  })

  it('returns the same ID on repeated calls within the same session', async () => {
    const { getDeviceId } = require('../deviceId')
    const id1 = await getDeviceId()
    const id2 = await getDeviceId()
    expect(id1).toBe(id2)
  })

  it('returns persisted ID from a previous session', async () => {
    await AsyncStorage.setItem(DEVICE_ID_KEY, 'saved-device-id')
    const { getDeviceId } = require('../deviceId')
    expect(await getDeviceId()).toBe('saved-device-id')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/shared/firebase/__tests__/deviceId.test.ts --verbose
```

Expected: FAIL — `Cannot find module '../deviceId'`

- [ ] **Step 3: Implement `src/shared/firebase/deviceId.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = '@tourapp/deviceId'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

let _cached: string | null = null

export async function getDeviceId(): Promise<string> {
  if (_cached) return _cached
  const existing = await AsyncStorage.getItem(KEY)
  if (existing) { _cached = existing; return _cached }
  const id = generateUUID()
  await AsyncStorage.setItem(KEY, id)
  _cached = id
  return _cached
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/shared/firebase/__tests__/deviceId.test.ts --verbose
```

Expected: 3 tests pass. (`jest.resetModules()` in `beforeEach` clears the module-level `_cached` between tests.)

- [ ] **Step 5: Commit**

```bash
git add src/shared/firebase/deviceId.ts src/shared/firebase/__tests__/deviceId.test.ts
git commit -m "feat: add anonymous device ID generation and persistence"
```

---

## Task 5: Firestore helper module

**Files:**
- Create: `src/shared/firebase/tripsFirestore.ts`
- Create: `src/shared/firebase/__tests__/tripsFirestore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/firebase/__tests__/tripsFirestore.test.ts`:

```ts
import firestore from '@react-native-firebase/firestore'
import { generateInviteCode, uploadTrip, fetchTripByCode } from '../tripsFirestore'
import { Trip } from '../../types'

const db = (firestore as any).__mockFirestore
const docRef = (firestore as any).__mockDocRef
const batch = (firestore as any).__mockBatch

const baseTrip: Trip = {
  id: 'trip-1',
  name: 'Test Trip',
  days: 2,
  createdAt: '2026-05-31T00:00:00Z',
  isShared: false,
  tripDays: [
    { dayIndex: 0, places: [] },
    { dayIndex: 1, places: [] },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  batch.commit.mockResolvedValue(undefined)
})

describe('generateInviteCode', () => {
  it('generates a 6-character uppercase alphanumeric code', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^[A-Z2-9]+$/)
  })

  it('generates unique codes across 100 calls', () => {
    const codes = new Set(Array.from({ length: 100 }, generateInviteCode))
    expect(codes.size).toBeGreaterThan(95)
  })
})

describe('uploadTrip', () => {
  it('writes trip document and inviteCode document in a batch', async () => {
    const code = await uploadTrip(baseTrip, 'device-abc')
    expect(code).toHaveLength(6)
    expect(db.batch).toHaveBeenCalled()
    expect(batch.set).toHaveBeenCalledTimes(2)
    expect(batch.commit).toHaveBeenCalled()
  })
})

describe('fetchTripByCode', () => {
  it('throws when invite code does not exist in Firestore', async () => {
    docRef.get.mockResolvedValueOnce({ exists: false })
    await expect(fetchTripByCode('BADCOD')).rejects.toThrow('找不到此行程')
  })

  it('returns trip data when invite code exists', async () => {
    docRef.get
      .mockResolvedValueOnce({ exists: true, data: () => ({ tripId: 'trip-1' }) })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          ...baseTrip,
          isShared: true,
          members: ['device-abc'],
          inviteCode: 'A1B2C3',
          tripDays: baseTrip.tripDays.map(d => ({ ...d, editingBy: null, editingAt: null })),
        }),
      })
    const trip = await fetchTripByCode('A1B2C3')
    expect(trip.id).toBe('trip-1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/shared/firebase/__tests__/tripsFirestore.test.ts --verbose
```

Expected: FAIL — `Cannot find module '../tripsFirestore'`

- [ ] **Step 3: Implement `src/shared/firebase/tripsFirestore.ts`**

```ts
import firestore from '@react-native-firebase/firestore'
import { Trip, TripPlace } from '../types'

export interface FirestoreTripDay {
  dayIndex: number
  places: TripPlace[]
  editingBy: string | null
  editingAt: number | null
}

export interface FirestoreTrip {
  id: string
  inviteCode: string
  name: string
  days: number
  createdAt: string
  isShared: true
  members: string[]
  tripDays: FirestoreTripDay[]
}

const TRIPS = 'trips'
const INVITE_CODES = 'inviteCodes'
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode(): string {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export async function uploadTrip(trip: Trip, deviceId: string): Promise<string> {
  const code = generateInviteCode()
  const db = firestore()
  const batch = db.batch()
  const firestoreTrip: FirestoreTrip = {
    id: trip.id,
    inviteCode: code,
    name: trip.name,
    days: trip.days,
    createdAt: trip.createdAt,
    isShared: true,
    members: [deviceId],
    tripDays: trip.tripDays.map(d => ({
      dayIndex: d.dayIndex,
      places: d.places,
      editingBy: null,
      editingAt: null,
    })),
  }
  batch.set(db.collection(TRIPS).doc(trip.id), firestoreTrip)
  batch.set(db.collection(INVITE_CODES).doc(code), { tripId: trip.id })
  await batch.commit()
  return code
}

export async function fetchTripByCode(code: string): Promise<FirestoreTrip> {
  const db = firestore()
  const codeSnap = await db.collection(INVITE_CODES).doc(code).get()
  if (!codeSnap.exists) throw new Error('找不到此行程')
  const { tripId } = (codeSnap as any).data() as { tripId: string }
  const tripSnap = await db.collection(TRIPS).doc(tripId).get()
  if (!tripSnap.exists) throw new Error('找不到此行程')
  return (tripSnap as any).data() as FirestoreTrip
}

export async function addMember(tripId: string, deviceId: string): Promise<void> {
  await firestore()
    .collection(TRIPS)
    .doc(tripId)
    .update({ members: (firestore as any).FieldValue.arrayUnion(deviceId) })
}

export async function removeMember(tripId: string, deviceId: string): Promise<void> {
  await firestore()
    .collection(TRIPS)
    .doc(tripId)
    .update({ members: (firestore as any).FieldValue.arrayRemove(deviceId) })
}

// Preserves existing editingBy/editingAt per day while updating places and name.
export async function updateSharedTrip(trip: Trip): Promise<void> {
  const ref = firestore().collection(TRIPS).doc(trip.id)
  await (firestore() as any).runTransaction(async (tx: any) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return
    const current = snap.data() as FirestoreTrip
    const tripDays: FirestoreTripDay[] = trip.tripDays.map(d => {
      const existing = current.tripDays.find(cd => cd.dayIndex === d.dayIndex)
      return {
        dayIndex: d.dayIndex,
        places: d.places,
        editingBy: existing?.editingBy ?? null,
        editingAt: existing?.editingAt ?? null,
      }
    })
    tx.update(ref, { name: trip.name, tripDays })
  })
}

export function subscribeToTrip(
  tripId: string,
  onUpdate: (trip: FirestoreTrip) => void,
): () => void {
  return (firestore().collection(TRIPS).doc(tripId) as any).onSnapshot((snap: any) => {
    if (snap.exists) onUpdate(snap.data() as FirestoreTrip)
  })
}

export async function acquireDayLockTransaction(
  tripId: string,
  dayIndex: number,
  deviceId: string,
): Promise<boolean> {
  const ref = firestore().collection(TRIPS).doc(tripId)
  return (firestore() as any).runTransaction(async (tx: any) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return false
    const data = snap.data() as FirestoreTrip
    const days = [...data.tripDays]
    const day = days[dayIndex]
    if (!day) return false
    const now = Date.now()
    const isStale = !day.editingAt || now - day.editingAt > 30_000
    if (day.editingBy && day.editingBy !== deviceId && !isStale) return false
    days[dayIndex] = { ...day, editingBy: deviceId, editingAt: now }
    tx.update(ref, { tripDays: days })
    return true
  })
}

export async function releaseDayLockInFirestore(
  tripId: string,
  dayIndex: number,
  deviceId: string,
): Promise<void> {
  const ref = firestore().collection(TRIPS).doc(tripId)
  await (firestore() as any).runTransaction(async (tx: any) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return
    const data = snap.data() as FirestoreTrip
    const days = [...data.tripDays]
    if (days[dayIndex]?.editingBy !== deviceId) return
    days[dayIndex] = { ...days[dayIndex], editingBy: null, editingAt: null }
    tx.update(ref, { tripDays: days })
  })
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest src/shared/firebase/__tests__/tripsFirestore.test.ts --verbose
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/firebase/tripsFirestore.ts src/shared/firebase/__tests__/tripsFirestore.test.ts
git commit -m "feat: add Firestore helpers for shared trip CRUD and day-level locking"
```

---

## Task 6: Extend Zustand store with sharing and locking

**Files:**
- Modify: `src/features/itinerary/store.ts`

- [ ] **Step 1: Replace the full content of `src/features/itinerary/store.ts`**

```ts
import { create } from 'zustand'
import { Trip, TripPlace } from '../../shared/types'
import {
  getTrips, addTrip, updateTrip, deleteTrip,
  getSharedTripIds, saveSharedTripIds,
} from '../../shared/storage/tripsStorage'
import { sortByRoute } from './utils/sortByRoute'
import { getDeviceId } from '../../shared/firebase/deviceId'
import {
  uploadTrip, fetchTripByCode, addMember, removeMember,
  updateSharedTrip, subscribeToTrip,
  acquireDayLockTransaction, releaseDayLockInFirestore,
  FirestoreTrip,
} from '../../shared/firebase/tripsFirestore'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Outside Zustand to avoid re-renders on reference changes
const _listeners: Record<string, () => void> = {}
const _localTrips: Trip[] = []
const _sharedTrips = new Map<string, Trip>()

function _merged(): Trip[] {
  return [..._localTrips, ..._sharedTrips.values()]
}

interface DayLock { lockedBy: string; lockedAt: number }

interface ItineraryState {
  trips: Trip[]
  sortingDayKey: string | null
  dayLocks: Record<string, DayLock | null>
  loadTrips: () => Promise<void>
  createTrip: (name: string, days: number) => Promise<Trip>
  removeTrip: (id: string) => Promise<void>
  addPlaceToTrip: (tripId: string, dayIndex: number, place: TripPlace) => Promise<void>
  removePlaceFromTrip: (tripId: string, dayIndex: number, placeId: string) => Promise<void>
  reorderDay: (tripId: string, dayIndex: number, newOrder: TripPlace[]) => Promise<void>
  movePlaceToDay: (tripId: string, placeId: string, fromDay: number, toDay: number) => Promise<void>
  autoSortDay: (tripId: string, dayIndex: number) => Promise<void>
  renameTrip: (tripId: string, newName: string) => Promise<void>
  shareTrip: (tripId: string) => Promise<string>
  joinTrip: (inviteCode: string) => Promise<void>
  leaveTrip: (tripId: string) => Promise<void>
  subscribeToSharedTrip: (tripId: string) => void
  acquireDayLock: (tripId: string, dayIndex: number) => Promise<boolean>
  releaseDayLock: (tripId: string, dayIndex: number) => Promise<void>
  releaseAllLocksForTrip: (tripId: string) => Promise<void>
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  trips: [],
  sortingDayKey: null,
  dayLocks: {},

  loadTrips: async () => {
    const local = await getTrips()
    _localTrips.splice(0, _localTrips.length, ...local)
    const sharedIds = await getSharedTripIds()
    for (const id of sharedIds) get().subscribeToSharedTrip(id)
    set({ trips: _merged() })
  },

  createTrip: async (name, days) => {
    const trip: Trip = {
      id: generateId(),
      name,
      days,
      createdAt: new Date().toISOString(),
      isShared: false,
      tripDays: Array.from({ length: days }, (_, i) => ({ dayIndex: i, places: [] })),
    }
    await addTrip(trip)
    _localTrips.push(trip)
    set({ trips: _merged() })
    return trip
  },

  removeTrip: async (id) => {
    const trip = get().trips.find(t => t.id === id)
    if (!trip) return
    if (trip.isShared) { await get().leaveTrip(id); return }
    await deleteTrip(id)
    const idx = _localTrips.findIndex(t => t.id === id)
    if (idx >= 0) _localTrips.splice(idx, 1)
    set({ trips: _merged() })
  },

  addPlaceToTrip: async (tripId, dayIndex, place) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const updated: Trip = {
      ...trip,
      tripDays: trip.tripDays.map(d =>
        d.dayIndex === dayIndex
          ? { ...d, places: [...d.places, { ...place, id: generateId() }] }
          : d
      ),
    }
    if (trip.isShared) {
      await updateSharedTrip(updated)
      // onSnapshot will update _sharedTrips and re-set state
    } else {
      await updateTrip(updated)
      const idx = _localTrips.findIndex(t => t.id === tripId)
      if (idx >= 0) _localTrips[idx] = updated
      set({ trips: _merged() })
    }
  },

  removePlaceFromTrip: async (tripId, dayIndex, placeId) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const updated: Trip = {
      ...trip,
      tripDays: trip.tripDays.map(d =>
        d.dayIndex === dayIndex
          ? { ...d, places: d.places.filter(p => p.id !== placeId) }
          : d
      ),
    }
    if (trip.isShared) {
      await updateSharedTrip(updated)
    } else {
      await updateTrip(updated)
      const idx = _localTrips.findIndex(t => t.id === tripId)
      if (idx >= 0) _localTrips[idx] = updated
      set({ trips: _merged() })
    }
  },

  reorderDay: async (tripId, dayIndex, newOrder) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const updated: Trip = {
      ...trip,
      tripDays: trip.tripDays.map(d =>
        d.dayIndex === dayIndex ? { ...d, places: newOrder } : d
      ),
    }
    if (trip.isShared) {
      await updateSharedTrip(updated)
    } else {
      await updateTrip(updated)
      const idx = _localTrips.findIndex(t => t.id === tripId)
      if (idx >= 0) _localTrips[idx] = updated
      set({ trips: _merged() })
    }
  },

  movePlaceToDay: async (tripId, placeId, fromDay, toDay) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const fromDayData = trip.tripDays.find(d => d.dayIndex === fromDay)
    const movingPlace = fromDayData?.places.find(p => p.id === placeId)
    if (!movingPlace) return
    const updated: Trip = {
      ...trip,
      tripDays: trip.tripDays.map(d => {
        if (d.dayIndex === fromDay) return { ...d, places: d.places.filter(p => p.id !== placeId) }
        if (d.dayIndex === toDay) return { ...d, places: [...d.places, movingPlace] }
        return d
      }),
    }
    if (trip.isShared) {
      await updateSharedTrip(updated)
    } else {
      await updateTrip(updated)
      const idx = _localTrips.findIndex(t => t.id === tripId)
      if (idx >= 0) _localTrips[idx] = updated
      set({ trips: _merged() })
    }
  },

  autoSortDay: async (tripId, dayIndex) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const day = trip.tripDays.find(d => d.dayIndex === dayIndex)
    if (!day || day.places.length < 2) return
    const key = `${tripId}-${dayIndex}`
    set({ sortingDayKey: key })
    try {
      const sorted = await sortByRoute(day.places)
      await get().reorderDay(tripId, dayIndex, sorted)
    } finally {
      set({ sortingDayKey: null })
    }
  },

  renameTrip: async (tripId, newName) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const updated: Trip = { ...trip, name: newName }
    if (trip.isShared) {
      await updateSharedTrip(updated)
    } else {
      await updateTrip(updated)
      const idx = _localTrips.findIndex(t => t.id === tripId)
      if (idx >= 0) _localTrips[idx] = updated
      set({ trips: _merged() })
    }
  },

  shareTrip: async (tripId) => {
    const deviceId = await getDeviceId()
    const trip = _localTrips.find(t => t.id === tripId)
    if (!trip) throw new Error('Trip not found')
    const code = await uploadTrip(trip, deviceId)
    await deleteTrip(tripId)
    const idx = _localTrips.findIndex(t => t.id === tripId)
    if (idx >= 0) _localTrips.splice(idx, 1)
    const sharedIds = await getSharedTripIds()
    await saveSharedTripIds([...sharedIds, tripId])
    get().subscribeToSharedTrip(tripId)
    set({ trips: _merged() })
    return code
  },

  joinTrip: async (inviteCode) => {
    const deviceId = await getDeviceId()
    const ft = await fetchTripByCode(inviteCode)
    if (_listeners[ft.id]) return  // already joined
    await addMember(ft.id, deviceId)
    const sharedIds = await getSharedTripIds()
    if (!sharedIds.includes(ft.id)) await saveSharedTripIds([...sharedIds, ft.id])
    get().subscribeToSharedTrip(ft.id)
  },

  leaveTrip: async (tripId) => {
    const deviceId = await getDeviceId()
    await removeMember(tripId, deviceId)
    const sharedIds = await getSharedTripIds()
    await saveSharedTripIds(sharedIds.filter(id => id !== tripId))
    if (_listeners[tripId]) { _listeners[tripId](); delete _listeners[tripId] }
    _sharedTrips.delete(tripId)
    set({ trips: _merged() })
  },

  subscribeToSharedTrip: (tripId) => {
    if (_listeners[tripId]) return
    const unsub = subscribeToTrip(tripId, (ft: FirestoreTrip) => {
      const trip: Trip = {
        id: ft.id,
        name: ft.name,
        days: ft.days,
        createdAt: ft.createdAt,
        isShared: true,
        tripDays: ft.tripDays.map(d => ({ dayIndex: d.dayIndex, places: d.places })),
      }
      const newLocks: Record<string, DayLock | null> = {}
      for (const d of ft.tripDays) {
        newLocks[`${tripId}-${d.dayIndex}`] = d.editingBy
          ? { lockedBy: d.editingBy, lockedAt: d.editingAt! }
          : null
      }
      _sharedTrips.set(tripId, trip)
      set(s => ({ trips: _merged(), dayLocks: { ...s.dayLocks, ...newLocks } }))
    })
    _listeners[tripId] = unsub
  },

  acquireDayLock: async (tripId, dayIndex) => {
    const deviceId = await getDeviceId()
    return acquireDayLockTransaction(tripId, dayIndex, deviceId)
  },

  releaseDayLock: async (tripId, dayIndex) => {
    const deviceId = await getDeviceId()
    await releaseDayLockInFirestore(tripId, dayIndex, deviceId)
  },

  releaseAllLocksForTrip: async (tripId) => {
    const deviceId = await getDeviceId()
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    for (const day of trip.tripDays) {
      const lock = get().dayLocks[`${tripId}-${day.dayIndex}`]
      if (lock?.lockedBy === deviceId) {
        await releaseDayLockInFirestore(tripId, day.dayIndex, deviceId).catch(() => {})
      }
    }
  },
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx jest --passWithNoTests 2>&1 | tail -10
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/itinerary/store.ts
git commit -m "feat: extend Zustand store with trip sharing and day-level locking"
```

---

## Task 7: ShareTripModal and JoinTripModal components

**Files:**
- Create: `src/features/itinerary/components/ShareTripModal.tsx`
- Create: `src/features/itinerary/components/JoinTripModal.tsx`

- [ ] **Step 1: Create `src/features/itinerary/components/ShareTripModal.tsx`**

```tsx
import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Clipboard, Alert } from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  visible: boolean
  inviteCode: string
  onClose: () => void
}

export function ShareTripModal({ visible, inviteCode, onClose }: Props) {
  const { colors } = useTheme()

  const handleCopy = () => {
    Clipboard.setString(inviteCode)
    Alert.alert('已複製', '邀請碼已複製到剪貼簿')
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>分享行程</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            將邀請碼傳給朋友，讓他們加入行程共同編輯
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.code, { color: colors.primary }]}>{inviteCode}</Text>
          </View>
          <View style={styles.btns}>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.primary }]} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>複製邀請碼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>關閉</Text>
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
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  codeBox: { borderRadius: 12, borderWidth: 1.5, paddingVertical: 20, alignItems: 'center', marginBottom: 24 },
  code: { fontSize: 36, fontWeight: '800', letterSpacing: 8 },
  btns: { gap: 12 },
  copyBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  copyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { paddingVertical: 10, alignItems: 'center' },
  closeBtnText: { fontSize: 15 },
})
```

- [ ] **Step 2: Create `src/features/itinerary/components/JoinTripModal.tsx`**

```tsx
import React, { useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useItineraryStore } from '../store'

interface Props {
  visible: boolean
  onClose: () => void
}

export function JoinTripModal({ visible, onClose }: Props) {
  const { colors } = useTheme()
  const joinTrip = useItineraryStore(s => s.joinTrip)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = code.trim().length === 6 && !loading

  const handleJoin = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await joinTrip(code.trim().toUpperCase())
      setCode('')
      onClose()
    } catch {
      Alert.alert('加入失敗', '找不到此行程，請確認邀請碼是否正確')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>加入行程</Text>
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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/itinerary/components/ShareTripModal.tsx src/features/itinerary/components/JoinTripModal.tsx
git commit -m "feat: add ShareTripModal and JoinTripModal components"
```

---

## Task 8: ItineraryListScreen — share/join UI

**Files:**
- Modify: `src/features/itinerary/screens/ItineraryListScreen.tsx`

- [ ] **Step 1: Replace the full content of `src/features/itinerary/screens/ItineraryListScreen.tsx`**

```tsx
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  FlatList, Text, TouchableOpacity, View,
  StyleSheet, Alert, Modal, TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList, Trip } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { EmptyState } from '../../../shared/components/EmptyState'
import { CreateTripModal } from '../components/CreateTripModal'
import { ShareTripModal } from '../components/ShareTripModal'
import { JoinTripModal } from '../components/JoinTripModal'
import { useTheme } from '../../../shared/theme/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>

export function ItineraryListScreen() {
  const navigation = useNavigation<Nav>()
  const { colors } = useTheme()
  const trips = useItineraryStore(s => s.trips)
  const createTrip = useItineraryStore(s => s.createTrip)
  const removeTrip = useItineraryStore(s => s.removeTrip)
  const renameTrip = useItineraryStore(s => s.renameTrip)
  const shareTrip = useItineraryStore(s => s.shareTrip)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Trip | null>(null)
  const [renameText, setRenameText] = useState('')
  const [shareCode, setShareCode] = useState<string | null>(null)

  const handleLongPress = (item: Trip) => {
    Alert.alert(item.name, '', [
      {
        text: item.isShared ? '顯示邀請碼' : '分享行程',
        onPress: () => handleShare(item),
      },
      {
        text: '更名',
        onPress: () => { setRenameText(item.name); setRenameTarget(item) },
      },
      {
        text: item.isShared ? '離開行程' : '刪除',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            item.isShared ? '離開行程' : '刪除行程',
            item.isShared ? `確定離開「${item.name}」？` : `確定刪除「${item.name}」？`,
            [
              { text: '取消', style: 'cancel' },
              { text: item.isShared ? '離開' : '刪除', style: 'destructive', onPress: () => removeTrip(item.id) },
            ]
          ),
      },
      { text: '取消', style: 'cancel' },
    ])
  }

  const handleShare = async (item: Trip) => {
    if (item.isShared) {
      // Trip is already shared — re-upload is the v1 workaround to get a new code
      Alert.alert('已是共享行程', '此行程已在共享中，請透過「分享行程」流程取得新邀請碼')
      return
    }
    try {
      const code = await shareTrip(item.id)
      setShareCode(code)
    } catch {
      Alert.alert('分享失敗', '請確認網路連線後再試')
    }
  }

  const handleRename = async () => {
    if (!renameTarget || !renameText.trim()) return
    await renameTrip(renameTarget.id, renameText.trim())
    setRenameTarget(null)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {trips.length === 0 ? (
        <EmptyState message="尚無行程" subtext="點擊 + 建立第一個旅遊行程" />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ItineraryDetail', { tripId: item.id })}
              onLongPress={() => handleLongPress(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.tripName, { color: colors.text }]}>{item.name}</Text>
                {item.isShared && (
                  <View style={[styles.sharedBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.sharedBadgeText, { color: colors.primary }]}>👥 共享</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tripMeta, { color: colors.textSecondary }]}>
                {item.days} 天 · {item.tripDays.reduce((n, d) => n + d.places.length, 0)} 個地點
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowJoin(true)}
        >
          <Text style={[styles.joinBtnText, { color: colors.primary }]}>加入行程</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <CreateTripModal visible={showCreate} onClose={() => setShowCreate(false)} onCreate={async (name, days) => { await createTrip(name, days); setShowCreate(false) }} />
      <JoinTripModal visible={showJoin} onClose={() => setShowJoin(false)} />
      <ShareTripModal visible={!!shareCode} inviteCode={shareCode ?? ''} onClose={() => setShareCode(null)} />

      <Modal visible={!!renameTarget} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <View style={styles.renameOverlay}>
          <View style={[styles.renameSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.renameTitle, { color: colors.text }]}>更名行程</Text>
            <TextInput
              style={[styles.renameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              placeholder="輸入新名稱"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.renameBtns}>
              <TouchableOpacity style={styles.renameCancelBtn} onPress={() => setRenameTarget(null)}>
                <Text style={[styles.renameCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameConfirmBtn, { backgroundColor: renameText.trim() ? colors.primary : colors.surfaceSecondary }]}
                onPress={handleRename}
                disabled={!renameText.trim()}
              >
                <Text style={[styles.renameConfirmText, { color: renameText.trim() ? '#fff' : colors.textTertiary }]}>確定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tripName: { fontSize: 17, fontWeight: '700', flex: 1 },
  sharedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sharedBadgeText: { fontSize: 12, fontWeight: '600' },
  tripMeta: { fontSize: 13, marginTop: 4 },
  fabRow: { position: 'absolute', right: 24, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  joinBtn: {
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  joinBtnText: { fontSize: 14, fontWeight: '700' },
  fab: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  renameOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  renameSheet: { width: '100%', borderRadius: 20, padding: 24 },
  renameTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  renameInput: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 20 },
  renameBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  renameCancelBtn: { padding: 10 },
  renameCancelText: { fontSize: 15 },
  renameConfirmBtn: { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  renameConfirmText: { fontWeight: '700', fontSize: 15 },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/itinerary/screens/ItineraryListScreen.tsx
git commit -m "feat: add share/join trip UI to ItineraryListScreen"
```

---

## Task 9: DaySection — lock UI

**Files:**
- Modify: `src/features/itinerary/components/DaySection.tsx`

- [ ] **Step 1: Replace the full content of `src/features/itinerary/components/DaySection.tsx`**

```tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { TripDay, TripPlace } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { confirmDelete } from '../../../shared/components/ConfirmDialog'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  day: TripDay
  travelTimes: Record<number, string>
  isSorting?: boolean
  lockedBy?: string          // deviceId of the lock holder; undefined = no lock
  isMyLock?: boolean         // true when this device holds the lock
  onReorder: (newOrder: TripPlace[]) => void
  onDelete: (placeId: string) => void
  onAutoSort: () => void
  onAddManual: () => void | Promise<void>
}

export function DaySection({
  day, travelTimes, isSorting, lockedBy, isMyLock,
  onReorder, onDelete, onAutoSort, onAddManual,
}: Props) {
  const { colors } = useTheme()
  const isLocked = !!lockedBy && !isMyLock

  const moveUp = (idx: number) => {
    if (idx === 0 || isLocked) return
    const o = [...day.places]
    ;[o[idx - 1], o[idx]] = [o[idx], o[idx - 1]]
    onReorder(o)
  }

  const moveDown = (idx: number) => {
    if (idx === day.places.length - 1 || isLocked) return
    const o = [...day.places]
    ;[o[idx], o[idx + 1]] = [o[idx + 1], o[idx]]
    onReorder(o)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.dayTitle, { color: colors.text }]}>第 {day.dayIndex + 1} 天</Text>
        <View style={styles.headerActions}>
          {isLocked ? (
            <View style={[styles.lockBadge, { backgroundColor: colors.danger + '22' }]}>
              <Text style={[styles.lockText, { color: colors.danger }]}>🔒 正在編輯中</Text>
            </View>
          ) : (
            <>
              {day.places.length > 1 && (
                <TouchableOpacity
                  style={[styles.sortBtn, { backgroundColor: isSorting ? colors.primary + '33' : colors.surfaceSecondary }]}
                  onPress={onAutoSort}
                  disabled={isSorting}
                >
                  <Text style={[styles.sortText, { color: colors.primary }]}>
                    {isSorting ? '排序中…' : '優化路線'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.addManualBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => onAddManual()}
              >
                <Text style={[styles.addManualText, { color: '#10b981' }]}>+ 新增</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {day.places.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>尚未加入地點</Text>
      ) : (
        day.places.map((place, idx) => (
          <View key={place.id}>
            <View style={[styles.placeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.orderBtns}>
                <TouchableOpacity
                  style={[styles.orderBtn, { backgroundColor: colors.surfaceSecondary }, (idx === 0 || isLocked) && styles.orderBtnDisabled]}
                  onPress={() => moveUp(idx)}
                  disabled={idx === 0 || isLocked}
                >
                  <Text style={[styles.orderBtnText, { color: colors.text }]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderBtn, { backgroundColor: colors.surfaceSecondary }, (idx === day.places.length - 1 || isLocked) && styles.orderBtnDisabled]}
                  onPress={() => moveDown(idx)}
                  disabled={idx === day.places.length - 1 || isLocked}
                >
                  <Text style={[styles.orderBtnText, { color: colors.text }]}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.placeInfo}>
                <CategoryBadge category={place.category} />
                <Text style={[styles.placeName, { color: colors.text }]}>{place.name}</Text>
                <Text style={[styles.placeAddr, { color: colors.textSecondary }]} numberOfLines={1}>{place.address}</Text>
              </View>
              {!isLocked && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmDelete('移除地點', `確定移除「${place.name}」？`, () => onDelete(place.id))}
                >
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {travelTimes[idx] ? (
              <View style={styles.travelRow}>
                <Text style={[styles.travelText, { color: colors.textTertiary }]}>🚶 {travelTimes[idx]}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dayTitle: { fontSize: 16, fontWeight: '800' },
  lockBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  lockText: { fontSize: 12, fontWeight: '700' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sortText: { fontSize: 12, fontWeight: '700' },
  addManualBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addManualText: { fontSize: 12, fontWeight: '700' },
  empty: { paddingHorizontal: 16, fontSize: 13, paddingBottom: 8 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 6,
    borderRadius: 12, padding: 12, borderWidth: 1,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  orderBtns: { flexDirection: 'column', marginRight: 10, gap: 2 },
  orderBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  orderBtnDisabled: { opacity: 0.3 },
  orderBtnText: { fontSize: 12 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  placeAddr: { fontSize: 12, marginTop: 2 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  deleteBtnText: { fontSize: 14, fontWeight: '700' },
  travelRow: { alignItems: 'center', paddingVertical: 4, marginHorizontal: 32 },
  travelText: { fontSize: 11 },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/itinerary/components/DaySection.tsx
git commit -m "feat: add locked day UI to DaySection"
```

---

## Task 10: ItineraryDetailScreen — subscription and lock wiring

**Files:**
- Modify: `src/features/itinerary/screens/ItineraryDetailScreen.tsx`

- [ ] **Step 1: Replace the full content of `src/features/itinerary/screens/ItineraryDetailScreen.tsx`**

```tsx
import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList, TripPlace } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { DaySection } from '../components/DaySection'
import { EmptyState } from '../../../shared/components/EmptyState'
import { getTravelTime } from '../../../shared/api/directions'
import { ManualPlaceModal } from '../components/ManualPlaceModal'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { getDeviceId } from '../../../shared/firebase/deviceId'

type Props = NativeStackScreenProps<RootStackParamList, 'ItineraryDetail'>
type TravelTimes = Record<number, Record<number, string>>

export function ItineraryDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { colors } = useTheme()
  const trips = useItineraryStore(s => s.trips)
  const dayLocks = useItineraryStore(s => s.dayLocks)
  const sortingDayKey = useItineraryStore(s => s.sortingDayKey)
  const reorderDay = useItineraryStore(s => s.reorderDay)
  const removePlaceFromTrip = useItineraryStore(s => s.removePlaceFromTrip)
  const autoSortDay = useItineraryStore(s => s.autoSortDay)
  const addPlaceToTrip = useItineraryStore(s => s.addPlaceToTrip)
  const acquireDayLock = useItineraryStore(s => s.acquireDayLock)
  const releaseAllLocksForTrip = useItineraryStore(s => s.releaseAllLocksForTrip)

  const [travelTimes, setTravelTimes] = useState<TravelTimes>({})
  const [showManual, setShowManual] = useState(false)
  const [manualDay, setManualDay] = useState(0)
  const [myDeviceId, setMyDeviceId] = useState<string | null>(null)

  const trip = trips.find(t => t.id === tripId)

  useEffect(() => { getDeviceId().then(setMyDeviceId) }, [])

  // Release all locks this device holds when navigating away from a shared trip
  useEffect(() => {
    if (!trip?.isShared) return
    return () => { releaseAllLocksForTrip(tripId) }
  }, [trip?.isShared, tripId])

  useEffect(() => {
    if (!trip) return
    const fetchAll = async () => {
      const result: TravelTimes = {}
      for (const day of trip.tripDays) {
        result[day.dayIndex] = {}
        for (let i = 0; i < day.places.length - 1; i++) {
          const from = day.places[i]
          const to = day.places[i + 1]
          result[day.dayIndex][i] = await getTravelTime(from.lat, from.lng, to.lat, to.lng).catch(() => '')
        }
      }
      setTravelTimes(result)
    }
    fetchAll()
  }, [JSON.stringify(trip?.tripDays)])

  React.useLayoutEffect(() => {
    if (trip) navigation.setOptions({ title: trip.name })
  }, [trip?.name])

  // Wraps any edit action with lock acquisition for shared trips
  const withLock = useCallback(async (dayIndex: number, action: () => Promise<void>) => {
    if (!trip?.isShared) { await action(); return }
    const acquired = await acquireDayLock(tripId, dayIndex)
    if (!acquired) {
      Alert.alert('無法編輯', '此天的行程正在被其他人編輯，請稍後再試')
      return
    }
    await action()
  }, [trip?.isShared, tripId, acquireDayLock])

  if (!trip) return <EmptyState message="找不到行程" />

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {trip.tripDays.map(day => {
          const lockKey = `${tripId}-${day.dayIndex}`
          const lock = dayLocks[lockKey]
          const lockedBy = lock?.lockedBy
          const isMyLock = !!lockedBy && lockedBy === myDeviceId
          return (
            <DaySection
              key={day.dayIndex}
              day={day}
              travelTimes={travelTimes[day.dayIndex] ?? {}}
              isSorting={sortingDayKey === lockKey}
              lockedBy={lockedBy}
              isMyLock={isMyLock}
              onReorder={newOrder => withLock(day.dayIndex, () => reorderDay(tripId, day.dayIndex, newOrder))}
              onDelete={placeId => withLock(day.dayIndex, () => removePlaceFromTrip(tripId, day.dayIndex, placeId))}
              onAutoSort={() => withLock(day.dayIndex, () => autoSortDay(tripId, day.dayIndex))}
              onAddManual={async () => {
                if (trip.isShared) {
                  const acquired = await acquireDayLock(tripId, day.dayIndex)
                  if (!acquired) { Alert.alert('無法編輯', '此天的行程正在被其他人編輯，請稍後再試'); return }
                }
                setManualDay(day.dayIndex)
                setShowManual(true)
              }}
            />
          )
        })}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => { setManualDay(0); setShowManual(true) }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <ManualPlaceModal
        visible={showManual}
        dayIndex={manualDay}
        onClose={() => setShowManual(false)}
        onAdd={(place: TripPlace) => {
          addPlaceToTrip(tripId, manualDay, place)
          setShowManual(false)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 8 },
  fab: {
    position: 'absolute', right: 24, bottom: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx jest --passWithNoTests 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/itinerary/screens/ItineraryDetailScreen.tsx
git commit -m "feat: wire shared trip subscription and day-level locking into ItineraryDetailScreen"
```

---

## Task 11: Build release APK

- [ ] **Step 1: Build release APK**

```bash
cd android && gradlew assembleRelease 2>&1 | tail -5
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 2: Confirm APK location**

```
android/app/build/outputs/apk/release/app-release.apk
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git status  # confirm only expected files remain
git commit -m "feat: complete itinerary sharing with Firebase Firestore"
```
