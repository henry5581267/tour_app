import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabParamList } from '../shared/types'
import { PlacesScreen } from '../features/places/screens/PlacesScreen'
import { WishlistScreen } from '../features/wishlist/screens/WishlistScreen'
import { ItineraryListScreen } from '../features/itinerary/screens/ItineraryListScreen'
import { MapScreen } from '../features/map/screens/MapScreen'
import { useTheme } from '../shared/theme/ThemeContext'

const Tab = createBottomTabNavigator<TabParamList>()

const icon = (label: string) => () => <Text style={{ fontSize: 20 }}>{label}</Text>

export function TabNavigator() {
  const { colors, isDark, toggleTheme } = useTheme()
  const insets = useSafeAreaInsets()

  const themeBtn = () => (
    <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 16 }}>
      <Text style={{ fontSize: 22 }}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  )

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerRight: themeBtn,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: 8 + insets.bottom,
          height: 60 + insets.bottom,
        },
      }}
    >
      <Tab.Screen name="Places" component={PlacesScreen}
        options={{ title: '探索', tabBarIcon: icon('🔍') }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen}
        options={{ title: '收藏', tabBarLabel: '收藏', tabBarIcon: icon('⭐') }} />
      <Tab.Screen name="Itinerary" component={ItineraryListScreen}
        options={{ title: '行程', tabBarIcon: icon('📋') }} />
      <Tab.Screen name="Map" component={MapScreen}
        options={{ title: '地圖', tabBarIcon: icon('🗺️') }} />
    </Tab.Navigator>
  )
}
