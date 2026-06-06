import { TripPlace, TransportMode } from '../types'
import { callAI } from './aiClient'

const REORDER_SYSTEM = `你是專業的行程順序優化助手。使用者會給你某一天的多個地點（含名稱、地址、營業時間）以及主要交通方式。請依「最合理的一日遊覽順序」重新排序，考量重點：
1. 地理位置鄰近，減少來回奔波與交通時間。
2. 營業時間：避免安排到還沒開門或已打烊的地點；快打烊的優先前往。
3. 用餐時段：餐廳盡量安排在中午 12:00 與晚上 18:00 前後。
4. 動線順暢，符合該交通方式的移動特性。

只回傳嚴格的 JSON，格式為：{ "order": ["地點名稱1", "地點名稱2", ...] }
order 陣列必須「完整包含」使用者提供的每一個地點名稱，數量一致、不可新增或刪除地點。不要有任何其他文字或 markdown。`

const TRANSPORT_LABEL: Record<TransportMode, string> = {
  driving: '開車', transit: '大眾運輸', walking: '步行', bicycling: '騎車',
}

function stripCodeFence(text: string): string {
  return text.replace(/```(?:json)?/gi, '').trim()
}

// 請 AI 依合理順序重排當天地點。失敗時回傳原順序。
export async function reorderDayByAI(
  places: TripPlace[],
  transportMode?: TransportMode,
): Promise<TripPlace[]> {
  if (places.length < 2) return [...places]

  const lines = places
    .map(p => {
      const parts = [p.name]
      if (p.address) parts.push(`地址：${p.address}`)
      if (p.openingHours) parts.push(`營業時間：${p.openingHours.replace(/\n/g, '，')}`)
      return `- ${parts.join('｜')}`
    })
    .join('\n')

  const transport = transportMode ? TRANSPORT_LABEL[transportMode] : '未指定'
  const user = `主要交通方式：${transport}\n\n地點清單：\n${lines}`

  const text = await callAI(REORDER_SYSTEM, user)
  const parsed = JSON.parse(stripCodeFence(text)) as { order: string[] }
  if (!Array.isArray(parsed.order)) return [...places]

  // 依 AI 給的順序重排（用名稱對應）；AI 漏掉的地點保留原序附在最後
  const byName = new Map(places.map(p => [p.name, p]))
  const result: TripPlace[] = []
  for (const name of parsed.order) {
    const p = byName.get(name)
    if (p) {
      result.push(p)
      byName.delete(name)
    }
  }
  for (const p of byName.values()) result.push(p)

  return result.length === places.length ? result : [...places]
}
