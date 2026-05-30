import AsyncStorage from '@react-native-async-storage/async-storage'
import { Trip } from '../types'

const KEY = 'trips'

export async function getTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as Trip[]) : []
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
