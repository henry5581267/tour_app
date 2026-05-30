import { Alert } from 'react-native'

export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void
) {
  Alert.alert(title, message, [
    { text: '取消', style: 'cancel' },
    { text: '刪除', style: 'destructive', onPress: onConfirm },
  ])
}
