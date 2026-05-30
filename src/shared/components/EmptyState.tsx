import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

interface Props { message: string; subtext?: string }

export function EmptyState({ message, subtext }: Props) {
  const { colors } = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {subtext && <Text style={[styles.subtext, { color: colors.textSecondary }]}>{subtext}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  subtext: { fontSize: 14, textAlign: 'center', marginTop: 8 },
})
