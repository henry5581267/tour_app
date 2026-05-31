import functions from '@react-native-firebase/functions'
import { generateAIItinerary } from '../claudeItinerary'

const { __mockCallable: mockCallable } = functions as any

const mockItinerary = {
  tripName: '台中之旅',
  days: [{ dayIndex: 0, theme: '文創', places: [] }],
}

beforeEach(() => jest.clearAllMocks())

describe('generateAIItinerary', () => {
  it('calls the Firebase function and returns itinerary', async () => {
    mockCallable.mockResolvedValueOnce({ data: mockItinerary })
    const result = await generateAIItinerary({ destination: '台中', days: 3, preferences: '文創' })
    expect(result.tripName).toBe('台中之旅')
    expect(mockCallable).toHaveBeenCalledWith({ destination: '台中', days: 3, preferences: '文創' })
  })

  it('propagates errors from the Firebase function', async () => {
    mockCallable.mockRejectedValueOnce(new Error('Network error'))
    await expect(
      generateAIItinerary({ destination: '台中', days: 3, preferences: '' })
    ).rejects.toThrow('Network error')
  })
})
