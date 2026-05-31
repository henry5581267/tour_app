import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { generateAIItinerary } from '../../../shared/api/claudeItinerary'
import { GeneratedItinerary } from '../../../shared/types'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: (itinerary: GeneratedItinerary) => void
}

export function AITripModal({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme()
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(3)
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = destination.trim().length > 0 && !loading

  const handleGenerate = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const itinerary = await generateAIItinerary({
        destination: destination.trim(),
        days,
        preferences,
      })
      setDestination('')
      setDays(3)
      setPreferences('')
      onSuccess(itinerary)
    } catch (err: any) {
      Alert.alert('規劃失敗', err?.message ?? 'AI服務暫時無法使用，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>✨ AI 行程規劃</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>目的地</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="例如：台中、京都、峇里島"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>天數</Text>
          <View style={styles.daysRow}>
            <TouchableOpacity
              style={[styles.dayBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setDays(d => Math.max(1, d - 1))}
              disabled={loading}
            >
              <Text style={[styles.dayBtnText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.daysNum, { color: colors.text }]}>{days} 天</Text>
            <TouchableOpacity
              style={[styles.dayBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setDays(d => Math.min(14, d + 1))}
              disabled={loading}
            >
              <Text style={[styles.dayBtnText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>偏好描述（選填）</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={preferences}
            onChangeText={setPreferences}
            placeholder="例如：喜歡文創景點、台灣小吃，不喜歡人擠人"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: canSubmit ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleGenerate}
              disabled={!canSubmit}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={[styles.generateBtnText, { color: '#fff', marginLeft: 8 }]}>AI 規劃中...</Text>
                </View>
              ) : (
                <Text style={[styles.generateBtnText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>
                  ✨ 開始規劃
                </Text>
              )}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dayBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayBtnText: { fontSize: 20, fontWeight: '600' },
  daysNum: { fontSize: 18, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  textArea: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14, height: 80 },
  btns: { marginTop: 24, gap: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  generateBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  generateBtnText: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 15 },
})
