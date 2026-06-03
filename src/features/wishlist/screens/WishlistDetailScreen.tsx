import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlatList, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
import { useWishlistStore } from '../store'
import { WishlistItemRow } from '../components/WishlistItemRow'
import { ShareWishlistModal } from '../components/ShareWishlistModal'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useTheme } from '../../../shared/theme/ThemeContext'

type Props = NativeStackScreenProps<RootStackParamList, 'WishlistDetail'>

export function WishlistDetailScreen({ route, navigation }: Props) {
  const { wishlistId } = route.params
  const { colors } = useTheme()
  const wishlists = useWishlistStore(s => s.wishlists)
  const removeItemFromWishlist = useWishlistStore(s => s.removeItemFromWishlist)
  const shareWishlist = useWishlistStore(s => s.shareWishlist)
  const leaveWishlist = useWishlistStore(s => s.leaveWishlist)

  const [shareCode, setShareCode] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectMode = selectedIds.size > 0

  const wishlist = wishlists.find(w => w.id === wishlistId)
  if (!wishlist) { navigation.goBack(); return null }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLongPress = (id: string) => {
    setSelectedIds(new Set([id]))
  }

  const handlePress = (id: string) => {
    if (selectMode) toggleSelect(id)
  }

  const handleDeleteSelected = () => {
    Alert.alert('移除景點', `確定移除 ${selectedIds.size} 個景點？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '移除', style: 'destructive',
        onPress: async () => {
          for (const id of selectedIds) {
            await removeItemFromWishlist(wishlist.id, id)
          }
          setSelectedIds(new Set())
        },
      },
    ])
  }

  const handleShare = async () => {
    // 已是共享清單（建立者）→ 直接顯示現有邀請碼
    if (wishlist.isShared && wishlist.inviteCode) {
      setShareCode(wishlist.inviteCode)
      return
    }
    try {
      const code = await shareWishlist(wishlist.id)
      setShareCode(code)
    } catch (err: any) {
      Alert.alert('分享失敗', err?.message ?? '請稍後再試')
    }
  }

  const handleLeave = () => {
    Alert.alert('離開清單', `確定離開「${wishlist.name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '離開', style: 'destructive',
        onPress: async () => { await leaveWishlist(wishlist.id); navigation.goBack() },
      },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 選取模式頂部工具列 */}
      {selectMode && (
        <View style={[styles.selectBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedIds(new Set())}>
            <Text style={[styles.selectBarCancel, { color: colors.textSecondary }]}>取消</Text>
          </TouchableOpacity>
          <Text style={[styles.selectBarCount, { color: colors.text }]}>已選 {selectedIds.size} 個</Text>
          <TouchableOpacity onPress={handleDeleteSelected}>
            <Text style={[styles.selectBarDelete, { color: colors.danger }]}>移除</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={wishlist.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WishlistItemRow
            item={item}
            onRemove={() => removeItemFromWishlist(wishlist.id, item.id)}
            selectMode={selectMode}
            selected={selectedIds.has(item.id)}
            onLongPress={() => handleLongPress(item.id)}
            onPress={() => handlePress(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState message="這個清單是空的" subtext="在地點詳情頁面點擊 ☆ 加入收藏" />
        }
        contentContainerStyle={wishlist.items.length === 0 ? styles.emptyFlex : undefined}
      />

      {!selectMode && !wishlist.isShared && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleShare}>
            <Text style={[styles.btnText, { color: '#fff' }]}>分享清單 📤</Text>
          </TouchableOpacity>
        </View>
      )}

      <ShareWishlistModal
        visible={shareCode !== null}
        inviteCode={shareCode ?? ''}
        onClose={() => setShareCode(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyFlex: { flex: 1 },
  selectBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  selectBarCancel: { fontSize: 15 },
  selectBarCount: { fontSize: 15, fontWeight: '700' },
  selectBarDelete: { fontSize: 15, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
})
