import { create } from 'zustand'
import { Trip, TripPlace, GeneratedItinerary, TransportMode } from '../../shared/types'
import {
  getTrips, addTrip, updateTrip, deleteTrip,
  getSharedTripIds, saveSharedTripIds,
} from '../../shared/storage/tripsStorage'
import { sortByRoute } from './utils/sortByRoute'
import { getDeviceId } from '../../shared/firebase/deviceId'
import { useWishlistStore } from '../wishlist/store'
import {
  uploadTrip, fetchTripByCode, addMember, removeMember,
  updateSharedTrip, subscribeToTrip,
  acquireDayLockTransaction, releaseDayLockInFirestore,
  deleteTrip as deleteFirebaseTrip,
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
  createTripFromAI: (itinerary: GeneratedItinerary, transportMode?: TransportMode) => Promise<Trip>
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
    if (trip.isShared) {
      if (trip.inviteCode) {
        await deleteFirebaseTrip(id, trip.inviteCode)
        if (_listeners[id]) { _listeners[id](); delete _listeners[id] }
        _sharedTrips.delete(id)
      } else {
        await get().leaveTrip(id)
      }
    } else {
      await deleteTrip(id)
      const idx = _localTrips.findIndex(t => t.id === id)
      if (idx >= 0) _localTrips.splice(idx, 1)
    }
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
    if (_listeners[ft.id]) return
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
        inviteCode: ft.inviteCode,
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

  createTripFromAI: async (itinerary, transportMode) => {
    // 收藏景點有完整正確資料（地址、座標、照片），用來覆蓋 AI 自行生成的版本
    const savedItems = useWishlistStore.getState().wishlists.flatMap(w => w.items)
    const findSaved = (name: string) => savedItems.find(i => i.name === name)

    const trip: Trip = {
      id: generateId(),
      name: itinerary.tripName,
      days: itinerary.days.length,
      createdAt: new Date().toISOString(),
      isShared: false,
      transportMode,
      tripDays: itinerary.days.map(d => ({
        dayIndex: d.dayIndex,
        places: d.places.map(p => {
          const saved = findSaved(p.name)
          return {
            id: generateId(),
            googlePlaceId: saved?.googlePlaceId || null,
            name: p.name,
            category: saved?.category ?? p.category,
            lat: saved?.lat ?? 0,
            lng: saved?.lng ?? 0,
            address: saved?.address ?? p.address,
            photo: saved?.photo ?? '',
            note: `${p.time} — ${p.note}`,
          }
        }),
      })),
    }
    await addTrip(trip)
    _localTrips.push(trip)
    set({ trips: _merged() })
    return trip
  },
}))
