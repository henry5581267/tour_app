import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'

interface Props {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
}

export function SearchBar({ value, onChangeText, onSubmit }: Props) {
  const { colors } = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="搜尋景點、餐廳、遊玩..."
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        autoCapitalize="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: { height: 44, fontSize: 15 },
})
