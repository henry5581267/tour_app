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

  const wishlist = wishlists.find(w => w.id === wishlistId)
  if (!wishlist) {
    navigation.goBack()
    return null
  }

  const handleShare = async () => {
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
        onPress: async () => {
          await leaveWishlist(wishlist.id)
          navigation.goBack()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={wishlist.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WishlistItemRow
            item={item}
            onRemove={() => removeItemFromWishlist(wishlist.id, item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            message="這個清單是空的"
            subtext="在地點詳情頁面點擊 ☆ 加入收藏"
          />
        }
        contentContainerStyle={wishlist.items.length === 0 ? styles.emptyFlex : undefined}
      />

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {wishlist.isShared ? (
          <TouchableOpacity style={[styles.btn, { borderColor: colors.danger, borderWidth: 1.5 }]} onPress={handleLeave}>
            <Text style={[styles.btnText, { color: colors.danger }]}>離開清單</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleShare}>
            <Text style={[styles.btnText, { color: '#fff' }]}>分享清單 📤</Text>
          </TouchableOpacity>
        )}
      </View>

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
  footer: { padding: 16, borderTopWidth: 1 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
})
