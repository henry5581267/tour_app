import Config from 'react-native-config'
import { AI_PROVIDER } from '../config'

// 通用 AI 呼叫：給 system + user prompt，回傳模型輸出的文字（通常是 JSON 字串）
// 依 AI_PROVIDER 切換 Claude / GPT / Gemini
export async function callAI(system: string, user: string): Promise<string> {
  if (AI_PROVIDER === 'gpt') return callGpt(system, user)
  if (AI_PROVIDER === 'gemini') return callGemini(system, user)
  return callClaude(system, user)
}

async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Config.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`AI服務暫時無法使用（${res.status}）`)
  const data: any = await res.json()
  return data.content[0].text
}

async function callGpt(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Config.OPENAI_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`AI服務暫時無法使用（${res.status}）`)
  const data: any = await res.json()
  return data.choices[0].message.content
}

async function callGemini(system: string, user: string): Promise<string> {
  const apiKey = Config.GEMINI_API_KEY ?? ''
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )
  if (!res.ok) throw new Error(`AI服務暫時無法使用（${res.status}）`)
  const data: any = await res.json()
  return data.candidates[0].content.parts[0].text
}
