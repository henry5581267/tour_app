import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { PlaceCategory } from '../../../shared/types'

const TABS: { key: PlaceCategory; label: string }[] = [
  { key: 'attraction', label: '景點' },
  { key: 'restaurant', label: '餐廳' },
  { key: 'activity', label: '遊玩' },
]

interface Props {
  active: PlaceCategory
  onChange: (cat: PlaceCategory) => void
}

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, active === t.key && styles.tabActive]}
          onPress={() => onChange(t.key)}
        >
          <Text style={[styles.label, active === t.key && styles.labelActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3b82f6' },
  label: { fontSize: 14, fontWeight: '600', color: '#888' },
  labelActive: { color: '#3b82f6' },
})
