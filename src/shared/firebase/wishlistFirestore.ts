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
  const code = generateInviteCode()
  await firestore().collection(WISHLISTS).doc(wishlist.id).set({
    id: wishlist.id,
    inviteCode: code,
    items: wishlist.items,
    members: [deviceId],
  })
  await firestore().collection(WISHLIST_INVITE_CODES).doc(code).set({
    wishlistId: wishlist.id,
  })
  return code
}

export async function fetchWishlistByCode(
  code: string,
): Promise<{ id: string; items: WishlistItem[] } | null> {
  const codeDoc = await firestore()
    .collection(WISHLIST_INVITE_CODES)
    .doc(code.toUpperCase())
    .get()
  if (!codeDoc.exists) return null

  const { wishlistId } = (codeDoc as any).data() as { wishlistId: string }
  const wishlistDoc = await firestore()
    .collection(WISHLISTS)
    .doc(wishlistId)
    .get()
  if (!wishlistDoc.exists) return null

  const data = (wishlistDoc as any).data() as { id: string; items: WishlistItem[] }
  return { id: data.id, items: data.items }
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
