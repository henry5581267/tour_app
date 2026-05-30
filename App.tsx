import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './src/shared/theme/ThemeContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { useItineraryStore } from './src/features/itinerary/store'

function Root() {
  const loadTrips = useItineraryStore(s => s.loadTrips)
  useEffect(() => { loadTrips() }, [])
  return <AppNavigator />
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
