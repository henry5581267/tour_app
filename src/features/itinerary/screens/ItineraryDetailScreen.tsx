import React from 'react'
import { ScrollView, SafeAreaView, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { DaySection } from '../components/DaySection'
import { EmptyState } from '../../../shared/components/EmptyState'

type Props = NativeStackScreenProps<RootStackParamList, 'ItineraryDetail'>

export function ItineraryDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params
  const trips = useItineraryStore(s => s.trips)
  const reorderDay = useItineraryStore(s => s.reorderDay)
  const removePlaceFromTrip = useItineraryStore(s => s.removePlaceFromTrip)
  const autoSortDay = useItineraryStore(s => s.autoSortDay)

  const trip = trips.find(t => t.id === tripId)

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
            onReorder={newOrder => reorderDay(tripId, day.dayIndex, newOrder)}
            onDelete={placeId => removePlaceFromTrip(tripId, day.dayIndex, placeId)}
            onAutoSort={() => autoSortDay(tripId, day.dayIndex)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingVertical: 8 },
})
