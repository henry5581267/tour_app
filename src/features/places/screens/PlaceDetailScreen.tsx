import React from 'react'
import { View, Text } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
type Props = NativeStackScreenProps<RootStackParamList, 'PlaceDetail'>
export function PlaceDetailScreen({ route }: Props) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{route.params.place.name}</Text></View>
}
