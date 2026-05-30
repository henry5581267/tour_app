import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
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
  const moveUp = (idx: number) => {
    if (idx === 0) return
    const newOrder = [...day.places]
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    onReorder(newOrder)
  }

  const moveDown = (idx: number) => {
    if (idx === day.places.length - 1) return
    const newOrder = [...day.places]
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    onReorder(newOrder)
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
        day.places.map((place, idx) => (
          <View key={place.id}>
            <View style={styles.placeRow}>
              <View style={styles.orderBtns}>
                <TouchableOpacity
                  style={[styles.orderBtn, idx === 0 && styles.orderBtnDisabled]}
                  onPress={() => moveUp(idx)}
                  disabled={idx === 0}
                >
                  <Text style={styles.orderBtnText}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderBtn, idx === day.places.length - 1 && styles.orderBtnDisabled]}
                  onPress={() => moveDown(idx)}
                  disabled={idx === day.places.length - 1}
                >
                  <Text style={styles.orderBtnText}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.placeInfo}>
                <CategoryBadge category={place.category} />
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddr} numberOfLines={1}>{place.address}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete('移除地點', `確定移除「${place.name}」？`, () => onDelete(place.id))}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            {travelTimes[idx] ? (
              <View style={styles.travelRow}>
                <Text style={styles.travelText}>🚶 {travelTimes[idx]}</Text>
              </View>
            ) : null}
          </View>
        ))
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
    marginHorizontal: 16, marginBottom: 6, borderRadius: 12, padding: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  orderBtns: { flexDirection: 'column', marginRight: 10, gap: 2 },
  orderBtn: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  orderBtnDisabled: { opacity: 0.3 },
  orderBtnText: { fontSize: 12, color: '#555' },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  placeAddr: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  deleteBtnText: { fontSize: 14, color: '#ef4444', fontWeight: '700' },
  travelRow: { alignItems: 'center', paddingVertical: 4, marginHorizontal: 32 },
  travelText: { fontSize: 11, color: '#94a3b8' },
})
