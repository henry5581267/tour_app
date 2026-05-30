import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'

interface Props {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
}

export function SearchBar({ value, onChangeText, onSubmit }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="搜尋景點、餐廳、遊玩..."
        placeholderTextColor="#aaa"
        returnKeyType="search"
        autoCapitalize="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: { height: 44, fontSize: 15, color: '#1a1a1a' },
})
