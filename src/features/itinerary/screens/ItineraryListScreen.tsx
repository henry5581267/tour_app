import React, { useState } from 'react'
import {
  FlatList, SafeAreaView, Text, TouchableOpacity, View,
  StyleSheet, Alert, Modal, TextInput
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList, Trip } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { EmptyState } from '../../../shared/components/EmptyState'
import { CreateTripModal } from '../components/CreateTripModal'
import { useTheme } from '../../../shared/theme/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>

export function ItineraryListScreen() {
  const navigation = useNavigation<Nav>()
  const { colors } = useTheme()
  const trips = useItineraryStore(s => s.trips)
  const createTrip = useItineraryStore(s => s.createTrip)
  const removeTrip = useItineraryStore(s => s.removeTrip)
  const renameTrip = useItineraryStore(s => s.renameTrip)
  const [showCreate, setShowCreate] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Trip | null>(null)
  const [renameText, setRenameText] = useState('')

  const handleCreate = async (name: string, days: number) => {
    await createTrip(name, days)
    setShowCreate(false)
  }

  const handleLongPress = (item: Trip) => {
    Alert.alert(item.name, '', [
      {
        text: '更名',
        onPress: () => {
          setRenameText(item.name)
          setRenameTarget(item)
        },
      },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () =>
          Alert.alert('刪除行程', `確定刪除「${item.name}」？`, [
            { text: '取消', style: 'cancel' },
            { text: '刪除', style: 'destructive', onPress: () => removeTrip(item.id) },
          ]),
      },
      { text: '取消', style: 'cancel' },
    ])
  }

  const handleRename = async () => {
    if (!renameTarget || !renameText.trim()) return
    await renameTrip(renameTarget.id, renameText.trim())
    setRenameTarget(null)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {trips.length === 0 ? (
        <EmptyState message="尚無行程" subtext="點擊 + 建立第一個旅遊行程" />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ItineraryDetail', { tripId: item.id })}
              onLongPress={() => handleLongPress(item)}
            >
              <Text style={[styles.tripName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.tripMeta, { color: colors.textSecondary }]}>
                {item.days} 天 · {item.tripDays.reduce((n, d) => n + d.places.length, 0)} 個地點
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CreateTripModal visible={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />

      {/* 更名 Modal */}
      <Modal visible={!!renameTarget} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <View style={styles.renameOverlay}>
          <View style={[styles.renameSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.renameTitle, { color: colors.text }]}>更名行程</Text>
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
  list: { padding: 16 },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tripName: { fontSize: 17, fontWeight: '700' },
  tripMeta: { fontSize: 13, marginTop: 4 },
  fab: {
    position: 'absolute', right: 24, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
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
