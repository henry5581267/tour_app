import { generateAIItinerary } from '../claudeItinerary'

const mockItinerary = {
  tripName: '台中之旅',
  days: [{ dayIndex: 0, theme: '文創', places: [] }],
}

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('generateAIItinerary', () => {
  it('calls Claude API and returns parsed itinerary', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: JSON.stringify(mockItinerary) }] }),
    })
    const result = await generateAIItinerary({ destination: '台中', days: 3, preferences: '文創' })
    expect(result.tripName).toBe('台中之旅')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws on non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(
      generateAIItinerary({ destination: '台中', days: 3, preferences: '' })
    ).rejects.toThrow('AI服務暫時無法使用')
  })
})
