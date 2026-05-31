import { buildItinerary } from '../generateItinerary'
import Anthropic from '@anthropic-ai/sdk'

jest.mock('@anthropic-ai/sdk')

const mockCreate = jest.fn()
;(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
  () => ({ messages: { create: mockCreate } } as any)
)

const validItinerary = {
  tripName: '台中 3 天之旅',
  days: [
    {
      dayIndex: 0,
      theme: '文創老城',
      places: [
        { name: '宮原眼科', category: 'attraction', address: '台中市中區', time: '上午 10:00', note: '早點去' },
      ],
    },
  ],
}

beforeEach(() => jest.clearAllMocks())

describe('buildItinerary', () => {
  it('returns parsed itinerary on valid Claude response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(validItinerary) }],
    })
    const result = await buildItinerary('fake-key', '台中', 3, '文創')
    expect(result.tripName).toBe('台中 3 天之旅')
    expect(result.days).toHaveLength(1)
    expect(result.days[0].places[0].name).toBe('宮原眼科')
  })

  it('throws on invalid JSON from Claude', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not valid json' }],
    })
    await expect(buildItinerary('fake-key', '台中', 3, '')).rejects.toMatchObject({
      message: 'AI回傳格式錯誤',
    })
  })

  it('throws on response missing tripName', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ days: [] }) }],
    })
    await expect(buildItinerary('fake-key', '台中', 3, '')).rejects.toMatchObject({
      message: 'AI回傳格式錯誤',
    })
  })

  it('throws when Claude API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API timeout'))
    await expect(buildItinerary('fake-key', '台中', 3, '')).rejects.toMatchObject({
      message: 'AI服務暫時無法使用',
    })
  })
})
