import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'
import { GeneratedItinerary } from './types'

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

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

export async function buildItinerary(
  apiKey: string,
  destination: string,
  days: number,
  preferences: string,
): Promise<GeneratedItinerary> {
  const client = new Anthropic({ apiKey })
  const userPrompt = `目的地：${destination}\n天數：${days} 天\n偏好：${preferences || '無特別偏好'}`

  let text: string
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: userPrompt }],
    })
    text = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    throw new HttpsError('internal', 'AI服務暫時無法使用')
  }

  let parsed: GeneratedItinerary
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpsError('internal', 'AI回傳格式錯誤')
  }

  if (!parsed.tripName || !Array.isArray(parsed.days)) {
    throw new HttpsError('internal', 'AI回傳格式錯誤')
  }
  return parsed
}

export const generateItinerary = onCall(
  { region: 'asia-east1', secrets: [anthropicApiKey], timeoutSeconds: 60 },
  async (request) => {
    const { destination, days, preferences } = request.data as {
      destination: string
      days: number
      preferences: string
    }
    if (!destination || typeof days !== 'number') {
      throw new HttpsError('invalid-argument', '目的地和天數為必填')
    }
    return buildItinerary(anthropicApiKey.value(), destination, days, preferences ?? '')
  }
)
