import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useBlacklistStore } from '../store/blacklistStore'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export function JoinBlacklistModal({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme()
  const join = useBlacklistStore(s => s.join)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = code.trim().length === 6 && !loading

  const handleJoin = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await join(code.trim().toUpperCase())
      setCode('')
      onSuccess()
      onClose()
    } catch {
      Alert.alert('加入失敗', '找不到此黑名單，請確認邀請碼是否正確')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>加入共享黑名單</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>輸入朋友分享的 6 位邀請碼</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={code}
            onChangeText={t => setCode(t.toUpperCase().slice(0, 6))}
            placeholder="A1B2C3"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: canSubmit ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleJoin}
              disabled={!canSubmit}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[styles.joinBtnText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>加入</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  sheet: { width: '100%', borderRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 16, fontSize: 28, fontWeight: '800', letterSpacing: 6, textAlign: 'center', marginBottom: 24 },
  btns: { gap: 12 },
  joinBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinBtnText: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 15 },
})
