import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  FlatList, Text, TouchableOpacity, View,
  StyleSheet, Alert, Modal, TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList, Trip } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { EmptyState } from '../../../shared/components/EmptyState'
import { CreateTripModal } from '../components/CreateTripModal'
import { ShareTripModal } from '../components/ShareTripModal'
import { JoinTripModal } from '../components/JoinTripModal'
import { useTheme } from '../../../shared/theme/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>

export function ItineraryListScreen() {
  const navigation = useNavigation<Nav>()
  const { colors } = useTheme()
  const trips = useItineraryStore(s => s.trips)
  const createTrip = useItineraryStore(s => s.createTrip)
  const removeTrip = useItineraryStore(s => s.removeTrip)
  const renameTrip = useItineraryStore(s => s.renameTrip)
  const shareTrip = useItineraryStore(s => s.shareTrip)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Trip | null>(null)
  const [renameText, setRenameText] = useState('')
  const [shareCode, setShareCode] = useState<string | null>(null)

  const handleLongPress = (item: Trip) => {
    Alert.alert(item.name, '', [
      {
        text: item.isShared ? '顯示邀請碼' : '分享行程',
        onPress: () => handleShare(item),
      },
      {
        text: '更名',
        onPress: () => { setRenameText(item.name); setRenameTarget(item) },
      },
      {
        text: item.isShared ? '離開行程' : '刪除',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            item.isShared ? '離開行程' : '刪除行程',
            item.isShared ? `確定離開「${item.name}」？` : `確定刪除「${item.name}」？`,
            [
              { text: '取消', style: 'cancel' },
              { text: item.isShared ? '離開' : '刪除', style: 'destructive', onPress: () => removeTrip(item.id) },
            ]
          ),
      },
      { text: '取消', style: 'cancel' },
    ])
  }

  const handleShare = async (item: Trip) => {
    if (item.isShared) {
      Alert.alert('已是共享行程', '此行程已在共享中，請透過「分享行程」流程取得新邀請碼')
      return
    }
    try {
      const code = await shareTrip(item.id)
      setShareCode(code)
    } catch {
      Alert.alert('分享失敗', '請確認網路連線後再試')
    }
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
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ItineraryDetail', { tripId: item.id })}
              onLongPress={() => handleLongPress(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.tripName, { color: colors.text }]}>{item.name}</Text>
                {item.isShared && (
                  <View style={[styles.sharedBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.sharedBadgeText, { color: colors.primary }]}>👥 共享</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tripMeta, { color: colors.textSecondary }]}>
                {item.days} 天 · {item.tripDays.reduce((n, d) => n + d.places.length, 0)} 個地點
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowJoin(true)}
        >
          <Text style={[styles.joinBtnText, { color: colors.primary }]}>加入行程</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <CreateTripModal visible={showCreate} onClose={() => setShowCreate(false)} onCreate={async (name, days) => { await createTrip(name, days); setShowCreate(false) }} />
      <JoinTripModal visible={showJoin} onClose={() => setShowJoin(false)} />
      <ShareTripModal visible={!!shareCode} inviteCode={shareCode ?? ''} onClose={() => setShareCode(null)} />

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
  list: { padding: 16, paddingBottom: 100 },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tripName: { fontSize: 17, fontWeight: '700', flex: 1 },
  sharedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sharedBadgeText: { fontSize: 12, fontWeight: '600' },
  tripMeta: { fontSize: 13, marginTop: 4 },
  fabRow: { position: 'absolute', right: 24, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  joinBtn: {
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  joinBtnText: { fontSize: 14, fontWeight: '700' },
  fab: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
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
