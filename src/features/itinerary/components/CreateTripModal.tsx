import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  visible: boolean
  onClose: () => void
  onCreate: (name: string, days: number) => void
}

export function CreateTripModal({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme()
  const [name, setName] = useState('')
  const [days, setDays] = useState('3')

  const handleCreate = () => {
    const d = parseInt(days, 10)
    if (!name.trim() || isNaN(d) || d < 1) return
    onCreate(name.trim(), d)
    setName('')
    setDays('3')
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>建立新行程</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>行程名稱</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={name}
            onChangeText={setName}
            placeholder="例如：東京五日遊"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>天數</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: name.trim() ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleCreate}
              disabled={!name.trim()}
            >
              <Text style={[styles.createText, { color: name.trim() ? '#fff' : colors.textTertiary }]}>建立</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { fontSize: 15 },
  createBtn: { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  createText: { fontWeight: '700', fontSize: 15 },
})


