import React, { useState } from 'react'
import { FlatList, SafeAreaView, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlaceCategory, PlaceSearchResult, RootStackParamList } from '../../../shared/types'
import { searchPlaces } from '../../../shared/api/places'
import { PlaceCard } from '../../../shared/components/PlaceCard'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SearchBar } from '../components/SearchBar'
import { useTheme } from '../../../shared/theme/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>

const ALL_CATEGORIES: PlaceCategory[] = ['attraction', 'restaurant', 'activity']

export function PlacesScreen() {
  const navigation = useNavigation<Nav>()
  const { colors } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const allResults = await Promise.allSettled(
        ALL_CATEGORIES.map(cat => searchPlaces(query.trim(), cat))
      )
      const combined: PlaceSearchResult[] = allResults.flatMap(r =>
        r.status === 'fulfilled' ? r.value : []
      )
      combined.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      setResults(combined)
    } catch {
      setError('搜尋失敗，請檢查網路連線')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSearch} />
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState message={error} subtext="搜尋失敗" />
      ) : results.length === 0 ? (
        <EmptyState message="搜尋景點、餐廳或遊玩" subtext="輸入關鍵字開始探索" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `${item.googlePlaceId}-${item.category}`}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              onPress={() => navigation.navigate('PlaceDetail', { place: item })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 16 },
})
