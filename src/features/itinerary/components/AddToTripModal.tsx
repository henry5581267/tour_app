import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  StyleSheet, Image, ScrollView
} from 'react-native'
import { Trip, TripPlace } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  visible: boolean
  place: TripPlace
  onClose: () => void
  onAdded: () => void
}

function DayCard({
  dayIndex, places, selected, onPress, colors,
}: {
  dayIndex: number
  places: TripPlace[]
  selected: boolean
  onPress: () => void
  colors: any
}) {
  const photo = places[0]?.photo
  return (
    <TouchableOpacity
      style={[styles.dayCard, selected && { borderColor: colors.primary, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.dayCardImage} />
      ) : (
        <View style={[styles.dayCardImage, styles.dayCardImagePlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={styles.dayCardEmoji}>📍</Text>
        </View>
      )}
      <View style={[styles.dayCardOverlay, selected && { backgroundColor: colors.primary + 'cc' }]}>
        <Text style={styles.dayCardLabel}>第 {dayIndex + 1} 天</Text>
        <Text style={styles.dayCardSub}>{places.length} 個地點</Text>
      </View>
      {selected && (
        <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export function AddToTripModal({ visible, place, onClose, onAdded }: Props) {
  const { colors } = useTheme()
  const trips = useItineraryStore(s => s.trips)
  const addPlaceToTrip = useItineraryStore(s => s.addPlaceToTrip)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [step, setStep] = useState<'trip' | 'day'>('trip')

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    setSelectedDay(0)
    if (trips.length === 1) setStep('day')
    else setStep('day')
  }

  const handleAdd = async () => {
    if (!selectedTrip) return
    await addPlaceToTrip(selectedTrip.id, selectedDay, place)
    onAdded()
    onClose()
    setStep('trip')
    setSelectedTrip(null)
  }

  const handleClose = () => {
    onClose()
    setStep('trip')
    setSelectedTrip(null)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>

          {/* Header */}
          <Text style={[styles.title, { color: colors.text }]}>加入哪個行程？</Text>

          {/* Trip List */}
          {step === 'trip' && (
            <FlatList
              data={trips}
              keyExtractor={t => t.id}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.textSecondary }]}>尚無行程，請先建立行程</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.tripCard, { backgroundColor: colors.surfaceSecondary, borderColor: selectedTrip?.id === item.id ? colors.primary : 'transparent', borderWidth: 2 }]}
                  onPress={() => handleSelectTrip(item)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.tripIcon, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={styles.tripIconText}>🗺️</Text>
                  </View>
                  <View style={styles.tripInfo}>
                    <Text style={[styles.tripName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.tripMeta, { color: colors.textSecondary }]}>
                      {item.days} 天 · {item.tripDays.reduce((n, d) => n + d.places.length, 0)} 個地點
                    </Text>
                  </View>
                  <Text style={[styles.tripArrow, { color: colors.textTertiary }]}>›</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.tripList}
            />
          )}

          {/* Day Picker */}
          {step === 'day' && selectedTrip && (
            <>
              {/* Selected trip summary */}
              <TouchableOpacity
                style={[styles.tripCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.primary, borderWidth: 1.5, marginHorizontal: 16, marginBottom: 8 }]}
                onPress={() => setStep('trip')}
              >
                <View style={[styles.tripIcon, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={styles.tripIconText}>🗺️</Text>
                </View>
                <View style={styles.tripInfo}>
                  <Text style={[styles.tripName, { color: colors.text }]}>{selectedTrip.name}</Text>
                  <Text style={[styles.tripMeta, { color: colors.textSecondary }]}>{selectedTrip.days} 天</Text>
                </View>
                <Text style={[styles.tripArrow, { color: colors.primary }]}>✎</Text>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>安排行程日期</Text>

              <FlatList
                data={selectedTrip.tripDays}
                keyExtractor={d => String(d.dayIndex)}
                numColumns={2}
                columnWrapperStyle={styles.dayRow}
                contentContainerStyle={styles.dayGrid}
                renderItem={({ item }) => (
                  <DayCard
                    dayIndex={item.dayIndex}
                    places={item.places}
                    selected={selectedDay === item.dayIndex}
                    onPress={() => setSelectedDay(item.dayIndex)}
                    colors={colors}
                  />
                )}
              />
            </>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
            {selectedTrip && step === 'day' && (
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
                <Text style={styles.addText}>加入行程</Text>
              </TouchableOpacity>
            )}
          </View>

        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  title: { fontSize: 22, fontWeight: '800', padding: 20, paddingBottom: 12 },

  // Trip card
  tripList: { paddingHorizontal: 16, paddingBottom: 8 },
  tripCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  tripIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tripIconText: { fontSize: 22 },
  tripInfo: { flex: 1 },
  tripName: { fontSize: 16, fontWeight: '700' },
  tripMeta: { fontSize: 13, marginTop: 2 },
  tripArrow: { fontSize: 22, fontWeight: '300' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },

  // Day grid
  sectionTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: 20, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayGrid: { paddingHorizontal: 14, paddingBottom: 8 },
  dayRow: { justifyContent: 'space-between', marginBottom: 10 },
  dayCard: {
    width: '48%', height: 130, borderRadius: 16, overflow: 'hidden',
    borderColor: 'transparent', borderWidth: 2,
  },
  dayCardImage: { width: '100%', height: '100%', position: 'absolute' },
  dayCardImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  dayCardEmoji: { fontSize: 32 },
  dayCardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', padding: 10,
  },
  dayCardLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dayCardSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  checkText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1,
  },
  cancelBtn: { padding: 8 },
  cancelText: { fontSize: 16 },
  addBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})


