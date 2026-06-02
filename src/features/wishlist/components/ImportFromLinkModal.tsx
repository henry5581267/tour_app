import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useWishlistStore } from '../store'
import { searchPlaces } from '../../../shared/api/places'

interface Props {
  visible: boolean
  onClose: () => void
}

export function ImportFromLinkModal({ visible, onClose }: Props) {
  const { colors } = useTheme()
  const [listName, setListName] = useState('')
  const [placeNames, setPlaceNames] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const createWishlist = useWishlistStore(s => s.createWishlist)
  const addItemToWishlist = useWishlistStore(s => s.addItemToWishlist)

  const names = placeNames
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const canSubmit = names.length > 0 && !loading

  const handleImport = async () => {
    if (!canSubmit) return
    setLoading(true)
    setProgress('')
    const name = listName.trim() || '匯入清單'
    const created = await createWishlist(name)
    let found = 0
    let failed: string[] = []

    for (let i = 0; i < names.length; i++) {
      const q = names[i]
      setProgress(`搜尋中 ${i + 1} / ${names.length}：${q}`)
      try {
        const results = await searchPlaces(q, 'attraction')
        if (results.length > 0) {
          await addItemToWishlist(created.id, results[0])
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

    let msg = `已加入 ${found} 個景點到「${name}」`
    if (failed.length > 0) msg += `\n\n找不到：${failed.join('、')}`
    Alert.alert('匯入完成', msg)
    setListName('')
    setPlaceNames('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>批次加入景點</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>清單名稱（選填）</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={listName}
            onChangeText={setListName}
            placeholder="例如：台中美食"
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            景點名稱（每行一個，共 {names.length} 個）
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
              <Text style={[styles.progressText, { color: colors.textSecondary }]} numberOfLines={1}>
                {progress}
              </Text>
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
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14 },
  textArea: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14, height: 160 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingVertical: 4 },
  progressText: { flex: 1, fontSize: 13 },
  importBtn: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  cancelText: { fontSize: 15 },
})
