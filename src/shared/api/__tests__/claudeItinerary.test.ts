import Anthropic from '@anthropic-ai/sdk'
import { generateAIItinerary } from '../claudeItinerary'

jest.mock('@anthropic-ai/sdk')

const mockCreate = jest.fn()
;(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
  () => ({ messages: { create: mockCreate } } as any)
)

const mockItinerary = {
  tripName: '台中之旅',
  days: [{ dayIndex: 0, theme: '文創', places: [] }],
}

beforeEach(() => jest.clearAllMocks())

describe('generateAIItinerary', () => {
  it('calls Claude API and returns parsed itinerary', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(mockItinerary) }],
    })
    const result = await generateAIItinerary({ destination: '台中', days: 3, preferences: '文創' })
    expect(result.tripName).toBe('台中之旅')
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
    }))
  })

  it('propagates errors from Claude API', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'))
    await expect(
      generateAIItinerary({ destination: '台中', days: 3, preferences: '' })
    ).rejects.toThrow('API error')
  })
})
