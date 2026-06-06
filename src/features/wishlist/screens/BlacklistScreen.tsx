import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useWishlistStore } from '../store'
import { searchPlaces } from '../../../shared/api/places'
import { PlaceSearchResult } from '../../../shared/types'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'
import { EmptyState } from '../../../shared/components/EmptyState'

export function BlacklistScreen() {
  const { colors } = useTheme()
  const blacklist = useWishlistStore(s => s.blacklist)
  const addToBlacklist = useWishlistStore(s => s.addToBlacklist)
  const removeFromBlacklist = useWishlistStore(s => s.removeFromBlacklist)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

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
    await addToBlacklist(place)
    setQuery('')
    setResults([])
    setShowSearch(false)
    Alert.alert('已加入黑名單', `「${place.name}」加入黑名單，AI 規劃時可選擇避開`)
  }

  const handleRemove = (id: string, name: string) => {
    Alert.alert('移除黑名單', `確定移除「${name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '移除', style: 'destructive', onPress: () => removeFromBlacklist(id) },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
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
        data={blacklist}
        keyExtractor={b => b.id}
        contentContainerStyle={blacklist.length === 0 ? styles.emptyFlex : styles.listContent}
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

      {/* FAB 加入 */}
      {!showSearch && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setShowSearch(true)}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyFlex: { flex: 1 },
  listContent: { padding: 16, gap: 10, paddingBottom: 90 },
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
  fab: {
    position: 'absolute', right: 24, bottom: 28,
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
