import React, { useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import ReactNativeBlobUtil from 'react-native-blob-util'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useWishlistStore } from '../store'
import { parseGoogleTakeoutZip } from '../../../shared/utils/googleTakeoutParser'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: (count: number) => void
}

export function ImportGoogleMapsModal({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const createWishlist = useWishlistStore(s => s.createWishlist)
  const addItemToWishlist = useWishlistStore(s => s.addItemToWishlist)

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.zip],
      })

      setLoading(true)

      const base64 = await ReactNativeBlobUtil.fs.readFile(result.uri, 'base64')
      const wishlists = await parseGoogleTakeoutZip(base64)

      if (wishlists.length === 0) {
        Alert.alert('找不到清單', '此 ZIP 檔內沒有找到 Google Maps 景點資料，請確認匯出的是 Google Takeout Maps 資料。')
        setLoading(false)
        return
      }

      for (const wl of wishlists) {
        const created = await createWishlist(wl.name)
        for (const place of wl.places) {
          await addItemToWishlist(created.id, {
            googlePlaceId: '',
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            photo: '',
            rating: undefined,
            category: 'attraction',
          })
        }
      }

      setLoading(false)
      onSuccess(wishlists.length)
      onClose()
    } catch (err: any) {
      setLoading(false)
      if (DocumentPicker.isCancel(err)) return
      Alert.alert('匯入失敗', err?.message ?? '請稍後再試')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>匯入 Google Maps 清單</Text>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            請先到 <Text style={{ fontWeight: '700' }}>takeout.google.com</Text> 匯出 Google Maps 資料，下載 ZIP 檔後選取。
          </Text>

          <View style={[styles.steps, { backgroundColor: colors.surfaceSecondary, borderRadius: 10 }]}>
            <Text style={[styles.step, { color: colors.textSecondary }]}>1. 前往 takeout.google.com</Text>
            <Text style={[styles.step, { color: colors.textSecondary }]}>2. 選擇「地圖」→ 下載</Text>
            <Text style={[styles.step, { color: colors.textSecondary }]}>3. 回到此畫面選取 ZIP 檔</Text>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>匯入中...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: colors.primary }]}
              onPress={handleImport}
            >
              <Text style={styles.importBtnText}>選取 ZIP 檔案 📂</Text>
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
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  steps: { padding: 14, marginBottom: 20, gap: 6 },
  step: { fontSize: 13 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  loadingText: { fontSize: 15 },
  importBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  importBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 15 },
})
