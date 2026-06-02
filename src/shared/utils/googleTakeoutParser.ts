import JSZip from 'jszip'

export interface ParsedPlace {
  name: string
  address: string
  lat: number
  lng: number
}

export interface ParsedWishlist {
  name: string
  places: ParsedPlace[]
}

function parseGeoJson(json: string, listName: string): ParsedWishlist | null {
  try {
    const data = JSON.parse(json)
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) return null

    const places: ParsedPlace[] = []
    for (const feature of data.features) {
      const props = feature.properties ?? {}
      const location = props.Location ?? {}

      // Try to get name
      const name: string = props.Title || location['Business Name'] || ''
      if (!name) continue

      // Try to get coordinates — prefer geometry, fallback to Location.Geo Coordinates
      let lat = 0
      let lng = 0
      if (feature.geometry?.coordinates?.length === 2) {
        lng = feature.geometry.coordinates[0]
        lat = feature.geometry.coordinates[1]
      } else if (location['Geo Coordinates']) {
        lat = parseFloat(location['Geo Coordinates'].Latitude ?? '0')
        lng = parseFloat(location['Geo Coordinates'].Longitude ?? '0')
      }

      const address: string = location.Address ?? ''

      places.push({ name, address, lat, lng })
    }

    if (places.length === 0) return null
    return { name: listName, places }
  } catch {
    return null
  }
}

export async function parseGoogleTakeoutZip(
  base64Content: string,
): Promise<ParsedWishlist[]> {
  const zip = await JSZip.loadAsync(base64Content, { base64: true })
  const results: ParsedWishlist[] = []

  const jsonFiles = Object.keys(zip.files).filter(
    path => path.endsWith('.json') && !zip.files[path].dir,
  )

  for (const filePath of jsonFiles) {
    const content = await zip.files[filePath].async('string')
    // Use filename (without path and extension) as list name
    const segments = filePath.split('/')
    const fileName = segments[segments.length - 1].replace('.json', '')
    const parsed = parseGeoJson(content, fileName)
    if (parsed) results.push(parsed)
  }

  return results
}
