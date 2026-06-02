import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../shared/types'
import { TabNavigator } from './TabNavigator'
import { PlaceDetailScreen } from '../features/places/screens/PlaceDetailScreen'
import { ItineraryDetailScreen } from '../features/itinerary/screens/ItineraryDetailScreen'
import { AITripPreviewScreen } from '../features/itinerary/screens/AITripPreviewScreen'
import { WishlistDetailScreen } from '../features/wishlist/screens/WishlistDetailScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen}
          options={{ title: '地點詳情', headerBackTitle: '返回' }} />
        <Stack.Screen name="ItineraryDetail" component={ItineraryDetailScreen}
          options={{ title: '行程詳細', headerBackTitle: '返回' }} />
        <Stack.Screen name="AITripPreview" component={AITripPreviewScreen}
          options={{ title: 'AI 行程預覽', headerBackTitle: '返回' }} />
        <Stack.Screen name="WishlistDetail" component={WishlistDetailScreen}
          options={{ title: '收藏清單', headerBackTitle: '返回' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
