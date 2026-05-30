import React, { useEffect, useState } from 'react'
import { ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList, TripPlace } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { DaySection } from '../components/DaySection'
import { EmptyState } from '../../../shared/components/EmptyState'
import { getTravelTime } from '../../../shared/api/directions'
import { ManualPlaceModal } from '../components/ManualPlaceModal'

type Props = NativeStackScreenProps<RootStackParamList, 'ItineraryDetail'>

type TravelTimes = Record<number, Record<number, string>>

export function ItineraryDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const trips = useItineraryStore(s => s.trips)
  const reorderDay = useItineraryStore(s => s.reorderDay)
  const removePlaceFromTrip = useItineraryStore(s => s.removePlaceFromTrip)
  const autoSortDay = useItineraryStore(s => s.autoSortDay)
  const addPlaceToTrip = useItineraryStore(s => s.addPlaceToTrip)
  const [travelTimes, setTravelTimes] = useState<TravelTimes>({})
  const [showManual, setShowManual] = useState(false)
  const [manualDay, setManualDay] = useState(0)

  const trip = trips.find(t => t.id === tripId)

  useEffect(() => {
    if (!trip) return
    const fetchAll = async () => {
      const result: TravelTimes = {}
      for (const day of trip.tripDays) {
        result[day.dayIndex] = {}
        for (let i = 0; i < day.places.length - 1; i++) {
          const from = day.places[i]
          const to = day.places[i + 1]
          const time = await getTravelTime(from.lat, from.lng, to.lat, to.lng).catch(() => '')
          result[day.dayIndex][i] = time
        }
      }
      setTravelTimes(result)
    }
    fetchAll()
  }, [trip?.id])

  React.useLayoutEffect(() => {
    if (trip) navigation.setOptions({ title: trip.name })
  }, [trip?.name])

  if (!trip) return <EmptyState message="找不到行程" />

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {trip.tripDays.map(day => (
          <DaySection
            key={day.dayIndex}
            day={day}
            travelTimes={travelTimes[day.dayIndex] ?? {}}
            onReorder={newOrder => reorderDay(tripId, day.dayIndex, newOrder)}
            onDelete={placeId => removePlaceFromTrip(tripId, day.dayIndex, placeId)}
            onAutoSort={() => autoSortDay(tripId, day.dayIndex)}
            onAddManual={() => { setManualDay(day.dayIndex); setShowManual(true) }}
          />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { setManualDay(0); setShowManual(true) }}
      >
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingVertical: 8 },
  fab: {
    position: 'absolute', right: 24, bottom: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
