import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './src/shared/theme/ThemeContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { useItineraryStore } from './src/features/itinerary/store'
import { useWishlistStore } from './src/features/wishlist/store'
import { useBlacklistStore } from './src/features/wishlist/store/blacklistStore'

function Root() {
  const loadTrips = useItineraryStore(s => s.loadTrips)
  useEffect(() => {
    loadTrips()
    useWishlistStore.getState().loadWishlists()
    useBlacklistStore.getState().load()
  }, [])
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
