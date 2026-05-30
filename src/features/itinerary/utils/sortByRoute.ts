import { TripPlace } from '../../../shared/types'
import { getTravelInfo } from '../../../shared/api/directions'

/**
 * 解析開放時間字串，取得今天的關門時間（分鐘數，從午夜起算）
 * 格式: "Monday: 9:00 AM – 9:00 PM\nTuesday: ..."
 * 回傳 null 表示無法解析（視為全天開放）
 */
function getClosingMinutes(openingHours: string | undefined): number | null {
  if (!openingHours) return null

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  const lines = openingHours.split('\n')
  const todayLine = lines.find(l => l.startsWith(today))
  if (!todayLine) return null

  // 找關門時間（破折號後面）
  const match = todayLine.match(/[–\-]\s*(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const ampm = match[3].toUpperCase()

  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
}

/**
 * 解析開放時間字串，取得今天的開門時間（分鐘數，從午夜起算）
 */
function getOpeningMinutes(openingHours: string | undefined): number | null {
  if (!openingHours) return null

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  const lines = openingHours.split('\n')
  const todayLine = lines.find(l => l.startsWith(today))
  if (!todayLine) return null

  // 找開門時間（冒號後第一個時間）
  const match = todayLine.match(/:\s*(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null

  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const ampm = match[3].toUpperCase()

  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
}

/**
 * 使用 Google Directions API 實際路線距離 + 開放時間排序
 *
 * 邏輯：
 * 1. 從第一個地點出發
 * 2. 對剩餘地點查詢實際步行時間（Directions API）
 * 3. 優先選擇「關門時間較早」的地點（避免到了才發現關門）
 * 4. 關門時間相近時，選擇實際行程時間最短的
 * 5. 沒有座標的地點排在最後
 *
 * Score = 實際行程秒數 - 關門緊迫性加成
 * 關門越早（越緊迫）→ score 越低 → 越優先
 */
export async function sortByRoute(
  places: TripPlace[],
  onProgress?: (current: number, total: number) => void
): Promise<TripPlace[]> {
  if (places.length <= 1) return [...places]

  const valid = places.filter(p => !(p.lat === 0 && p.lng === 0))
  const invalid = places.filter(p => p.lat === 0 && p.lng === 0)

  if (valid.length === 0) return [...places]

  const result: TripPlace[] = [valid[0]]
  const remaining = [...valid.slice(1)]
  let apiCallCount = 0
  const totalCalls = (valid.length * (valid.length - 1)) / 2

  while (remaining.length > 0) {
    const last = result[result.length - 1]

    // 並行取得到所有剩餘地點的實際行程時間
    const travelInfos = await Promise.all(
      remaining.map(p => getTravelInfo(last.lat, last.lng, p.lat, p.lng))
    )
    apiCallCount += remaining.length
    onProgress?.(apiCallCount, totalCalls)

    let bestIdx = 0
    let bestScore = Infinity

    remaining.forEach((p, idx) => {
      const travelSec = travelInfos[idx].seconds

      // 開放時間加成：關門越早，分數越低（越優先）
      const closingMin = getClosingMinutes(p.openingHours)
      const openingMin = getOpeningMinutes(p.openingHours)

      // 關門緊迫加成：關門時間在晚上 8 點（480分鐘）之前，給予優先
      let urgencyBonus = 0
      if (closingMin !== null && closingMin < 20 * 60) {
        // 關門越早，bonus 越大（讓分數越低）
        urgencyBonus = (24 * 60 - closingMin) * 2
      }

      // 開門限制：還沒開的地方加懲罰（稍後再去）
      let notOpenPenalty = 0
      if (openingMin !== null) {
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
        if (openingMin > nowMin + travelSec / 60) {
          // 預計到達時還沒開門
          notOpenPenalty = (openingMin - nowMin) * 60
        }
      }

      const score = travelSec + notOpenPenalty - urgencyBonus
      if (score < bestScore) {
        bestScore = score
        bestIdx = idx
      }
    })

    result.push(remaining.splice(bestIdx, 1)[0])
  }

  return [...result, ...invalid]
}
