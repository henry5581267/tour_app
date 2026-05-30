import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { TripDay, TripPlace } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { confirmDelete } from '../../../shared/components/ConfirmDialog'

interface Props {
  day: TripDay
  travelTimes: Record<number, string>
  onReorder: (newOrder: TripPlace[]) => void
  onDelete: (placeId: string) => void
  onAutoSort: () => void
  onAddManual: () => void
}

export function DaySection({ day, travelTimes, onReorder, onDelete, onAutoSort, onAddManual }: Props) {
  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<TripPlace>) => {
    const idx = getIndex() ?? 0
    const travelTime = travelTimes[idx]
    return (
      <View>
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
        {travelTime ? (
          <View style={styles.travelRow}>
            <Text style={styles.travelText}>🚶 {travelTime}</Text>
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dayTitle}>第 {day.dayIndex + 1} 天</Text>
        <View style={styles.headerActions}>
          {day.places.length > 1 && (
            <TouchableOpacity style={styles.sortBtn} onPress={onAutoSort}>
              <Text style={styles.sortText}>優化路線</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addManualBtn} onPress={onAddManual}>
            <Text style={styles.addManualText}>+ 新增</Text>
          </TouchableOpacity>
        </View>
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
  headerActions: { flexDirection: 'row', gap: 8 },
  dayTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  sortBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sortText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  addManualBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addManualText: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  empty: { paddingHorizontal: 16, color: '#aaa', fontSize: 13, paddingBottom: 8 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 0, borderRadius: 12, padding: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  placeRowActive: { backgroundColor: '#eff6ff', elevation: 6 },
  placeLeft: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  placeAddr: { fontSize: 12, color: '#888', marginTop: 2 },
  dragHandle: { fontSize: 22, color: '#ccc', paddingLeft: 8 },
  travelRow: { alignItems: 'center', paddingVertical: 4, marginHorizontal: 32 },
  travelText: { fontSize: 11, color: '#94a3b8' },
})
