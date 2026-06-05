import Config from 'react-native-config'
import { GeneratedItinerary } from '../types'
import { ITINERARY_SYSTEM_PROMPT, GenerateRequest, buildUserPrompt } from './itineraryPrompt'

export async function generateGptItinerary(params: GenerateRequest): Promise<GeneratedItinerary> {
  const userPrompt = buildUserPrompt(params)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Config.OPENAI_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ITINERARY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI服務暫時無法使用（${response.status}）`)
  }

  const data: any = await response.json()
  const text = data.choices[0].message.content
  return JSON.parse(text) as GeneratedItinerary
}
