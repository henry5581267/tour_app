import { PlaceCategory, PlaceSearchResult } from '../types'
import { GOOGLE_PLACES_API_KEY, PLACES_BASE_URL } from '../config'
import { getCached, setCache } from '../storage/placesCache'


function photoUrl(ref: string): string {
  return `${PLACES_BASE_URL}/photo?maxwidth=800&photo_reference=${ref}&key=${GOOGLE_PLACES_API_KEY}`
}

function mapResult(item: any, category: PlaceCategory): PlaceSearchResult | null {
  if (!item.geometry?.location) return null
  return {
    googlePlaceId: item.place_id,
    name: item.name,
    address: item.formatted_address ?? item.vicinity ?? '',
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    photo: item.photos?.[0]?.photo_reference
      ? photoUrl(item.photos[0].photo_reference)
      : '',
    rating: item.rating,
    category,
  }
}

export async function searchPlaces(
  query: string,
  category: PlaceCategory
): Promise<PlaceSearchResult[]> {
  const cacheKey = `${query}:${category}`
  const cached = await getCached<PlaceSearchResult[]>(cacheKey)
  if (cached) return cached

  const url = `${PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&language=zh-TW&key=${GOOGLE_PLACES_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status}`)
  }
  const results: PlaceSearchResult[] = (data.results ?? [])
    .map((r: any) => mapResult(r, category))
    .filter((r): r is PlaceSearchResult => r !== null)
  await setCache(cacheKey, results)
  return results
}

export async function getPlaceDetails(
  placeId: string
): Promise<{ openingHours?: string }> {
  const url = `${PLACES_BASE_URL}/details/json?place_id=${placeId}&fields=opening_hours&key=${GOOGLE_PLACES_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const hours = data.result?.opening_hours?.weekday_text?.join('\n')
  return { openingHours: hours }
}
