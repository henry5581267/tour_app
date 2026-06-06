import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  FlatList, View, Text, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList, Wishlist } from '../../../shared/types'
import { useWishlistStore } from '../store'
import { CreateWishlistModal } from '../components/CreateWishlistModal'
import { JoinWishlistModal } from '../components/JoinWishlistModal'
import { ImportFromLinkModal } from '../components/ImportFromLinkModal'
import { ShareWishlistModal } from '../components/ShareWishlistModal'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useTheme } from '../../../shared/theme/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList>

export function WishlistScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<Nav>()
  const wishlists = useWishlistStore(s => s.wishlists)
  const createWishlist = useWishlistStore(s => s.createWishlist)
  const deleteWishlist = useWishlistStore(s => s.deleteWishlist)
  const renameWishlist = useWishlistStore(s => s.renameWishlist)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Wishlist | null>(null)
  const [renameText, setRenameText] = useState('')
  const [shareCode, setShareCode] = useState<string | null>(null)

  const handleRename = async () => {
    if (!renameTarget || !renameText.trim()) return
    await renameWishlist(renameTarget.id, renameText.trim())
    setRenameTarget(null)
  }

  const handleLongPress = (wl: Wishlist) => {
    const isCreator = wl.isShared && !!wl.inviteCode
    const isMember = wl.isShared && !wl.inviteCode
    const actions: any[] = [
      {
        text: '重新命名',
        onPress: () => { setRenameText(wl.name); setRenameTarget(wl) },
      },
    ]
    if (isCreator) {
      actions.push({
        text: '顯示邀請碼',
        onPress: () => setShareCode(wl.inviteCode!),
      })
      actions.push({
        text: '刪除清單',
        style: 'destructive',
        onPress: () =>
          Alert.alert('刪除清單', `確定刪除「${wl.name}」？`, [
            { text: '取消', style: 'cancel' },
            { text: '刪除', style: 'destructive', onPress: () => deleteWishlist(wl.id) },
          ]),
      })
    }
    if (isMember) {
      actions.push({
        text: '離開清單',
        style: 'destructive',
        onPress: () =>
          Alert.alert('離開清單', `確定離開「${wl.name}」？`, [
            { text: '取消', style: 'cancel' },
            { text: '離開', style: 'destructive', onPress: () => deleteWishlist(wl.id) },
          ]),
      })
    }
    if (!wl.isShared) {
      actions.push({
        text: '刪除清單',
        style: 'destructive',
        onPress: () =>
          Alert.alert('刪除清單', `確定刪除「${wl.name}」？`, [
            { text: '取消', style: 'cancel' },
            { text: '刪除', style: 'destructive', onPress: () => deleteWishlist(wl.id) },
          ]),
      })
    }
    actions.push({ text: '取消', style: 'cancel' })
    Alert.alert(wl.name, '', actions)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={wishlists}
        keyExtractor={w => w.id}
        contentContainerStyle={wishlists.length === 0 ? styles.emptyFlex : styles.listContent}
        renderItem={({ item: wl }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('WishlistDetail', { wishlistId: wl.id })}
            onLongPress={() => handleLongPress(wl)}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.cardName, { color: colors.text }]}>
                {wl.name}{wl.isShared ? ' 👥' : ''}
              </Text>
              <Text style={[styles.cardCount, { color: colors.textTertiary }]}>›</Text>
            </View>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              {wl.items.length} 個景點
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState message="還沒有收藏清單" subtext="點擊 + 新增第一個清單" />
        }
      />

      <View style={[styles.fabRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.joinBtn, { borderColor: colors.border }]}
          onPress={() => setShowJoin(true)}
        >
          <Text style={[styles.joinText, { color: colors.text }]}>加入清單</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.importBtn, { borderColor: colors.border }]}
          onPress={() => setShowImport(true)}
        >
          <Text style={[styles.importBtnText, { color: colors.text }]}>匯入 📥</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.blacklistBtn, { borderColor: colors.danger + '88' }]}
          onPress={() => navigation.navigate('Blacklist')}
        >
          <Text style={[styles.blacklistBtnText, { color: colors.danger }]}>🚫</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.createText}>＋ 新增清單</Text>
        </TouchableOpacity>
      </View>

      <CreateWishlistModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onConfirm={async (name) => {
          await createWishlist(name)
          setShowCreate(false)
        }}
      />
      <JoinWishlistModal
        visible={showJoin}
        onClose={() => setShowJoin(false)}
        onSuccess={() => setShowJoin(false)}
      />
      <ImportFromLinkModal
        visible={showImport}
        onClose={() => setShowImport(false)}
      />
      <ShareWishlistModal
        visible={shareCode !== null}
        inviteCode={shareCode ?? ''}
        onClose={() => setShareCode(null)}
      />

      {/* 重新命名 Modal */}
      <Modal
        visible={!!renameTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <View style={styles.renameOverlay}>
          <View style={[styles.renameSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.renameTitle, { color: colors.text }]}>重新命名</Text>
            <TextInput
              style={[styles.renameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              placeholder="輸入新名稱"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.renameBtns}>
              <TouchableOpacity style={styles.renameCancelBtn} onPress={() => setRenameTarget(null)}>
                <Text style={[styles.renameCancelText, { color: colors.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameConfirmBtn, { backgroundColor: renameText.trim() ? colors.primary : colors.surfaceSecondary }]}
                onPress={handleRename}
                disabled={!renameText.trim()}
              >
                <Text style={[styles.renameConfirmText, { color: renameText.trim() ? '#fff' : colors.textTertiary }]}>確定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  emptyFlex: { flex: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 17, fontWeight: '700' },
  cardCount: { fontSize: 18 },
  cardSub: { fontSize: 13, marginTop: 4 },
  fabRow: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1 },
  joinBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: 'center' },
  joinText: { fontSize: 14, fontWeight: '600' },
  importBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: 'center' },
  importBtnText: { fontSize: 13, fontWeight: '600' },
  blacklistBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'center' },
  blacklistBtnText: { fontSize: 16 },
  createBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  createText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  renameOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  renameSheet: { width: '100%', borderRadius: 20, padding: 24 },
  renameTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  renameInput: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 20 },
  renameBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  renameCancelBtn: { padding: 10 },
  renameCancelText: { fontSize: 15 },
  renameConfirmBtn: { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  renameConfirmText: { fontWeight: '700', fontSize: 15 },
})
