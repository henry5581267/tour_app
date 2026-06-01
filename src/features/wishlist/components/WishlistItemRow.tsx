import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { WishlistItem } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  item: WishlistItem
  onRemove: () => void
}

export function WishlistItemRow({ item, onRemove }: Props) {
  const { colors } = useTheme()

  const handleRemove = () => {
    Alert.alert('移除景點', `確定要從收藏清單移除「${item.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: onRemove },
    ])
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
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
      <TouchableOpacity onPress={handleRemove} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  photo: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  photoPlaceholder: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '600', flex: 1 },
  address: { fontSize: 12 },
  removeBtn: { paddingLeft: 12 },
  removeText: { fontSize: 18, fontWeight: '700' },
})
