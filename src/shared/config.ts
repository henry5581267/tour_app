// src/shared/config.ts
import Config from 'react-native-config'

export const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY ?? ''
export const GOOGLE_DIRECTIONS_API_KEY = Config.GOOGLE_DIRECTIONS_API_KEY ?? ''
export const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place'
export const DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions'
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// AI 服務商：'claude'（預設）、'gpt' 或 'gemini'，由 .env 的 AI_PROVIDER 控制
export const AI_PROVIDER = (Config.AI_PROVIDER ?? 'claude') as 'claude' | 'gpt' | 'gemini'
export const ANTHROPIC_API_KEY = Config.ANTHROPIC_API_KEY ?? ''
export const OPENAI_API_KEY = Config.OPENAI_API_KEY ?? ''
export const GEMINI_API_KEY = Config.GEMINI_API_KEY ?? ''
