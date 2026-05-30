import React from 'react'
import { View, Text } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
type Props = NativeStackScreenProps<RootStackParamList, 'ItineraryDetail'>
export function ItineraryDetailScreen({ route }: Props) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Trip: {route.params.tripId}</Text></View>
}
