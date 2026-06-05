import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { TripDay, TripPlace, TransportMode } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { confirmDelete } from '../../../shared/components/ConfirmDialog'
import { useTheme } from '../../../shared/theme/ThemeContext'

const TRANSPORT_EMOJI: Record<TransportMode, string> = {
  driving: '🚗', transit: '🚆', walking: '🚶', bicycling: '🚴',
}

const TRANSPORT_LABEL: Record<TransportMode, string> = {
  driving: '開車', transit: '大眾運輸', walking: '步行', bicycling: '騎車',
}

interface Props {
  day: TripDay
  travelTimes: Record<number, string>
  totalDays: number
  transportMode?: TransportMode
  isSorting?: boolean
  lockedBy?: string
  isMyLock?: boolean
  onReorder: (newOrder: TripPlace[]) => void
  onDelete: (placeId: string) => void
  onAutoSort: () => void
  onAddManual: () => void | Promise<void>
  onMoveToDay: (placeId: string, toDay: number) => void
}

export function DaySection({
  day, travelTimes, totalDays, transportMode, isSorting, lockedBy, isMyLock,
  onReorder, onDelete, onAutoSort, onAddManual, onMoveToDay,
}: Props) {
  const { colors } = useTheme()
  const isLocked = !!lockedBy && !isMyLock

  // 第 idx 段（place[idx] → place[idx+1]）的交通方式 = 下一站建議的交通方式
  const segTransport = (idx: number): TransportMode =>
    day.places[idx + 1]?.transport ?? transportMode ?? 'walking'

  const handleMove = (place: TripPlace) => {
    const others = Array.from({ length: totalDays }, (_, i) => i).filter(d => d !== day.dayIndex)
    Alert.alert(
      '移動到其他天',
      `「${place.name}」要移動到第幾天？`,
      [
        ...others.map(d => ({ text: `第 ${d + 1} 天`, onPress: () => onMoveToDay(place.id, d) })),
        { text: '取消', style: 'cancel' as const },
      ],
    )
  }

  const moveUp = (idx: number) => {
    if (idx === 0 || isLocked) return
    const o = [...day.places]
    ;[o[idx - 1], o[idx]] = [o[idx], o[idx - 1]]
    onReorder(o)
  }

  const moveDown = (idx: number) => {
    if (idx === day.places.length - 1 || isLocked) return
    const o = [...day.places]
    ;[o[idx], o[idx + 1]] = [o[idx + 1], o[idx]]
    onReorder(o)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.dayTitle, { color: colors.text }]}>第 {day.dayIndex + 1} 天</Text>
        <View style={styles.headerActions}>
          {isLocked ? (
            <View style={[styles.lockBadge, { backgroundColor: colors.danger + '22' }]}>
              <Text style={[styles.lockText, { color: colors.danger }]}>🔒 正在編輯中</Text>
            </View>
          ) : (
            <>
              {day.places.length > 1 && (
                <TouchableOpacity
                  style={[styles.sortBtn, { backgroundColor: isSorting ? colors.primary + '33' : colors.surfaceSecondary }]}
                  onPress={onAutoSort}
                  disabled={isSorting}
                >
                  <Text style={[styles.sortText, { color: colors.primary }]}>
                    {isSorting ? '排序中…' : '優化路線'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.addManualBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => onAddManual()}
              >
                <Text style={[styles.addManualText, { color: '#10b981' }]}>+ 新增</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {day.places.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>尚未加入地點</Text>
      ) : (
        day.places.map((place, idx) => (
          <View key={place.id}>
            <TouchableOpacity
              style={[styles.placeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onLongPress={isLocked ? undefined : () => confirmDelete('移除地點', `確定移除「${place.name}」？`, () => onDelete(place.id))}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <View style={styles.orderBtns}>
                <TouchableOpacity
                  style={[styles.orderBtn, { backgroundColor: colors.surfaceSecondary }, (idx === 0 || isLocked) && styles.orderBtnDisabled]}
                  onPress={() => moveUp(idx)}
                  disabled={idx === 0 || isLocked}
                >
                  <Text style={[styles.orderBtnText, { color: colors.text }]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderBtn, { backgroundColor: colors.surfaceSecondary }, (idx === day.places.length - 1 || isLocked) && styles.orderBtnDisabled]}
                  onPress={() => moveDown(idx)}
                  disabled={idx === day.places.length - 1 || isLocked}
                >
                  <Text style={[styles.orderBtnText, { color: colors.text }]}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.placeInfo}>
                <CategoryBadge category={place.category} />
                <Text style={[styles.placeName, { color: colors.text }]}>{place.name}</Text>
                <Text style={[styles.placeAddr, { color: colors.textSecondary }]} numberOfLines={1}>{place.address}</Text>
                {place.note ? (
                  <Text style={[styles.placeNote, { color: colors.textTertiary }]}>💡 {place.note}</Text>
                ) : null}
              </View>
              {!isLocked && totalDays > 1 && (
                <View style={styles.rightBtns}>
                  <TouchableOpacity
                    style={[styles.moveBtn, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => handleMove(place)}
                  >
                    <Text style={[styles.moveBtnText, { color: colors.primary }]}>⇄</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
            {travelTimes[idx] ? (
              <View style={styles.travelRow}>
                <Text style={[styles.travelText, { color: colors.textTertiary }]}>
                  {TRANSPORT_EMOJI[segTransport(idx)]} {TRANSPORT_LABEL[segTransport(idx)]} · {travelTimes[idx]}
                </Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dayTitle: { fontSize: 16, fontWeight: '800' },
  lockBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  lockText: { fontSize: 12, fontWeight: '700' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sortText: { fontSize: 12, fontWeight: '700' },
  addManualBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addManualText: { fontSize: 12, fontWeight: '700' },
  empty: { paddingHorizontal: 16, fontSize: 13, paddingBottom: 8 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 6,
    borderRadius: 12, padding: 12, borderWidth: 1,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  orderBtns: { flexDirection: 'column', marginRight: 10, gap: 2 },
  orderBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  orderBtnDisabled: { opacity: 0.3 },
  orderBtnText: { fontSize: 12 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  placeAddr: { fontSize: 12, marginTop: 2 },
  placeNote: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  rightBtns: { flexDirection: 'column', alignItems: 'center', gap: 6, marginLeft: 8 },
  moveBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  moveBtnText: { fontSize: 16, fontWeight: '700' },
  travelRow: { alignItems: 'center', paddingVertical: 4, marginHorizontal: 32 },
  travelText: { fontSize: 11 },
})
