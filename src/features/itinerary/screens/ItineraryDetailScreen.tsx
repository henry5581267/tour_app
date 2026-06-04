import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScrollView, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList, TripPlace } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { DaySection } from '../components/DaySection'
import { EmptyState } from '../../../shared/components/EmptyState'
import { getTravelTime } from '../../../shared/api/directions'
import { ManualPlaceModal } from '../components/ManualPlaceModal'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { getDeviceId } from '../../../shared/firebase/deviceId'

type Props = NativeStackScreenProps<RootStackParamList, 'ItineraryDetail'>
type TravelTimes = Record<number, Record<number, string>>

export function ItineraryDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const trips = useItineraryStore(s => s.trips)
  const dayLocks = useItineraryStore(s => s.dayLocks)
  const sortingDayKey = useItineraryStore(s => s.sortingDayKey)
  const reorderDay = useItineraryStore(s => s.reorderDay)
  const removePlaceFromTrip = useItineraryStore(s => s.removePlaceFromTrip)
  const autoSortDay = useItineraryStore(s => s.autoSortDay)
  const addPlaceToTrip = useItineraryStore(s => s.addPlaceToTrip)
  const acquireDayLock = useItineraryStore(s => s.acquireDayLock)
  const releaseAllLocksForTrip = useItineraryStore(s => s.releaseAllLocksForTrip)

  const [travelTimes, setTravelTimes] = useState<TravelTimes>({})
  const [showManual, setShowManual] = useState(false)
  const [manualDay, setManualDay] = useState(0)
  const [myDeviceId, setMyDeviceId] = useState<string | null>(null)

  const trip = trips.find(t => t.id === tripId)

  useEffect(() => { getDeviceId().then(setMyDeviceId) }, [])

  useEffect(() => {
    if (!trip?.isShared) return
    return () => { releaseAllLocksForTrip(tripId) }
  }, [trip?.isShared, tripId])

  useEffect(() => {
    if (!trip) return
    const fetchAll = async () => {
      const result: TravelTimes = {}
      for (const day of trip.tripDays) {
        result[day.dayIndex] = {}
        for (let i = 0; i < day.places.length - 1; i++) {
          const from = day.places[i]
          const to = day.places[i + 1]
          result[day.dayIndex][i] = await getTravelTime(from.lat, from.lng, to.lat, to.lng).catch(() => '')
        }
      }
      setTravelTimes(result)
    }
    fetchAll()
  }, [JSON.stringify(trip?.tripDays)])

  React.useLayoutEffect(() => {
    if (trip) navigation.setOptions({ title: trip.name })
  }, [trip?.name])

  const withLock = useCallback(async (dayIndex: number, action: () => Promise<void>) => {
    if (!trip?.isShared) { await action(); return }
    const acquired = await acquireDayLock(tripId, dayIndex)
    if (!acquired) {
      Alert.alert('無法編輯', '此天的行程正在被其他人編輯，請稍後再試')
      return
    }
    await action()
  }, [trip?.isShared, tripId, acquireDayLock])

  if (!trip) return <EmptyState message="找不到行程" />

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {trip.tripDays.map(day => {
          const lockKey = `${tripId}-${day.dayIndex}`
          const lock = dayLocks[lockKey]
          const lockedBy = lock?.lockedBy
          const isMyLock = !!lockedBy && lockedBy === myDeviceId
          return (
            <DaySection
              key={day.dayIndex}
              day={day}
              travelTimes={travelTimes[day.dayIndex] ?? {}}
              isSorting={sortingDayKey === lockKey}
              lockedBy={lockedBy}
              isMyLock={isMyLock}
              onReorder={newOrder => withLock(day.dayIndex, () => reorderDay(tripId, day.dayIndex, newOrder))}
              onDelete={placeId => withLock(day.dayIndex, () => removePlaceFromTrip(tripId, day.dayIndex, placeId))}
              onAutoSort={() => withLock(day.dayIndex, () => autoSortDay(tripId, day.dayIndex))}
              onAddManual={async () => {
                if (trip.isShared) {
                  const acquired = await acquireDayLock(tripId, day.dayIndex)
                  if (!acquired) { Alert.alert('無法編輯', '此天的行程正在被其他人編輯，請稍後再試'); return }
                }
                setManualDay(day.dayIndex)
                setShowManual(true)
              }}
            />
          )
        })}
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={() => { setManualDay(0); setShowManual(true) }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <ManualPlaceModal
        visible={showManual}
        dayIndex={manualDay}
        onClose={() => setShowManual(false)}
        onAdd={(place: TripPlace) => {
          addPlaceToTrip(tripId, manualDay, place)
          setShowManual(false)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 8 },
  fab: {
    position: 'absolute', right: 24, bottom: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
