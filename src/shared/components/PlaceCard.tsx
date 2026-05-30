import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { PlaceSearchResult } from '../types'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  place: PlaceSearchResult
  onPress: () => void
}

export function PlaceCard({ place, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {place.photo ? (
        <Image source={{ uri: place.photo }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <CategoryBadge category={place.category} />
        <Text style={styles.name} numberOfLines={2}>{place.name}</Text>
        <Text style={styles.address} numberOfLines={1}>{place.address}</Text>
        {place.rating !== undefined && (
          <Text style={styles.rating}>★ {place.rating.toFixed(1)}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  image: { width: '100%', height: 180 },
  imagePlaceholder: { backgroundColor: '#e0e0e0' },
  body: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  address: { fontSize: 13, color: '#666', marginTop: 2 },
  rating: { fontSize: 13, color: '#f59e0b', marginTop: 4, fontWeight: '600' },
})
