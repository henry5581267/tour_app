import firestore from '@react-native-firebase/firestore'
import { WishlistItem } from '../types'

const BLACKLISTS = 'blacklists'
const BLACKLIST_INVITE_CODES = 'blacklistInviteCodes'
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export async function uploadBlacklist(
  id: string,
  items: WishlistItem[],
  deviceId: string,
): Promise<string> {
  const code = generateInviteCode().toUpperCase()
  const batch = firestore().batch()
  batch.set(firestore().collection(BLACKLISTS).doc(id), {
    id,
    inviteCode: code,
    items,
    members: [deviceId],
  })
  batch.set(firestore().collection(BLACKLIST_INVITE_CODES).doc(code), {
    blacklistId: id,
  })
  await batch.commit()
  return code
}

export async function fetchBlacklistByCode(
  code: string,
): Promise<{ id: string; items: WishlistItem[] } | null> {
  const upperCode = code.toUpperCase()
  const codeSnap = await firestore()
    .collection(BLACKLIST_INVITE_CODES)
    .doc(upperCode)
    .get()
  if (!codeSnap.exists) return null

  const { blacklistId } = (codeSnap as any).data() as { blacklistId: string }
  const snap = await firestore().collection(BLACKLISTS).doc(blacklistId).get()
  if (!snap.exists) return null

  const data = (snap as any).data() as { id: string; items: WishlistItem[] }
  return { id: data.id, items: data.items ?? [] }
}

export async function addBlacklistMember(
  blacklistId: string,
  deviceId: string,
): Promise<void> {
  await firestore()
    .collection(BLACKLISTS)
    .doc(blacklistId)
    .update({ members: (firestore as any).FieldValue.arrayUnion(deviceId) })
}

export async function removeBlacklistMember(
  blacklistId: string,
  deviceId: string,
): Promise<void> {
  await firestore()
    .collection(BLACKLISTS)
    .doc(blacklistId)
    .update({ members: (firestore as any).FieldValue.arrayRemove(deviceId) })
}

export async function updateSharedBlacklist(
  blacklistId: string,
  items: WishlistItem[],
): Promise<void> {
  await firestore().collection(BLACKLISTS).doc(blacklistId).update({ items })
}

export async function deleteBlacklist(
  blacklistId: string,
  inviteCode?: string,
): Promise<void> {
  const batch = firestore().batch()
  batch.delete(firestore().collection(BLACKLISTS).doc(blacklistId))
  if (inviteCode) {
    batch.delete(
      firestore().collection(BLACKLIST_INVITE_CODES).doc(inviteCode.toUpperCase()),
    )
  }
  await batch.commit()
}

export function subscribeToBlacklist(
  blacklistId: string,
  onUpdate: (items: WishlistItem[]) => void,
): () => void {
  return firestore()
    .collection(BLACKLISTS)
    .doc(blacklistId)
    .onSnapshot(snap => {
      if (!snap.exists) return
      const data = (snap as any).data() as { items: WishlistItem[] }
      onUpdate(data.items ?? [])
    })
}
