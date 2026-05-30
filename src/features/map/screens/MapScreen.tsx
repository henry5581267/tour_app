import React, { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useItineraryStore } from '../../itinerary/store'
import { TripPlace } from '../../../shared/types'

const DAY_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function MapScreen() {
  const trips = useItineraryStore(s => s.trips)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(
    trips[0]?.id ?? null
  )
  const [selectedDay, setSelectedDay] = useState(0)

  const trip = trips.find(t => t.id === selectedTripId)
  const day = trip?.tripDays[selectedDay]
  const places: TripPlace[] = day?.places ?? []

  const initialRegion = places[0]
    ? { latitude: places[0].lat, longitude: places[0].lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 25.0478, longitude: 121.5318, latitudeDelta: 0.1, longitudeDelta: 0.1 }

  return (
    <SafeAreaView style={styles.container}>
      {trips.length > 1 && (
        <FlatList
          horizontal
          data={trips}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tripTab, selectedTripId === item.id && styles.tripTabActive]}
              onPress={() => { setSelectedTripId(item.id); setSelectedDay(0) }}
            >
              <Text style={styles.tripTabText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={styles.tripTabs}
        />
      )}
      {trip && (
        <FlatList
          horizontal
          data={trip.tripDays}
          keyExtractor={d => String(d.dayIndex)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.dayTab, selectedDay === item.dayIndex && styles.dayTabActive]}
              onPress={() => setSelectedDay(item.dayIndex)}
            >
              <Text style={styles.dayTabText}>Day {item.dayIndex + 1}</Text>
            </TouchableOpacity>
          )}
          style={styles.dayTabs}
        />
      )}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        region={places[0] ? initialRegion : undefined}
      >
        {places.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.name}
            description={p.address}
            pinColor={DAY_COLORS[selectedDay % DAY_COLORS.length]}
          />
        ))}
        {places.length > 1 && (
          <Polyline
            coordinates={places.map(p => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={DAY_COLORS[selectedDay % DAY_COLORS.length]}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  tripTabs: { maxHeight: 44, backgroundColor: '#fff' },
  tripTab: { paddingHorizontal: 16, paddingVertical: 10 },
  tripTabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tripTabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  dayTabs: { maxHeight: 44, backgroundColor: '#f8fafc' },
  dayTab: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  dayTabActive: { borderBottomColor: '#3b82f6' },
  dayTabText: { fontSize: 13, fontWeight: '700', color: '#555' },
})
