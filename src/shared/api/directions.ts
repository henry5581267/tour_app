import { GOOGLE_DIRECTIONS_API_KEY, DIRECTIONS_BASE_URL } from '../config'
import { TransportMode } from '../types'

export interface TravelInfo {
  text: string
  seconds: number
}

export async function getTravelInfo(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  mode: TransportMode = 'walking'
): Promise<TravelInfo> {
  const origin = `${fromLat},${fromLng}`
  const dest = `${toLat},${toLng}`
  const url = `${DIRECTIONS_BASE_URL}/json?origin=${origin}&destination=${dest}&mode=${mode}&language=zh-TW&key=${GOOGLE_DIRECTIONS_API_KEY}`
  const res = await fetch(url).catch(() => null)
  if (!res?.ok) return { text: '', seconds: 999999 }
  const data = await res.json()
  const leg = data.routes?.[0]?.legs?.[0]
  return {
    text: leg?.duration?.text ?? '',
    seconds: leg?.duration?.value ?? 999999,
  }
}

// 保留舊函式相容性
export async function getTravelTime(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  mode: TransportMode = 'walking'
): Promise<string> {
  const info = await getTravelInfo(fromLat, fromLng, toLat, toLng, mode)
  return info.text
}
