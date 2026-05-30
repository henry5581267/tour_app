// src/shared/config.ts
import Config from 'react-native-config'

export const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY ?? ''
export const GOOGLE_DIRECTIONS_API_KEY = Config.GOOGLE_DIRECTIONS_API_KEY ?? ''
export const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place'
export const DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions'
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
