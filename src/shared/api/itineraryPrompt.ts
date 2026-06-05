// 共用的行程生成 prompt 與請求型別，Claude / GPT 共用
import { GeneratedItinerary } from '../types'

export const ITINERARY_SYSTEM_PROMPT = `你是一個專業的繁體中文旅遊規劃師。使用者會給你目的地、天數和偏好，你需要規劃一個詳細的行程。

規則：
1. 只回傳嚴格的 JSON，不要有任何其他文字、markdown、程式碼區塊。
2. 每天包含 3–5 個地點（含餐廳）。
3. 時間從早上 9:00 開始，合理安排。
4. category 只能是 "attraction"、"restaurant"、"activity" 其中之一。
5. 每個地點的 note 提供一句實用的旅遊小提示。

回傳格式：
{
  "tripName": "...",
  "days": [
    {
      "dayIndex": 0,
      "theme": "...",
      "places": [
        {
          "name": "...",
          "category": "attraction",
          "address": "...",
          "time": "上午 10:00",
          "note": "..."
        }
      ]
    }
  ]
}`

export interface GenerateRequest {
  destination: string
  days: number
  preferences: string
  wishlistPlaces?: string[]
}

export function buildUserPrompt(params: GenerateRequest): string {
  let userPrompt = `目的地：${params.destination}\n天數：${params.days} 天\n偏好：${params.preferences || '無特別偏好'}`

  if (params.wishlistPlaces && params.wishlistPlaces.length > 0) {
    userPrompt += `\n\n以下是使用者的收藏景點清單，請優先將這些景點安排到行程中，不足的天數或種類再補充其他推薦。括號內為該地點的正確地址，安排這些景點時請務必原封不動沿用括號內的地址，絕對不要自行更改或重新猜測地址：\n${params.wishlistPlaces.join('\n')}`
  }
  return userPrompt
}

export type { GeneratedItinerary }
