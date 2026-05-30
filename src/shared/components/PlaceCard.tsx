import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { PlaceSearchResult } from '../types'
import { CategoryBadge } from './CategoryBadge'
import { useTheme } from '../theme/ThemeContext'

interface Props {
  place: PlaceSearchResult
  onPress: () => void
}

export function PlaceCard({ place, onPress }: Props) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {place.photo ? (
        <Image source={{ uri: place.photo }} style={styles.image} />
      ) : (
        <View style={[styles.image, { backgroundColor: colors.surfaceSecondary }]} />
      )}
      <View style={styles.body}>
        <CategoryBadge category={place.category} />
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{place.name}</Text>
        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>{place.address}</Text>
        {place.rating !== undefined && (
          <Text style={styles.rating}>★ {place.rating.toFixed(1)}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
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
  body: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  address: { fontSize: 13, marginTop: 2 },
  rating: { fontSize: 13, color: '#f59e0b', marginTop: 4, fontWeight: '600' },
})
