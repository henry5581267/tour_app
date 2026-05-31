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
