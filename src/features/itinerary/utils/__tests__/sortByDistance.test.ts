import { sortByDistance } from '../sortByDistance'
import { TripPlace } from '../../../shared/types'

const place = (id: string, lat: number, lng: number): TripPlace => ({
  id,
  googlePlaceId: null,
  name: `Place ${id}`,
  category: 'attraction',
  lat,
  lng,
  address: '',
  photo: '',
})

describe('sortByDistance', () => {
  it('returns empty array for empty input', () => {
    expect(sortByDistance([])).toEqual([])
  })

  it('returns single-item array unchanged', () => {
    const p = place('a', 25.0, 121.0)
    expect(sortByDistance([p])).toEqual([p])
  })

  it('sorts by nearest neighbor starting from first place', () => {
    const origin = place('a', 25.0, 121.0)  // valid coords
    const near   = place('b', 25.1, 121.0)
    const far    = place('c', 26.0, 121.0)
    const result = sortByDistance([origin, far, near])
    expect(result.map(p => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the input array', () => {
    const input = [place('a', 0, 0), place('b', 1, 0)]
    const original = [...input]
    sortByDistance(input)
    expect(input).toEqual(original)
  })

  it('places with lat=0 AND lng=0 are treated as missing coords and placed at end', () => {
    const valid1 = place('a', 25.0, 121.0)
    const invalid = place('z', 0, 0)
    const valid2 = place('b', 25.1, 121.1)
    const result = sortByDistance([valid1, invalid, valid2])
    expect(result[result.length - 1].id).toBe('z')
  })

  it('handles all-invalid coords gracefully', () => {
    const a = place('a', 0, 0)
    const b = place('b', 0, 0)
    expect(sortByDistance([a, b]).length).toBe(2)
  })
})
