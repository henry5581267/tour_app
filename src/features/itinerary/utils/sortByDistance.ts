import { TripPlace } from '../../../shared/types'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isValidCoord(p: TripPlace): boolean {
  return !(p.lat === 0 && p.lng === 0)
}

export function sortByDistance(places: TripPlace[]): TripPlace[] {
  if (places.length <= 1) return [...places]

  const valid = places.filter(isValidCoord)
  const invalid = places.filter(p => !isValidCoord(p))

  if (valid.length === 0) return [...places]

  const result: TripPlace[] = [valid[0]]
  const remaining = valid.slice(1)

  while (remaining.length > 0) {
    const last = result[result.length - 1]
    let nearestIdx = 0
    let nearestDist = Infinity
    remaining.forEach((p, idx) => {
      const d = haversineKm(last.lat, last.lng, p.lat, p.lng)
      if (d < nearestDist) { nearestDist = d; nearestIdx = idx }
    })
    result.push(remaining.splice(nearestIdx, 1)[0])
  }

  return [...result, ...invalid]
}
