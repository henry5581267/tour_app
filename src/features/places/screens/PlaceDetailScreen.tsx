import React, { useEffect, useState } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList, TripPlace } from '../../../shared/types'
import { getPlaceDetails } from '../../../shared/api/places'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { AddToTripModal } from '../../itinerary/components/AddToTripModal'

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceDetail'>

export function PlaceDetailScreen({ route }: Props) {
  const { place } = route.params
  const [openingHours, setOpeningHours] = useState<string | undefined>()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (place.googlePlaceId) {
      getPlaceDetails(place.googlePlaceId)
        .then(d => setOpeningHours(d.openingHours))
        .catch(() => {})
    }
  }, [place.googlePlaceId])

  const tripPlace: TripPlace = {
    id: '',
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    category: place.category,
    lat: place.lat,
    lng: place.lng,
    address: place.address,
    photo: place.photo,
    openingHours,
  }

  return (
    <ScrollView style={styles.container}>
      {place.photo ? (
        <Image source={{ uri: place.photo }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]} />
      )}
      <View style={styles.body}>
        <CategoryBadge category={place.category} />
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.address}>{place.address}</Text>
        {place.rating !== undefined && (
          <Text style={styles.rating}>★ {place.rating.toFixed(1)}</Text>
        )}
        {openingHours && (
          <>
            <Text style={styles.sectionTitle}>開放時間</Text>
            <Text style={styles.hours}>{openingHours}</Text>
          </>
        )}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ 加入行程</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { width: '100%', height: 260 },
  heroPlaceholder: { backgroundColor: '#e0e0e0' },
  body: { padding: 20 },
  name: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginTop: 8 },
  address: { fontSize: 14, color: '#666', marginTop: 4 },
  rating: { fontSize: 16, color: '#f59e0b', fontWeight: '700', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  hours: { fontSize: 13, color: '#444', lineHeight: 20 },
  addBtn: {
    marginTop: 24, backgroundColor: '#3b82f6', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
