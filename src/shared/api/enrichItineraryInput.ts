import { WishlistItem } from '../types'
import { getPlaceDetails, nearbySearch } from './places'

// 對收藏景點補上營業時間、附近熱門景點，組成給 AI 的豐富描述字串
// 每個景點一行（含換行內的細節），回傳字串陣列
export async function enrichWishlistForAI(items: WishlistItem[]): Promise<string[]> {
  // 控制數量避免過多 API 呼叫與過長 prompt
  const limited = items.slice(0, 12)

  return Promise.all(
    limited.map(async item => {
      const detail: string[] = []
      if (item.address) detail.push(`地址：${item.address}`)
      if (item.rating) detail.push(`評分：${item.rating}`)
      if (item.lat && item.lng) detail.push(`座標：${item.lat.toFixed(5)},${item.lng.toFixed(5)}`)

      // 營業時間（需 googlePlaceId）
      if (item.googlePlaceId) {
        try {
          const d = await getPlaceDetails(item.googlePlaceId)
          if (d.openingHours) detail.push(`營業時間：${d.openingHours.replace(/\n/g, '，')}`)
        } catch {}
      }

      // 附近熱門景點
      if (item.lat && item.lng) {
        try {
          const nearby = await nearbySearch(item.lat, item.lng)
          const top = nearby
            .filter(n => n.name !== item.name && (n.rating ?? 0) >= 4.0)
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, 3)
            .map(n => (n.rating ? `${n.name}(${n.rating})` : n.name))
          if (top.length) detail.push(`附近推薦：${top.join('、')}`)
        } catch {}
      }

      return `${item.name}（${detail.join('｜')}）`
    }),
  )
}
