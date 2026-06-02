export interface ScrapedPlace {
  name: string
  address: string
  lat: number
  lng: number
}

export async function scrapeGoogleMapsList(url: string): Promise<ScrapedPlace[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`無法讀取清單（${response.status}）`)
  }

  const html = await response.text()
  const places = parseGoogleMapsHtml(html)

  if (places.length === 0) {
    throw new Error('找不到景點資料，此連結可能不支援或需要登入')
  }

  return places
}

function parseGoogleMapsHtml(html: string): ScrapedPlace[] {
  const places: ScrapedPlace[] = []
  const seen = new Set<string>()

  // Strategy 1: Look for patterns like ["Place Name","",["","Address",...],null,[lat,lng]]
  const coordPattern = /\["([^"]{2,80})",[^[]*\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/g
  let m: RegExpExecArray | null
  while ((m = coordPattern.exec(html)) !== null) {
    const name = m[1]
    const lat = parseFloat(m[2])
    const lng = parseFloat(m[3])
    if (isValidCoord(lat, lng) && !seen.has(name)) {
      seen.add(name)
      places.push({ name, address: '', lat, lng })
    }
  }

  // Strategy 2: JSON-LD structured data
  const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
  while ((m = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1])
      extractFromJsonLd(data, places, seen)
    } catch {}
  }

  // Strategy 3: Look for place name near lat/lng pairs already found
  // (address extraction attempt)
  if (places.length > 0 && places.every(p => !p.address)) {
    const addrPattern = /,"([^"]{5,100} (?:路|街|道|區|市|縣|里|鎮|村|號|F|樓)[^"]{0,60})"/g
    const addresses: string[] = []
    while ((m = addrPattern.exec(html)) !== null) {
      addresses.push(m[1])
    }
    places.forEach((p, i) => {
      if (addresses[i]) p.address = addresses[i]
    })
  }

  return places
}

function extractFromJsonLd(data: any, places: ScrapedPlace[], seen: Set<string>) {
  if (!data) return
  if (Array.isArray(data)) {
    data.forEach(item => extractFromJsonLd(item, places, seen))
    return
  }
  if (data['@type'] === 'Place' || data['@type'] === 'LocalBusiness') {
    const name: string = data.name ?? ''
    const lat = data.geo?.latitude ?? data.latitude
    const lng = data.geo?.longitude ?? data.longitude
    const address: string = data.address?.streetAddress ?? data.address ?? ''
    if (name && isValidCoord(parseFloat(lat), parseFloat(lng)) && !seen.has(name)) {
      seen.add(name)
      places.push({ name, address, lat: parseFloat(lat), lng: parseFloat(lng) })
    }
  }
  Object.values(data).forEach(v => {
    if (typeof v === 'object') extractFromJsonLd(v, places, seen)
  })
}

function isValidCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0)
}
