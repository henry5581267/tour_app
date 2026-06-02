import React, { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList, TripPlace } from '../../../shared/types'
import { getPlaceDetails } from '../../../shared/api/places'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { AddToTripModal } from '../../itinerary/components/AddToTripModal'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useWishlistStore } from '../../wishlist/store'

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceDetail'>

export function PlaceDetailScreen({ route }: Props) {
  const { place } = route.params
  const { colors } = useTheme()
  const wishlists = useWishlistStore(s => s.wishlists)
  const addItemToWishlist = useWishlistStore(s => s.addItemToWishlist)
  const removeItemFromWishlist = useWishlistStore(s => s.removeItemFromWishlist)
  const isInAnyWishlist = useWishlistStore(s => s.isInAnyWishlist)
  const getWishlistsContaining = useWishlistStore(s => s.getWishlistsContaining)
  const [openingHours, setOpeningHours] = useState<string | undefined>()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (place.googlePlaceId) {
      getPlaceDetails(place.googlePlaceId)
        .then(d => setOpeningHours(d.openingHours))
        .catch(() => {})
    }
  }, [place.googlePlaceId])

  const isSaved = isInAnyWishlist(place.googlePlaceId, place.name)

  const handleWishlistToggle = async () => {
    if (isSaved) {
      const containingIds = getWishlistsContaining(place.googlePlaceId, place.name)
      for (const wishlistId of containingIds) {
        const wl = wishlists.find(w => w.id === wishlistId)
        if (wl) {
          const item = wl.items.find(i =>
            place.googlePlaceId ? i.googlePlaceId === place.googlePlaceId : i.name === place.name
          )
          if (item) await removeItemFromWishlist(wishlistId, item.id)
        }
      }
    } else {
      const defaultList = wishlists[0]
      if (defaultList) {
        await addItemToWishlist(defaultList.id, place)
      }
    }
  }

  const tripPlace: TripPlace = {
    id: '', googlePlaceId: place.googlePlaceId,
    name: place.name, category: place.category,
    lat: place.lat, lng: place.lng,
    address: place.address, photo: place.photo, openingHours,
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
      {place.photo ? (
        <Image source={{ uri: place.photo }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, { backgroundColor: colors.surfaceSecondary }]} />
      )}
      <View style={styles.body}>
        <CategoryBadge category={place.category} />
        <Text style={[styles.name, { color: colors.text }]}>{place.name}</Text>
        <Text style={[styles.address, { color: colors.textSecondary }]}>{place.address}</Text>
        {place.rating !== undefined && (
          <Text style={styles.rating}>★ {place.rating.toFixed(1)}</Text>
        )}
        {openingHours && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>開放時間</Text>
            <Text style={[styles.hours, { color: colors.textSecondary }]}>{openingHours}</Text>
          </>
        )}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addBtnText}>+ 加入行程</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.wishlistBtn, { backgroundColor: isSaved ? colors.primary : colors.surface, borderColor: colors.primary }]}
          onPress={handleWishlistToggle}
        >
          <Text style={[styles.wishlistBtnText, { color: isSaved ? '#fff' : colors.primary }]}>
            {isSaved ? '★ 已收藏' : '☆ 加入收藏'}
          </Text>
        </TouchableOpacity>
      </View>
      <AddToTripModal
        visible={showModal}
        place={tripPlace}
        onClose={() => setShowModal(false)}
        onAdded={() => Alert.alert('已加入', `${place.name} 已加入行程`)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: '100%', height: 260 },
  body: { padding: 20 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  address: { fontSize: 14, marginTop: 4 },
  rating: { fontSize: 16, color: '#f59e0b', fontWeight: '700', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  hours: { fontSize: 13, lineHeight: 20 },
  addBtn: { marginTop: 24, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  wishlistBtn: { borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginTop: 8 },
  wishlistBtnText: { fontSize: 14, fontWeight: '600' },
})
