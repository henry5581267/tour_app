import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { PlaceCategory } from '../types'

const LABEL: Record<PlaceCategory, string> = {
  attraction: '景點',
  restaurant: '餐廳',
  activity: '遊玩',
}

const COLOR: Record<PlaceCategory, string> = {
  attraction: '#3b82f6',
  restaurant: '#ef4444',
  activity: '#10b981',
}

export function CategoryBadge({ category }: { category: PlaceCategory }) {
  return (
    <View style={[styles.badge, { backgroundColor: COLOR[category] }]}>
      <Text style={styles.label}>{LABEL[category]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  label: { color: '#fff', fontSize: 11, fontWeight: '700' },
})
