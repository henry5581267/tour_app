import AsyncStorage from '@react-native-async-storage/async-storage'
import { Trip } from '../types'

const KEY = 'trips'

export async function getTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return []
  const trips = JSON.parse(raw) as Trip[]
  return trips.map(t => ({ ...t, isShared: t.isShared ?? false }))
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(trips))
}

export async function addTrip(trip: Trip): Promise<void> {
  const trips = await getTrips()
  await saveTrips([...trips, trip])
}

export async function updateTrip(updated: Trip): Promise<void> {
  const trips = await getTrips()
  await saveTrips(trips.map(t => (t.id === updated.id ? updated : t)))
}

export async function deleteTrip(id: string): Promise<void> {
  const trips = await getTrips()
  await saveTrips(trips.filter(t => t.id !== id))
}

const SHARED_IDS_KEY = '@tourapp/sharedTripIds'

export async function getSharedTripIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SHARED_IDS_KEY)
  return raw ? (JSON.parse(raw) as string[]) : []
}

export async function saveSharedTripIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SHARED_IDS_KEY, JSON.stringify(ids))
}
