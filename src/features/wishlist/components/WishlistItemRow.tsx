import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { WishlistItem } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  item: WishlistItem
  onRemove: () => void
  selectMode: boolean
  selected: boolean
  onLongPress: () => void
  onPress: () => void
}

export function WishlistItemRow({ item, selectMode, selected, onLongPress, onPress }: Props) {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      style={[styles.row, {
        backgroundColor: selected ? colors.primary + '18' : colors.surface,
        borderBottomColor: colors.border,
      }]}
      onLongPress={onLongPress}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 選取圓圈 */}
      {selectMode && (
        <View style={[styles.circle, {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : 'transparent',
        }]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      )}

      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.photo} />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceSecondary }]} />
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <CategoryBadge category={item.category} />
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  photo: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  photoPlaceholder: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '600', flex: 1 },
  address: { fontSize: 12 },
})
