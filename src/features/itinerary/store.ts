import { create } from 'zustand'
import { Trip, TripPlace } from '../../shared/types'
import { getTrips, addTrip, updateTrip, deleteTrip } from '../../shared/storage/tripsStorage'
import { sortByRoute } from './utils/sortByRoute'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

interface ItineraryState {
  trips: Trip[]
  sortingDayKey: string | null  // `${tripId}-${dayIndex}` 表示哪天正在排序
  loadTrips: () => Promise<void>
  createTrip: (name: string, days: number) => Promise<Trip>
  removeTrip: (id: string) => Promise<void>
  addPlaceToTrip: (tripId: string, dayIndex: number, place: TripPlace) => Promise<void>
  removePlaceFromTrip: (tripId: string, dayIndex: number, placeId: string) => Promise<void>
  reorderDay: (tripId: string, dayIndex: number, newOrder: TripPlace[]) => Promise<void>
  movePlaceToDay: (tripId: string, placeId: string, fromDay: number, toDay: number) => Promise<void>
  autoSortDay: (tripId: string, dayIndex: number) => Promise<void>
  renameTrip: (tripId: string, newName: string) => Promise<void>
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  trips: [],
  sortingDayKey: null,

  loadTrips: async () => {
    const trips = await getTrips()
    set({ trips })
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
    set(s => ({ trips: [...s.trips, trip] }))
    return trip
  },

  removeTrip: async (id) => {
    await deleteTrip(id)
    set(s => ({ trips: s.trips.filter(t => t.id !== id) }))
  },

  addPlaceToTrip: async (tripId, dayIndex, place) => {
    const trips = get().trips
    const trip = trips.find(t => t.id === tripId)
    if (!trip) return
    const updated: Trip = {
      ...trip,
      tripDays: trip.tripDays.map(d =>
        d.dayIndex === dayIndex
          ? { ...d, places: [...d.places, { ...place, id: generateId() }] }
          : d
      ),
    }
    await updateTrip(updated)
    set(s => ({ trips: s.trips.map(t => (t.id === tripId ? updated : t)) }))
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
    await updateTrip(updated)
    set(s => ({ trips: s.trips.map(t => (t.id === tripId ? updated : t)) }))
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
    await updateTrip(updated)
    set(s => ({ trips: s.trips.map(t => (t.id === tripId ? updated : t)) }))
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
        if (d.dayIndex === fromDay)
          return { ...d, places: d.places.filter(p => p.id !== placeId) }
        if (d.dayIndex === toDay)
          return { ...d, places: [...d.places, movingPlace] }
        return d
      }),
    }
    await updateTrip(updated)
    set(s => ({ trips: s.trips.map(t => (t.id === tripId ? updated : t)) }))
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
    await updateTrip(updated)
    set(s => ({ trips: s.trips.map(t => (t.id === tripId ? updated : t)) }))
  },
}))
