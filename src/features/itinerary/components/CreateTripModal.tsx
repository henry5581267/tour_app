import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native'

interface Props {
  visible: boolean
  onClose: () => void
  onCreate: (name: string, days: number) => void
}

export function CreateTripModal({ visible, onClose, onCreate }: Props) {
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
        <SafeAreaView style={styles.sheet}>
          <Text style={styles.title}>建立新行程</Text>
          <Text style={styles.label}>行程名稱</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例如：東京五日遊"
            placeholderTextColor="#aaa"
          />
          <Text style={styles.label}>天數</Text>
          <TextInput
            style={styles.input}
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor="#aaa"
          />
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!name.trim()}
            >
              <Text style={styles.createText}>建立</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1a1a1a', marginBottom: 16,
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#888', fontSize: 15 },
  createBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  createBtnDisabled: { backgroundColor: '#93c5fd' },
  createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
