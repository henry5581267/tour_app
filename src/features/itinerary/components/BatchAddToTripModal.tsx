import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, FlatList,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useItineraryStore } from '../store'
import { searchPlaces, getPlaceDetails } from '../../../shared/api/places'
import { Trip, TripPlace } from '../../../shared/types'

interface Props {
  visible: boolean
  trip: Trip
  onClose: () => void
}

export function BatchAddToTripModal({ visible, trip, onClose }: Props) {
  const { colors } = useTheme()
  const addPlaceToTrip = useItineraryStore(s => s.addPlaceToTrip)

  const [selectedDay, setSelectedDay] = useState(0)
  const [placeNames, setPlaceNames] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const names = placeNames.split('\n').map(s => s.trim()).filter(s => s.length > 0)
  const canSubmit = names.length > 0 && !loading

  const handleImport = async () => {
    if (!canSubmit) return
    setLoading(true)
    setProgress('')
    let found = 0
    const failed: string[] = []

    for (let i = 0; i < names.length; i++) {
      const q = names[i]
      setProgress(`搜尋中 ${i + 1} / ${names.length}：${q}`)
      try {
        const results = await searchPlaces(q)
        if (results.length > 0) {
          const r = results[0]
          // 查營業時間（英文格式，供優化路線解析公休/打烊時間）
          let openingHours: string | undefined
          if (r.googlePlaceId) {
            try {
              const d = await getPlaceDetails(r.googlePlaceId, 'en')
              openingHours = d.openingHours
            } catch {}
          }
          const place: TripPlace = {
            id: '',
            googlePlaceId: r.googlePlaceId,
            name: r.name,
            category: r.category,
            lat: r.lat,
            lng: r.lng,
            address: r.address,
            photo: r.photo,
            openingHours,
          }
          await addPlaceToTrip(trip.id, selectedDay, place)
          found++
        } else {
          failed.push(q)
        }
      } catch {
        failed.push(q)
      }
    }

    setLoading(false)
    setProgress('')
    let msg = `已加入 ${found} 個地點到第 ${selectedDay + 1} 天`
    if (failed.length > 0) msg += `\n\n找不到：${failed.join('、')}`
    Alert.alert('批次加入完成', msg)
    setPlaceNames('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={[styles.sheet, { backgroundColor: colors.surface }]}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>批次加入地點</Text>

          {/* 選擇第幾天 */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>加入到哪一天</Text>
          <TouchableOpacity
            style={[styles.combobox, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            disabled={loading}
          >
            <Text style={[styles.comboboxText, { color: colors.text }]}>
              第 {selectedDay + 1} 天（{trip.tripDays[selectedDay]?.places.length ?? 0} 個地點）
            </Text>
            <Text style={[styles.comboboxArrow, { color: colors.textTertiary }]}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          <Modal visible={dropdownOpen} transparent animationType="none" onRequestClose={() => setDropdownOpen(false)}>
            <TouchableOpacity style={styles.dropdownOverlay} onPress={() => setDropdownOpen(false)}>
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <FlatList
                  data={trip.tripDays}
                  keyExtractor={d => String(d.dayIndex)}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => { setSelectedDay(item.dayIndex); setDropdownOpen(false) }}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                        第 {item.dayIndex + 1} 天（{item.places.length} 個地點）
                      </Text>
                      {selectedDay === item.dayIndex && <Text style={{ color: colors.primary }}>✓</Text>}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
            地點名稱（每行一個，共 {names.length} 個）
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={placeNames}
            onChangeText={setPlaceNames}
            placeholder={'宮原眼科\n第二市場\n彩虹眷村\n逢甲夜市'}
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            editable={!loading}
          />
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            名稱越完整越準確，例如「台中 宮原眼科」比只寫「宮原眼科」更好
          </Text>

          {loading ? (
            <View style={styles.progressRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.progressText, { color: colors.textSecondary }]} numberOfLines={1}>{progress}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: canSubmit ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleImport}
              disabled={!canSubmit}
            >
              <Text style={[styles.importBtnText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>
                搜尋並加入（{names.length} 個）
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  combobox: { borderWidth: 1.5, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comboboxText: { fontSize: 14, flex: 1 },
  comboboxArrow: { fontSize: 12, marginLeft: 8 },
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: { borderWidth: 1.5, borderRadius: 10, maxHeight: 350, width: '85%' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownItemText: { fontSize: 14 },
  textArea: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14, height: 140 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingVertical: 4 },
  progressText: { flex: 1, fontSize: 13 },
  importBtn: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  cancelText: { fontSize: 15 },
})
