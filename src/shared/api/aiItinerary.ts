// 統一入口：依 config 的 AI_PROVIDER 選擇 Claude / GPT / Gemini
import { AI_PROVIDER } from '../config'
import { GeneratedItinerary } from '../types'
import { GenerateRequest } from './itineraryPrompt'
import { generateAIItinerary } from './claudeItinerary'
import { generateGptItinerary } from './gptItinerary'
import { generateGeminiItinerary } from './geminiItinerary'

export function generateItinerary(params: GenerateRequest): Promise<GeneratedItinerary> {
  if (AI_PROVIDER === 'gpt') {
    return generateGptItinerary(params)
  }
  if (AI_PROVIDER === 'gemini') {
    return generateGeminiItinerary(params)
  }
  return generateAIItinerary(params)
}

export type { GenerateRequest }
