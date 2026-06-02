export interface ScrapedPlace {
  name: string
  address: string
  lat: number
  lng: number
}

function extractListId(url: string): string | null {
  // Format: !2s{LIST_ID}!3e3
  const m = url.match(/!2s([a-zA-Z0-9_\-]{10,60})!3e3/)
  return m ? m[1] : null
}

async function fetchWithBrowserHeaders(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

export async function scrapeGoogleMapsList(url: string): Promise<ScrapedPlace[]> {
  let html = ''

  // Try 1: fetch URL directly
  try {
    html = await fetchWithBrowserHeaders(url)
  } catch (e: any) {
    throw new Error(`無法讀取連結（${e.message}）`)
  }

  // Try to extract list ID and fetch via placelists URL
  const listId = extractListId(url)
  if (listId) {
    try {
      const placelistUrl = `https://www.google.com/maps/placelists/list/${listId}`
      const altHtml = await fetchWithBrowserHeaders(placelistUrl)
      if (altHtml.length > html.length) html = altHtml
    } catch {}
  }

  const places = parseGoogleMapsHtml(html)

  if (places.length === 0) {
    // Log some HTML snippet to help debug
    const snippet = html.slice(0, 500).replace(/\s+/g, ' ')
    console.log('[GoogleMapsScraper] HTML snippet:', snippet)
    throw new Error(
      '找不到景點資料。可能原因：\n' +
      '1. 此清單需要登入才能查看\n' +
      '2. Google Maps 格式已更新\n' +
      '請確認清單是「公開」分享的。'
    )
  }

  return places
}

function parseGoogleMapsHtml(html: string): ScrapedPlace[] {
  const places: ScrapedPlace[] = []
  const seen = new Set<string>()

  // Strategy 1: Google Maps data format - look for [lat, lng] pairs near place names
  // Pattern: ["Place Name",null,null,null,null,null,[lat,lng]]
  const gMapsPattern = /\["([^"]{2,80})",(?:null,){3,8}\[([-\d.]{3,12}),([-\d.]{3,12})\]/g
  let m: RegExpExecArray | null
  while ((m = gMapsPattern.exec(html)) !== null) {
    const name = m[1]
    const lat = parseFloat(m[2])
    const lng = parseFloat(m[3])
    if (isValidCoord(lat, lng) && !seen.has(name)) {
      seen.add(name)
      places.push({ name, address: '', lat, lng })
    }
  }

  // Strategy 2: Simple coord + name pattern
  if (places.length === 0) {
    const coordPattern = /\["([^"]{2,80})"[^[]*\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/g
    while ((m = coordPattern.exec(html)) !== null) {
      const name = m[1]
      const lat = parseFloat(m[2])
      const lng = parseFloat(m[3])
      if (isValidCoord(lat, lng) && !seen.has(name)) {
        seen.add(name)
        places.push({ name, address: '', lat, lng })
      }
    }
  }

  // Strategy 3: JSON-LD
  if (places.length === 0) {
    const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
    while ((m = jsonLdPattern.exec(html)) !== null) {
      try {
        extractFromJsonLd(JSON.parse(m[1]), places, seen)
      } catch {}
    }
  }

  // Strategy 4: Look for AF_initDataCallback arrays with coords
  if (places.length === 0) {
    const afPattern = /AF_initDataCallback\(\{[^}]*data:([\s\S]{0,50000}?)\}\s*\)/g
    while ((m = afPattern.exec(html)) !== null) {
      extractCoordsFromJson(m[1], places, seen)
    }
  }

  // Try to fill in addresses from HTML text
  if (places.length > 0 && places.every(p => !p.address)) {
    const addrPattern = /"([^"]{5,100}(?:路|街|道|區|市|縣|鎮|村|號|巷|弄)[^"]{0,60})"/g
    const addresses: string[] = []
    while ((m = addrPattern.exec(html)) !== null) {
      if (!addresses.includes(m[1])) addresses.push(m[1])
    }
    places.forEach((p, i) => { if (addresses[i]) p.address = addresses[i] })
  }

  return places
}

function extractCoordsFromJson(text: string, places: ScrapedPlace[], seen: Set<string>) {
  const pattern = /\["([^"]{2,60})"[^\[\]]*,\s*([-\d.]{3,12})\s*,\s*([-\d.]{3,12})\s*\]/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    const name = m[1]
    const lat = parseFloat(m[2])
    const lng = parseFloat(m[3])
    if (isValidCoord(lat, lng) && !seen.has(name)) {
      seen.add(name)
      places.push({ name, address: '', lat, lng })
    }
  }
}

function extractFromJsonLd(data: any, places: ScrapedPlace[], seen: Set<string>) {
  if (!data) return
  if (Array.isArray(data)) { data.forEach(d => extractFromJsonLd(d, places, seen)); return }
  if (typeof data !== 'object') return
  if ((data['@type'] === 'Place' || data['@type'] === 'LocalBusiness') && data.name) {
    const lat = parseFloat(data.geo?.latitude ?? data.latitude ?? '')
    const lng = parseFloat(data.geo?.longitude ?? data.longitude ?? '')
    if (isValidCoord(lat, lng) && !seen.has(data.name)) {
      seen.add(data.name)
      places.push({ name: data.name, address: data.address?.streetAddress ?? '', lat, lng })
    }
  }
  Object.values(data).forEach(v => { if (typeof v === 'object') extractFromJsonLd(v, places, seen) })
}

function isValidCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0)
}
