import React, { useState } from 'react'
import {
  FlatList, SafeAreaView, Text, TouchableOpacity, View, StyleSheet
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { EmptyState } from '../../../shared/components/EmptyState'
import { confirmDelete } from '../../../shared/components/ConfirmDialog'
import { CreateTripModal } from '../components/CreateTripModal'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>

export function ItineraryListScreen() {
  const navigation = useNavigation<Nav>()
  const trips = useItineraryStore(s => s.trips)
  const createTrip = useItineraryStore(s => s.createTrip)
  const removeTrip = useItineraryStore(s => s.removeTrip)
  const [showModal, setShowModal] = useState(false)

  const handleCreate = async (name: string, days: number) => {
    await createTrip(name, days)
    setShowModal(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的行程</Text>
      </View>
      {trips.length === 0 ? (
        <EmptyState message="尚無行程" subtext="點擊 + 建立第一個旅遊行程" />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ItineraryDetail', { tripId: item.id })}
              onLongPress={() =>
                confirmDelete('刪除行程', `確定刪除「${item.name}」？`, () => removeTrip(item.id))
              }
            >
              <Text style={styles.tripName}>{item.name}</Text>
              <Text style={styles.tripMeta}>
                {item.days} 天 · {item.tripDays.reduce((n, d) => n + d.places.length, 0)} 個地點
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <CreateTripModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tripName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  tripMeta: { fontSize: 13, color: '#888', marginTop: 4 },
  fab: {
    position: 'absolute', right: 24, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
