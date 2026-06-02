import React, { useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  visible: boolean
  onClose: () => void
  onConfirm: (name: string) => void
}

export function CreateWishlistModal({ visible, onClose, onConfirm }: Props) {
  const { colors } = useTheme()
  const [name, setName] = useState('')

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
    setName('')
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>新增收藏清單</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={name}
            onChangeText={setName}
            placeholder="清單名稱（例如：美食、景點）"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            onSubmitEditing={handleConfirm}
          />
          <View style={styles.btns}>
            <TouchableOpacity style={[styles.btn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: name.trim() ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleConfirm}
              disabled={!name.trim()}
            >
              <Text style={[styles.btnText, { color: name.trim() ? '#fff' : colors.textTertiary }]}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  confirmBtn: { borderWidth: 0 },
  btnText: { fontSize: 15, fontWeight: '600' },
})
