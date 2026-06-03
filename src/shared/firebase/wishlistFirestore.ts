import firestore from '@react-native-firebase/firestore'
import { Wishlist, WishlistItem } from '../types'

const WISHLISTS = 'wishlists'
const WISHLIST_INVITE_CODES = 'wishlistInviteCodes'
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export async function uploadWishlist(
  wishlist: Wishlist,
  deviceId: string,
): Promise<string> {
  const code = generateInviteCode().toUpperCase()
  const batch = firestore().batch()
  batch.set(firestore().collection(WISHLISTS).doc(wishlist.id), {
    id: wishlist.id,
    name: wishlist.name,
    inviteCode: code,
    items: wishlist.items,
    members: [deviceId],
  })
  batch.set(firestore().collection(WISHLIST_INVITE_CODES).doc(code), {
    wishlistId: wishlist.id,
  })
  await batch.commit()
  return code
}

export async function fetchWishlistByCode(
  code: string,
): Promise<{ id: string; name?: string; items: WishlistItem[] } | null> {
  const upperCode = code.toUpperCase()
  const codeSnap = await firestore()
    .collection(WISHLIST_INVITE_CODES)
    .doc(upperCode)
    .get()
  if (!codeSnap.exists) return null

  const { wishlistId } = (codeSnap as any).data() as { wishlistId: string }
  const wishlistSnap = await firestore()
    .collection(WISHLISTS)
    .doc(wishlistId)
    .get()
  if (!wishlistSnap.exists) return null

  const data = (wishlistSnap as any).data() as { id: string; name?: string; items: WishlistItem[] }
  return { id: data.id, name: data.name, items: data.items ?? [] }
}

export async function addWishlistMember(
  wishlistId: string,
  deviceId: string,
): Promise<void> {
  await firestore()
    .collection(WISHLISTS)
    .doc(wishlistId)
    .update({
      members: (firestore as any).FieldValue.arrayUnion(deviceId),
    })
}

export async function removeWishlistMember(
  wishlistId: string,
  deviceId: string,
): Promise<void> {
  await firestore()
    .collection(WISHLISTS)
    .doc(wishlistId)
    .update({
      members: (firestore as any).FieldValue.arrayRemove(deviceId),
    })
}

export async function updateSharedWishlist(
  wishlistId: string,
  items?: WishlistItem[],
  name?: string,
): Promise<void> {
  const update: Record<string, any> = {}
  if (items) update.items = items
  if (name) update.name = name
  await firestore().collection('wishlists').doc(wishlistId).update(update)
}

export async function deleteWishlist(
  wishlistId: string,
  inviteCode?: string,
): Promise<void> {
  const batch = firestore().batch()
  batch.delete(firestore().collection(WISHLISTS).doc(wishlistId))
  if (inviteCode) {
    batch.delete(firestore().collection(WISHLIST_INVITE_CODES).doc(inviteCode.toUpperCase()))
  }
  await batch.commit()
}

export function subscribeToWishlist(
  wishlistId: string,
  onUpdate: (data: { id: string; name: string; items: WishlistItem[] } | null) => void,
): () => void {
  return firestore()
    .collection('wishlists')
    .doc(wishlistId)
    .onSnapshot(snap => {
      if (!snap.exists) { onUpdate(null); return }
      const data = (snap as any).data() as { id: string; name: string; items: WishlistItem[] }
      onUpdate(data)
    })
}
