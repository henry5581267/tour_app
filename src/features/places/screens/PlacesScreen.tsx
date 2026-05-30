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
import { CategoryTabs } from '../components/CategoryTabs'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>

export function PlacesScreen() {
  const navigation = useNavigation<Nav>()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PlaceCategory>('attraction')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await searchPlaces(query.trim(), category)
      setResults(data)
    } catch {
      setError('搜尋失敗，請檢查網路連線')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (cat: PlaceCategory) => {
    setCategory(cat)
    setResults([])
  }

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSearch} />
      <CategoryTabs active={category} onChange={handleCategoryChange} />
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState message={error} subtext="搜尋失敗" />
      ) : results.length === 0 ? (
        <EmptyState message="搜尋景點、餐廳或遊玩" subtext="輸入關鍵字開始探索" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.googlePlaceId}
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { paddingBottom: 16 },
})
