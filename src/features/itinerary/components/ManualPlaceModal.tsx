import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView
} from 'react-native'
import { PlaceCategory, TripPlace } from '../../../shared/types'

const CATEGORIES: { key: PlaceCategory; label: string }[] = [
  { key: 'attraction', label: '景點' },
  { key: 'restaurant', label: '餐廳' },
  { key: 'activity', label: '遊玩' },
]

interface Props {
  visible: boolean
  dayIndex: number
  onClose: () => void
  onAdd: (place: TripPlace) => void
}

export function ManualPlaceModal({ visible, dayIndex, onClose, onAdd }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<PlaceCategory>('attraction')

  const handleAdd = () => {
    if (!name.trim()) return
    const place: TripPlace = {
      id: '',
      googlePlaceId: null,
      name: name.trim(),
      category,
      lat: 0,
      lng: 0,
      address: address.trim(),
      photo: '',
    }
    onAdd(place)
    setName('')
    setAddress('')
    setCategory('attraction')
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>手動新增地點</Text>
            <Text style={styles.note}>※ 手動新增的地點沒有座標，路線優化時會排在最後</Text>
            <Text style={styles.label}>地點名稱 *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="例如：家附近咖啡廳"
              placeholderTextColor="#aaa"
            />
            <Text style={styles.label}>地址（選填）</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="例如：台北市信義區..."
              placeholderTextColor="#aaa"
            />
            <Text style={styles.label}>分類</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catBtn, category === c.key && styles.catBtnActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={[styles.catText, category === c.key && styles.catTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Text style={styles.addText}>加入第 {dayIndex + 1} 天</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  note: { fontSize: 12, color: '#94a3b8', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1a1a1a', marginBottom: 16,
  },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  catBtnActive: { backgroundColor: '#3b82f6' },
  catText: { fontSize: 14, fontWeight: '600', color: '#555' },
  catTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#888', fontSize: 15 },
  addBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  addBtnDisabled: { backgroundColor: '#93c5fd' },
  addText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
