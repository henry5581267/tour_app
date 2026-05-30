import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props { message: string; subtext?: string }

export function EmptyState({ message, subtext }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  subtext: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 },
})
