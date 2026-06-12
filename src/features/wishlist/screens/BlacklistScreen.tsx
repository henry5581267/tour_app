import React, { useState, useLayoutEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useBlacklistStore } from '../store/blacklistStore'
import { searchPlaces } from '../../../shared/api/places'
import { PlaceSearchResult } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { EmptyState } from '../../../shared/components/EmptyState'
import { JoinBlacklistModal } from '../components/JoinBlacklistModal'

export function BlacklistScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation()

  const items = useBlacklistStore(s => s.items)
  const isShared = useBlacklistStore(s => s.isShared)
  const inviteCode = useBlacklistStore(s => s.inviteCode)
  const add = useBlacklistStore(s => s.add)
  const remove = useBlacklistStore(s => s.remove)
  const share = useBlacklistStore(s => s.share)
  const leave = useBlacklistStore(s => s.leave)
  const dissolve = useBlacklistStore(s => s.dissolve)

  const isCreator = isShared && !!inviteCode
  const isMember = isShared && !inviteCode

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [sharing, setSharing] = useState(false)

  useLayoutEffect(() => {
    if (!isShared) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing
              ? <ActivityIndicator size="small" />
              : <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>📤 分享</Text>
            }
          </TouchableOpacity>
        ),
      })
    } else if (isCreator) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => Alert.alert('邀請碼', inviteCode!, [{ text: '確定' }])}
          >
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>邀請碼</Text>
          </TouchableOpacity>
        ),
      })
    } else {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={handleLeave}
          >
            <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>離開</Text>
          </TouchableOpacity>
        ),
      })
    }
  }, [isShared, isCreator, inviteCode, sharing, colors])

  const handleShare = async () => {
    setSharing(true)
    try {
      const code = await share()
      Alert.alert('共享黑名單', `邀請碼：${code}\n\n分享給朋友，他們可以在黑名單頁面輸入邀請碼加入`)
    } catch {
      Alert.alert('分享失敗', '請稍後再試')
    } finally {
      setSharing(false)
    }
  }

  const handleLeave = () => {
    Alert.alert('離開共享黑名單', '確定要離開？離開後你的本機會保留目前的黑名單快照', [
      { text: '取消', style: 'cancel' },
      { text: '離開', style: 'destructive', onPress: () => leave() },
    ])
  }

  const handleDissolve = () => {
    Alert.alert('停止共享', '確定要解散共享黑名單？所有成員將失去同步連線', [
      { text: '取消', style: 'cancel' },
      { text: '解散', style: 'destructive', onPress: () => dissolve() },
    ])
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchPlaces(query.trim())
      setResults(res.slice(0, 5))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async (place: PlaceSearchResult) => {
    await add(place)
    setQuery('')
    setResults([])
    Alert.alert('已加入黑名單', `「${place.name}」加入黑名單，AI 規劃時可選擇避開`)
  }

  const handleRemove = (id: string, name: string) => {
    Alert.alert('移除黑名單', `確定移除「${name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: () => remove(id) },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* 共享狀態列 */}
      {isShared && (
        <TouchableOpacity
          style={[styles.sharedBar, { backgroundColor: colors.primary + '18', borderBottomColor: colors.border }]}
          onLongPress={isCreator ? handleDissolve : undefined}
          activeOpacity={isCreator ? 0.6 : 1}
        >
          <Text style={[styles.sharedBarText, { color: colors.primary }]}>
            👥 共享中{isCreator ? `　邀請碼：${inviteCode}` : ''}
          </Text>
          {isCreator && (
            <Text style={[styles.sharedBarHint, { color: colors.textTertiary }]}>長按可解散</Text>
          )}
        </TouchableOpacity>
      )}

      {/* 搜尋區 */}
      {showSearch ? (
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋要加入黑名單的地點"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={handleSearch}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>搜尋</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelSearch} onPress={() => { setShowSearch(false); setQuery(''); setResults([]) }}>
            <Text style={[styles.cancelSearchText, { color: colors.textSecondary }]}>取消</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 搜尋結果 */}
      {results.length > 0 && (
        <View style={[styles.resultsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {results.map(r => (
            <TouchableOpacity
              key={r.googlePlaceId}
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
              onPress={() => handleAdd(r)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultName, { color: colors.text }]}>{r.name}</Text>
                <Text style={[styles.resultAddr, { color: colors.textSecondary }]} numberOfLines={1}>{r.address}</Text>
              </View>
              <Text style={[styles.addBtn, { color: colors.primary }]}>＋</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 黑名單列表 */}
      <FlatList
        data={items}
        keyExtractor={b => b.id}
        contentContainerStyle={items.length === 0 ? styles.emptyFlex : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            message="黑名單是空的"
            subtext="點右上角 ＋ 搜尋並加入不想去的地點，AI 規劃時可選擇避開"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onLongPress={() => handleRemove(item.id, item.name)}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <View style={styles.info}>
              <CategoryBadge category={item.category} />
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.addr, { color: colors.textSecondary }]} numberOfLines={1}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 底部列（本地時顯示加入按鈕） */}
      {!isShared && !showSearch && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.joinSharedBtn, { borderColor: colors.border }]}
            onPress={() => setShowJoin(true)}
          >
            <Text style={[styles.joinSharedText, { color: colors.text }]}>加入共享黑名單</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB 加入 */}
      {!showSearch && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setShowSearch(true)}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      <JoinBlacklistModal
        visible={showJoin}
        onClose={() => setShowJoin(false)}
        onSuccess={() => {}}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyFlex: { flex: 1 },
  listContent: { padding: 16, gap: 10, paddingBottom: 90 },
  sharedBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sharedBarText: { fontSize: 13, fontWeight: '600' },
  sharedBarHint: { fontSize: 11 },
  searchBox: { padding: 12, borderBottomWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 14 },
  searchBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelSearch: { paddingHorizontal: 4 },
  cancelSearchText: { fontSize: 14 },
  resultsBox: { borderBottomWidth: 1, borderTopWidth: 1 },
  resultRow: { padding: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  resultName: { fontSize: 14, fontWeight: '600' },
  resultAddr: { fontSize: 12, marginTop: 2 },
  addBtn: { fontSize: 22, fontWeight: '700', paddingLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  addr: { fontSize: 12, marginTop: 2 },
  bottomBar: { flexDirection: 'row', padding: 16, borderTopWidth: 1, paddingBottom: 24 },
  joinSharedBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: 'center' },
  joinSharedText: { fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', right: 24, bottom: 28,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
