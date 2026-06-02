import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useWishlistStore } from '../store'
import { scrapeGoogleMapsList } from '../../../shared/api/googleMapsListScraper'

interface Props {
  visible: boolean
  onClose: () => void
}

export function ImportFromLinkModal({ visible, onClose }: Props) {
  const { colors } = useTheme()
  const [url, setUrl] = useState('')
  const [listName, setListName] = useState('')
  const [loading, setLoading] = useState(false)
  const createWishlist = useWishlistStore(s => s.createWishlist)
  const addItemToWishlist = useWishlistStore(s => s.addItemToWishlist)

  const canSubmit = url.trim().startsWith('http') && !loading

  const handleImport = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const places = await scrapeGoogleMapsList(url.trim())
      const name = listName.trim() || 'Google Maps 清單'
      const created = await createWishlist(name)
      for (const place of places) {
        await addItemToWishlist(created.id, {
          googlePlaceId: '',
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          photo: '',
          category: 'attraction',
        })
      }
      Alert.alert('匯入成功', `已加入 ${places.length} 個景點到「${name}」`)
      setUrl('')
      setListName('')
      onClose()
    } catch (err: any) {
      Alert.alert('匯入失敗', err?.message ?? '請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>匯入 Google Maps 清單</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>分享連結</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={url}
            onChangeText={setUrl}
            placeholder="貼上 https://maps.app.goo.gl/... 連結"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>清單名稱（選填）</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={listName}
            onChangeText={setListName}
            placeholder="例如：台中美食"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            ⚠ 此功能為實驗性，僅支援公開分享的清單，不保證所有清單都能成功匯入。
          </Text>

          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: canSubmit ? colors.primary : colors.surfaceSecondary }]}
            onPress={handleImport}
            disabled={!canSubmit}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.importBtnText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>匯入</Text>
            }
          </TouchableOpacity>

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
  hint: { fontSize: 12, marginTop: 12, lineHeight: 18 },
  importBtn: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  cancelText: { fontSize: 15 },
})
