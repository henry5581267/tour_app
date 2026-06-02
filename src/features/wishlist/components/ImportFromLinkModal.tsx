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
  const wishlists = useWishlistStore(s => s.wishlists)
  const createWishlist = useWishlistStore(s => s.createWishlist)
  const addItemToWishlist = useWishlistStore(s => s.addItemToWishlist)

  // null = 建立新清單, string = 選擇的既有清單 id
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [placeNames, setPlaceNames] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const names = placeNames.split('\n').map(s => s.trim()).filter(s => s.length > 0)
  const canSubmit = names.length > 0 && !loading && (selectedId !== null || newName.trim().length > 0)

  const handleImport = async () => {
    if (!canSubmit) return
    setLoading(true)
    setProgress('')

    let targetId: string
    let targetName: string

    if (selectedId) {
      targetId = selectedId
      targetName = wishlists.find(w => w.id === selectedId)?.name ?? '清單'
    } else {
      const created = await createWishlist(newName.trim())
      targetId = created.id
      targetName = created.name
    }

    let found = 0
    const failed: string[] = []

    for (let i = 0; i < names.length; i++) {
      const q = names[i]
      setProgress(`搜尋中 ${i + 1} / ${names.length}：${q}`)
      try {
        const results = await searchPlaces(q, 'attraction')
        if (results.length > 0) {
          await addItemToWishlist(targetId, results[0])
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

    let msg = `已加入 ${found} 個景點到「${targetName}」`
    if (failed.length > 0) msg += `\n\n找不到：${failed.join('、')}`
    Alert.alert('匯入完成', msg)
    setSelectedId(null)
    setNewName('')
    setPlaceNames('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={[styles.sheet, { backgroundColor: colors.surface }]}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>批次加入景點</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>選擇清單</Text>

          {/* 既有清單 */}
          {wishlists.map(wl => (
            <TouchableOpacity
              key={wl.id}
              style={[styles.listOption, {
                borderColor: selectedId === wl.id ? colors.primary : colors.border,
                backgroundColor: selectedId === wl.id ? colors.primary + '15' : colors.surfaceSecondary,
              }]}
              onPress={() => setSelectedId(wl.id)}
              disabled={loading}
            >
              <Text style={[styles.listOptionText, { color: colors.text }]}>{wl.name}</Text>
              <Text style={[styles.listOptionCount, { color: colors.textTertiary }]}>{wl.items.length} 個景點</Text>
            </TouchableOpacity>
          ))}

          {/* 新建清單 */}
          <TouchableOpacity
            style={[styles.listOption, {
              borderColor: selectedId === null ? colors.primary : colors.border,
              backgroundColor: selectedId === null ? colors.primary + '15' : colors.surfaceSecondary,
            }]}
            onPress={() => setSelectedId(null)}
            disabled={loading}
          >
            <Text style={[styles.listOptionText, { color: colors.primary }]}>＋ 建立新清單</Text>
          </TouchableOpacity>

          {selectedId === null && (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, marginTop: 8 }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="新清單名稱"
              placeholderTextColor={colors.textTertiary}
              editable={!loading}
            />
          )}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
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
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  listOption: { borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listOptionText: { fontSize: 14, fontWeight: '600' },
  listOptionCount: { fontSize: 12 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14 },
  textArea: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14, height: 140 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingVertical: 4 },
  progressText: { flex: 1, fontSize: 13 },
  importBtn: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  cancelText: { fontSize: 15 },
})
