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
