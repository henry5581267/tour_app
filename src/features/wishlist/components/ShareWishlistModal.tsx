import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Clipboard, Alert } from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  visible: boolean
  inviteCode: string
  onClose: () => void
}

export function ShareWishlistModal({ visible, inviteCode, onClose }: Props) {
  const { colors } = useTheme()

  const handleCopy = () => {
    Clipboard.setString(inviteCode)
    Alert.alert('已複製', '邀請碼已複製到剪貼簿')
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>分享收藏清單</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            將邀請碼傳給朋友，讓他們加入收藏清單共同編輯
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.code, { color: colors.primary }]}>{inviteCode}</Text>
          </View>
          <View style={styles.btns}>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.primary }]} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>複製邀請碼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>關閉</Text>
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
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  codeBox: { borderRadius: 12, borderWidth: 1.5, paddingVertical: 20, alignItems: 'center', marginBottom: 24 },
  code: { fontSize: 36, fontWeight: '800', letterSpacing: 8 },
  btns: { gap: 12 },
  copyBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  copyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { paddingVertical: 10, alignItems: 'center' },
  closeBtnText: { fontSize: 15 },
})
