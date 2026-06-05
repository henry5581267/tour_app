// 共用的行程生成 prompt 與請求型別，Claude / GPT 共用
import { GeneratedItinerary } from '../types'

export const ITINERARY_SYSTEM_PROMPT = `你是一個專業的繁體中文旅遊規劃師。使用者會給你目的地、天數和偏好，你需要規劃一個詳細的行程。

規則：
1. 只回傳嚴格的 JSON，不要有任何其他文字、markdown、程式碼區塊。
2. 每天包含 3–5 個地點（含餐廳）。
3. 時間從早上 9:00 開始，合理安排。
4. category 只能是 "attraction"、"restaurant"、"activity" 其中之一。
5. 每個地點的 note 提供一句實用的旅遊小提示。
6. 每個地點加上 transport 欄位，代表「從前一個地點移動到此地點」建議的交通方式，只能是 "driving"（開車）、"transit"（大眾運輸）、"walking"（步行）、"bicycling"（騎車）其中之一。請依兩地點的實際距離與使用者的主要交通方式偏好，為每一段選擇最合適的方式（例如很近就 walking、跨城市就 transit 或 driving）。當天第一個地點沒有前一站，transport 設為 null。

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
          "note": "...",
          "transport": "walking"
        }
      ]
    }
  ]
}`

export type TransportMode = 'driving' | 'transit' | 'walking' | 'bicycling'

const TRANSPORT_LABEL: Record<TransportMode, string> = {
  driving: '自行開車',
  transit: '大眾運輸（捷運、公車、火車）',
  walking: '步行',
  bicycling: '騎自行車',
}

export interface GenerateRequest {
  destination: string
  days: number
  preferences: string
  transportMode?: TransportMode
  // 每個元素為一個收藏景點的描述（含地址、評分、營業時間、附近推薦等）
  wishlistPlaces?: string[]
}

export function buildUserPrompt(params: GenerateRequest): string {
  let userPrompt = `目的地：${params.destination}\n天數：${params.days} 天\n偏好：${params.preferences || '無特別偏好'}`

  if (params.transportMode) {
    userPrompt += `\n主要交通方式：${TRANSPORT_LABEL[params.transportMode]}。請依此安排地點間的距離與順序，避免在此交通方式下移動過於困難或耗時的路線。`
  }

  if (params.wishlistPlaces && params.wishlistPlaces.length > 0) {
    userPrompt += `\n\n以下是使用者的收藏景點清單，請優先將這些景點安排到行程中，不足的天數或種類再補充其他推薦。每個景點已附上正確地址、評分、營業時間與附近推薦景點，安排時請務必原封不動沿用提供的地址（絕對不要自行更改或猜測地址），並參考營業時間避開公休、參考評分與附近推薦來補充其他地點：\n${params.wishlistPlaces.join('\n\n')}`
  }
  return userPrompt
}

export type { GeneratedItinerary }
