import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlatList, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useWishlistStore } from '../store'
import { WishlistItemRow } from '../components/WishlistItemRow'
import { ShareWishlistModal } from '../components/ShareWishlistModal'
import { JoinWishlistModal } from '../components/JoinWishlistModal'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useTheme } from '../../../shared/theme/ThemeContext'

export function WishlistScreen() {
  const { colors } = useTheme()
  const wishlist = useWishlistStore(s => s.wishlist)
  const removeItem = useWishlistStore(s => s.removeItem)
  const shareWishlist = useWishlistStore(s => s.shareWishlist)
  const leaveSharedWishlist = useWishlistStore(s => s.leaveSharedWishlist)

  const [shareCode, setShareCode] = useState<string | null>(null)
  const [showJoin, setShowJoin] = useState(false)

  const handleShare = async () => {
    try {
      const code = await shareWishlist()
      setShareCode(code)
    } catch (err: any) {
      Alert.alert('分享失敗', err?.message ?? '請稍後再試')
    }
  }

  const handleLeave = () => {
    Alert.alert('離開收藏清單', '離開後將清除本地收藏，確定要離開？', [
      { text: '取消', style: 'cancel' },
      { text: '離開', style: 'destructive', onPress: leaveSharedWishlist },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          收藏清單{wishlist.isShared ? ' 👥' : ''}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {wishlist.items.length} 個景點
        </Text>
      </View>

      <FlatList
        data={wishlist.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WishlistItemRow item={item} onRemove={() => removeItem(item.id)} />
        )}
        ListEmptyComponent={
          <EmptyState
            message="收藏清單是空的"
            subtext="在地點詳情頁面點擊 ★ 加入收藏"
          />
        }
        contentContainerStyle={wishlist.items.length === 0 ? styles.emptyContainer : undefined}
      />

      <View style={[styles.fabRow, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowJoin(true)}
        >
          <Text style={[styles.joinBtnText, { color: colors.text }]}>加入清單</Text>
        </TouchableOpacity>
        {wishlist.isShared ? (
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleLeave}
          >
            <Text style={[styles.shareBtnText, { color: colors.danger }]}>離開清單</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
          >
            <Text style={[styles.shareBtnText, { color: '#fff' }]}>分享清單 📤</Text>
          </TouchableOpacity>
        )}
      </View>

      <ShareWishlistModal
        visible={shareCode !== null}
        inviteCode={shareCode ?? ''}
        onClose={() => setShareCode(null)}
      />
      <JoinWishlistModal
        visible={showJoin}
        onClose={() => setShowJoin(false)}
        onSuccess={() => setShowJoin(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  count: { fontSize: 13, marginTop: 2 },
  emptyContainer: { flex: 1 },
  fabRow: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 1,
  },
  joinBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 13, alignItems: 'center',
  },
  joinBtnText: { fontSize: 14, fontWeight: '600' },
  shareBtn: {
    flex: 2, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontWeight: '700' },
})
