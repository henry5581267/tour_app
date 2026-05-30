import React, { useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView
} from 'react-native'
import { Trip, TripPlace } from '../../../shared/types'
import { useItineraryStore } from '../store'

interface Props {
  visible: boolean
  place: TripPlace
  onClose: () => void
  onAdded: () => void
}

export function AddToTripModal({ visible, place, onClose, onAdded }: Props) {
  const trips = useItineraryStore(s => s.trips)
  const addPlaceToTrip = useItineraryStore(s => s.addPlaceToTrip)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(0)

  const handleAdd = async () => {
    if (!selectedTrip) return
    await addPlaceToTrip(selectedTrip.id, selectedDay, place)
    onAdded()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>加入哪個行程？</Text>
        {trips.length === 0 ? (
          <Text style={styles.empty}>尚無行程，請先建立行程</Text>
        ) : (
          <>
            <FlatList
              data={trips}
              keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, selectedTrip?.id === item.id && styles.rowActive]}
                  onPress={() => { setSelectedTrip(item); setSelectedDay(0) }}
                >
                  <Text style={styles.rowText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            {selectedTrip && (
              <>
                <Text style={styles.subtitle}>選擇第幾天</Text>
                <FlatList
                  horizontal
                  data={selectedTrip.tripDays}
                  keyExtractor={d => String(d.dayIndex)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.dayBtn, selectedDay === item.dayIndex && styles.dayBtnActive]}
                      onPress={() => setSelectedDay(item.dayIndex)}
                    >
                      <Text style={styles.dayText}>第 {item.dayIndex + 1} 天</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.dayList}
                />
              </>
            )}
          </>
        )}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          {selectedTrip && (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addText}>加入行程</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  subtitle: { fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  empty: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 40 },
  row: { padding: 14, borderRadius: 10, backgroundColor: '#f1f5f9', marginBottom: 8 },
  rowActive: { backgroundColor: '#dbeafe' },
  rowText: { fontSize: 15, fontWeight: '600' },
  dayList: { marginBottom: 8 },
  dayBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  dayBtnActive: { backgroundColor: '#3b82f6' },
  dayText: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#888', fontSize: 15 },
  addBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
