import Config from 'react-native-config'
import { GeneratedItinerary } from '../types'

const SYSTEM_PROMPT = `你是一個專業的繁體中文旅遊規劃師。使用者會給你目的地、天數和偏好，你需要規劃一個詳細的行程。

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

interface GenerateRequest {
  destination: string
  days: number
  preferences: string
}

export async function generateAIItinerary(params: GenerateRequest): Promise<GeneratedItinerary> {
  const userPrompt = `目的地：${params.destination}\n天數：${params.days} 天\n偏好：${params.preferences || '無特別偏好'}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Config.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI服務暫時無法使用（${response.status}）`)
  }

  const data = await response.json()
  const text = data.content[0].text
  return JSON.parse(text) as GeneratedItinerary
}
