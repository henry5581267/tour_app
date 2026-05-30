import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { TripDay, TripPlace } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { confirmDelete } from '../../../shared/components/ConfirmDialog'

interface Props {
  day: TripDay
  onReorder: (newOrder: TripPlace[]) => void
  onDelete: (placeId: string) => void
  onAutoSort: () => void
}

export function DaySection({ day, onReorder, onDelete, onAutoSort }: Props) {
  const renderItem = ({ item, drag, isActive }: RenderItemParams<TripPlace>) => (
    <TouchableOpacity
      style={[styles.placeRow, isActive && styles.placeRowActive]}
      onLongPress={drag}
      onPress={() =>
        confirmDelete('移除地點', `確定移除「${item.name}」？`, () => onDelete(item.id))
      }
    >
      <View style={styles.placeLeft}>
        <CategoryBadge category={item.category} />
        <Text style={styles.placeName}>{item.name}</Text>
        <Text style={styles.placeAddr} numberOfLines={1}>{item.address}</Text>
      </View>
      <Text style={styles.dragHandle}>⠿</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dayTitle}>第 {day.dayIndex + 1} 天</Text>
        {day.places.length > 1 && (
          <TouchableOpacity style={styles.sortBtn} onPress={onAutoSort}>
            <Text style={styles.sortText}>優化路線</Text>
          </TouchableOpacity>
        )}
      </View>
      {day.places.length === 0 ? (
        <Text style={styles.empty}>尚未加入地點</Text>
      ) : (
        <DraggableFlatList
          data={day.places}
          keyExtractor={p => p.id}
          renderItem={renderItem}
          onDragEnd={({ data }) => onReorder(data)}
          scrollEnabled={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  dayTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  sortBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sortText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  empty: { paddingHorizontal: 16, color: '#aaa', fontSize: 13, paddingBottom: 8 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 6, borderRadius: 12, padding: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  placeRowActive: { backgroundColor: '#eff6ff', elevation: 6 },
  placeLeft: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  placeAddr: { fontSize: 12, color: '#888', marginTop: 2 },
  dragHandle: { fontSize: 22, color: '#ccc', paddingLeft: 8 },
})
