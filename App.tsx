import React, { useEffect } from 'react'
import { AppNavigator } from './src/navigation/AppNavigator'
import { useItineraryStore } from './src/features/itinerary/store'

export default function App() {
  const loadTrips = useItineraryStore(s => s.loadTrips)
  useEffect(() => { loadTrips() }, [])
  return <AppNavigator />
}
