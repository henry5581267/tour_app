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
