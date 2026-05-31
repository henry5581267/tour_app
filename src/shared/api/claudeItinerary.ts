import functions from '@react-native-firebase/functions'
import { GeneratedItinerary } from '../types'

interface GenerateRequest {
  destination: string
  days: number
  preferences: string
}

export async function generateAIItinerary(params: GenerateRequest): Promise<GeneratedItinerary> {
  const callable = functions('asia-east1').httpsCallable('generateItinerary')
  const result = await callable(params)
  return result.data as GeneratedItinerary
}
