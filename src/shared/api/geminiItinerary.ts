import Config from 'react-native-config'
import { GeneratedItinerary } from '../types'
import { ITINERARY_SYSTEM_PROMPT, GenerateRequest, buildUserPrompt } from './itineraryPrompt'

// 注意：Gemini 免費方案有較嚴格的速率限制（可能回傳 429）
export async function generateGeminiItinerary(params: GenerateRequest): Promise<GeneratedItinerary> {
  const userPrompt = buildUserPrompt(params)
  const apiKey = Config.GEMINI_API_KEY ?? ''

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ITINERARY_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`AI服務暫時無法使用（${response.status}）`)
  }

  const data: any = await response.json()
  const text = data.candidates[0].content.parts[0].text
  return JSON.parse(text) as GeneratedItinerary
}
