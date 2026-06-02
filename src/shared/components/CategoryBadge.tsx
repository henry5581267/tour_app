import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const TYPE_LABEL: Record<string, string> = {
  restaurant: '餐廳', cafe: '咖啡廳', bar: '酒吧', bakery: '麵包店',
  meal_takeaway: '外帶', meal_delivery: '外送', night_club: '夜店',
  food: '餐飲', liquor_store: '酒類',
  tourist_attraction: '景點', museum: '博物館', park: '公園',
  art_gallery: '藝廊', zoo: '動物園', aquarium: '水族館',
  amusement_park: '遊樂園', church: '教堂', temple: '寺廟',
  library: '圖書館', stadium: '體育館', natural_feature: '自然景觀',
  shopping_mall: '購物中心', department_store: '百貨公司',
  convenience_store: '便利商店', supermarket: '超市', store: '商店',
  clothing_store: '服飾', electronics_store: '電子', book_store: '書店',
  bank: '銀行', atm: 'ATM', hospital: '醫院', pharmacy: '藥局',
  doctor: '診所', dentist: '牙科', beauty_salon: '美容', post_office: '郵局',
  lodging: '住宿', hotel: '住宿',
  gas_station: '加油站', car_rental: '租車',
  train_station: '火車站', subway_station: '捷運站',
  bus_station: '公車站', airport: '機場', transit_station: '車站',
  gym: '健身房', spa: 'SPA', movie_theater: '電影院', bowling_alley: '保齡球',
  school: '學校', university: '大學',
  // AI 分類向下相容
  attraction: '景點', activity: '遊玩',
}

const TYPE_COLOR: Record<string, string> = {
  restaurant: '#ef4444', cafe: '#f97316', bar: '#8b5cf6',
  bakery: '#f59e0b', meal_takeaway: '#f97316', meal_delivery: '#f97316',
  night_club: '#8b5cf6', food: '#ef4444', liquor_store: '#8b5cf6',
  tourist_attraction: '#3b82f6', museum: '#3b82f6', park: '#10b981',
  art_gallery: '#6366f1', zoo: '#10b981', aquarium: '#0ea5e9',
  amusement_park: '#f97316', church: '#64748b', temple: '#f59e0b',
  library: '#6366f1', stadium: '#10b981',
  shopping_mall: '#ec4899', department_store: '#ec4899',
  convenience_store: '#10b981', supermarket: '#10b981',
  store: '#ec4899', clothing_store: '#ec4899', electronics_store: '#6366f1',
  bank: '#64748b', atm: '#64748b', hospital: '#ef4444',
  pharmacy: '#10b981', doctor: '#ef4444', dentist: '#0ea5e9',
  lodging: '#6366f1', hotel: '#6366f1',
  gas_station: '#f59e0b', car_rental: '#64748b',
  train_station: '#64748b', subway_station: '#64748b',
  bus_station: '#64748b', airport: '#64748b', transit_station: '#64748b',
  gym: '#10b981', spa: '#ec4899', movie_theater: '#8b5cf6',
  attraction: '#3b82f6', activity: '#10b981',
}

export function CategoryBadge({ category }: { category: string }) {
  const label = TYPE_LABEL[category] ?? category.replace(/_/g, ' ')
  const color = TYPE_COLOR[category] ?? '#64748b'
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  label: { color: '#fff', fontSize: 11, fontWeight: '700' },
})
