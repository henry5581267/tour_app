import Config from 'react-native-config'
import { GeneratedItinerary } from '../types'
import { ITINERARY_SYSTEM_PROMPT, GenerateRequest, buildUserPrompt } from './itineraryPrompt'

export async function generateAIItinerary(params: GenerateRequest): Promise<GeneratedItinerary> {
  const userPrompt = buildUserPrompt(params)

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
      system: ITINERARY_SYSTEM_PROMPT,
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
