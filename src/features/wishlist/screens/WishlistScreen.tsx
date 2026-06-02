import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlatList, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
import { useWishlistStore } from '../store'
import { CreateWishlistModal } from '../components/CreateWishlistModal'
import { JoinWishlistModal } from '../components/JoinWishlistModal'
import { ImportFromLinkModal } from '../components/ImportFromLinkModal'
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

  const handleLongPress = (id: string, name: string, isShared: boolean) => {
    Alert.alert(name, '', [
      {
        text: '重新命名',
        onPress: () => {
          Alert.prompt('重新命名', '', (text) => {
            if (text?.trim()) renameWishlist(id, text.trim())
          }, 'plain-text', name)
        },
      },
      !isShared
        ? {
            text: '刪除',
            style: 'destructive',
            onPress: () =>
              Alert.alert('刪除清單', `確定刪除「${name}」？`, [
                { text: '取消', style: 'cancel' },
                { text: '刪除', style: 'destructive', onPress: () => deleteWishlist(id) },
              ]),
          }
        : { text: '取消', style: 'cancel' },
    ])
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
            onLongPress={() => handleLongPress(wl.id, wl.name, wl.isShared)}
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
  createBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  createText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
