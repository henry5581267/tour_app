import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { PlaceCategory, TripPlace } from '../../../shared/types'
import { useTheme } from '../../../shared/theme/ThemeContext'

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
  const { colors } = useTheme()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<PlaceCategory>('attraction')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ id: '', googlePlaceId: null, name: name.trim(), category, lat: 0, lng: 0, address: address.trim(), photo: '' })
    setName('')
    setAddress('')
    setCategory('attraction')
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: colors.text }]}>手動新增地點</Text>
            <Text style={[styles.note, { color: colors.textTertiary }]}>※ 手動新增的地點沒有座標，路線優化時會排在最後</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>地點名稱 *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              value={name}
              onChangeText={setName}
              placeholder="例如：家附近咖啡廳"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>地址（選填）</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              value={address}
              onChangeText={setAddress}
              placeholder="例如：台北市信義區..."
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>分類</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catBtn, { backgroundColor: category === c.key ? colors.primary : colors.surfaceSecondary }]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={[styles.catText, { color: category === c.key ? '#fff' : colors.textSecondary }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: name.trim() ? colors.primary : colors.surfaceSecondary }]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Text style={[styles.addText, { color: name.trim() ? '#fff' : colors.textTertiary }]}>加入第 {dayIndex + 1} 天</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  note: { fontSize: 12, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  catText: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { fontSize: 15 },
  addBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  addText: { fontWeight: '700', fontSize: 14 },
})


