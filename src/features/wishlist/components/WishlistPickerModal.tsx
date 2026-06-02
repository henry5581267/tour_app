import React, { useState } from 'react'
import {
  Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { useWishlistStore } from '../store'
import { PlaceSearchResult } from '../../../shared/types'

interface Props {
  visible: boolean
  place: PlaceSearchResult
  onClose: () => void
}

export function WishlistPickerModal({ visible, place, onClose }: Props) {
  const { colors } = useTheme()
  const wishlists = useWishlistStore(s => s.wishlists)
  const addItemToWishlist = useWishlistStore(s => s.addItemToWishlist)
  const removeItemFromWishlist = useWishlistStore(s => s.removeItemFromWishlist)
  const createWishlist = useWishlistStore(s => s.createWishlist)
  const getWishlistsContaining = useWishlistStore(s => s.getWishlistsContaining)

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  const containingIds = getWishlistsContaining(place.googlePlaceId, place.name)

  const handleToggle = async (wishlistId: string) => {
    if (containingIds.includes(wishlistId)) {
      const wl = wishlists.find(w => w.id === wishlistId)
      const item = wl?.items.find(i =>
        place.googlePlaceId ? i.googlePlaceId === place.googlePlaceId : i.name === place.name
      )
      if (item) await removeItemFromWishlist(wishlistId, item.id)
    } else {
      await addItemToWishlist(wishlistId, place)
    }
  }

  const handleCreateAndAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const wl = await createWishlist(trimmed)
    await addItemToWishlist(wl.id, place)
    setNewName('')
    setShowNew(false)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>加入收藏清單</Text>
          <Text style={[styles.placeName, { color: colors.textSecondary }]} numberOfLines={1}>
            {place.name}
          </Text>

          <FlatList
            data={wishlists}
            keyExtractor={w => w.id}
            style={styles.list}
            renderItem={({ item: wl }) => {
              const inList = containingIds.includes(wl.id)
              return (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: colors.border }]}
                  onPress={() => handleToggle(wl.id)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.wlName, { color: colors.text }]}>{wl.name}</Text>
                    <Text style={[styles.wlCount, { color: colors.textTertiary }]}>{wl.items.length} 個景點</Text>
                  </View>
                  <View style={[styles.check, {
                    backgroundColor: inList ? colors.primary : 'transparent',
                    borderColor: inList ? colors.primary : colors.border,
                  }]}>
                    {inList && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>尚無清單，請新增</Text>
            }
          />

          {showNew ? (
            <View style={styles.newRow}>
              <TextInput
                style={[styles.newInput, { color: colors.text, borderColor: colors.primary, backgroundColor: colors.surfaceSecondary }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="清單名稱"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.newConfirm, { backgroundColor: newName.trim() ? colors.primary : colors.surfaceSecondary }]}
                onPress={handleCreateAndAdd}
                disabled={!newName.trim()}
              >
                <Text style={{ color: newName.trim() ? '#fff' : colors.textTertiary, fontWeight: '600' }}>新增</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addNewBtn, { borderColor: colors.border }]}
              onPress={() => setShowNew(true)}
            >
              <Text style={[styles.addNewText, { color: colors.primary }]}>➕ 新增清單</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.doneBtnText}>完成</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  placeName: { fontSize: 13, marginBottom: 16 },
  list: { maxHeight: 260 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  rowLeft: { flex: 1 },
  wlName: { fontSize: 15, fontWeight: '600' },
  wlCount: { fontSize: 12, marginTop: 2 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', paddingVertical: 20 },
  newRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  newInput: { flex: 1, borderWidth: 1.5, borderRadius: 8, padding: 10, fontSize: 14 },
  newConfirm: { borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  addNewBtn: { marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addNewText: { fontSize: 14, fontWeight: '600' },
  doneBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
