import { GOOGLE_DIRECTIONS_API_KEY, DIRECTIONS_BASE_URL } from '../config'

export async function getTravelTime(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<string> {
  const origin = `${fromLat},${fromLng}`
  const dest = `${toLat},${toLng}`
  const url = `${DIRECTIONS_BASE_URL}/json?origin=${origin}&destination=${dest}&mode=walking&key=${GOOGLE_DIRECTIONS_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return ''
  const data = await res.json()
  return data.routes?.[0]?.legs?.[0]?.duration?.text ?? ''
}
