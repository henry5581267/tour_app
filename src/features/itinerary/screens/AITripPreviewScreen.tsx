import React, { useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'

type Props = NativeStackScreenProps<RootStackParamList, 'AITripPreview'>

export function AITripPreviewScreen({ route, navigation }: Props) {
  const { itinerary, transportMode } = route.params
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const createTripFromAI = useItineraryStore(s => s.createTripFromAI)
  const [creating, setCreating] = useState(false)

  const handleConfirm = async () => {
    if (creating) return
    setCreating(true)
    try {
      const trip = await createTripFromAI(itinerary, transportMode)
      navigation.replace('ItineraryDetail', { tripId: trip.id })
    } catch {
      setCreating(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}>
        <Text style={[styles.tripName, { color: colors.text }]}>{itinerary.tripName}</Text>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          地點座標尚未取得，加入行程後可在地圖搜尋補全。
        </Text>

        {itinerary.days.map(day => (
          <View key={day.dayIndex} style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>第 {day.dayIndex + 1} 天</Text>
            <Text style={[styles.dayTheme, { color: colors.text }]}>{day.theme}</Text>
            {day.places.map((place, idx) => (
              <View key={idx} style={[styles.placeRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.placeTime, { color: colors.textTertiary }]}>{place.time}</Text>
                <View style={styles.placeInfo}>
                  <View style={styles.nameRow}>
                    <CategoryBadge category={place.category} />
                    <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                  </View>
                  <Text style={[styles.placeAddr, { color: colors.textSecondary }]} numberOfLines={1}>{place.address}</Text>
                  <Text style={[styles.placeNote, { color: colors.textTertiary }]}>{place.note}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.retryBtn, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={creating}
        >
          <Text style={[styles.retryBtnText, { color: colors.text }]}>重新規劃</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
          disabled={creating}
        >
          {creating ? (
            <View style={styles.confirmLoading}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.confirmBtnText}>建立中…</Text>
            </View>
          ) : (
            <Text style={styles.confirmBtnText}>建立行程</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  tripName: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  hint: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  dayCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  dayLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  dayTheme: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  placeRow: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, gap: 10 },
  placeTime: { fontSize: 11, width: 68, paddingTop: 2 },
  placeInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  placeName: { fontSize: 14, fontWeight: '700', flex: 1 },
  placeAddr: { fontSize: 12, marginBottom: 2 },
  placeNote: { fontSize: 11, fontStyle: 'italic' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1,
  },
  retryBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, alignItems: 'center' },
  retryBtnText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  confirmLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
