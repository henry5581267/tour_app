import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { TabParamList } from '../shared/types'
import { PlacesScreen } from '../features/places/screens/PlacesScreen'
import { ItineraryListScreen } from '../features/itinerary/screens/ItineraryListScreen'
import { MapScreen } from '../features/map/screens/MapScreen'

const Tab = createBottomTabNavigator<TabParamList>()

const icon = (label: string) => () => <Text style={{ fontSize: 20 }}>{label}</Text>

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarStyle: { paddingBottom: 8, height: 60 },
      }}
    >
      <Tab.Screen name="Places" component={PlacesScreen}
        options={{ title: '探索', tabBarIcon: icon('🔍') }} />
      <Tab.Screen name="Itinerary" component={ItineraryListScreen}
        options={{ title: '行程', tabBarIcon: icon('📋') }} />
      <Tab.Screen name="Map" component={MapScreen}
        options={{ title: '地圖', tabBarIcon: icon('🗺️') }} />
    </Tab.Navigator>
  )
}
