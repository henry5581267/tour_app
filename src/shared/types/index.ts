// src/shared/types/index.ts

export type PlaceCategory = 'attraction' | 'restaurant' | 'activity'

export interface TripPlace {
  id: string
  googlePlaceId: string | null
  name: string
  category: PlaceCategory
  lat: number
  lng: number
  address: string
  photo: string
  openingHours?: string
  note?: string
}

export interface TripDay {
  dayIndex: number
  places: TripPlace[]
}

export interface Trip {
  id: string
  name: string
  days: number
  createdAt: string
  isShared: boolean
  tripDays: TripDay[]
}

export interface PlaceSearchResult {
  googlePlaceId: string
  name: string
  address: string
  lat: number
  lng: number
  photo: string
  rating?: number
  category: PlaceCategory
}

export interface GeneratedPlace {
  name: string
  category: PlaceCategory
  address: string
  time: string
  note: string
}

export interface GeneratedDay {
  dayIndex: number
  theme: string
  places: GeneratedPlace[]
}

export interface GeneratedItinerary {
  tripName: string
  days: GeneratedDay[]
}

export type RootStackParamList = {
  Tabs: undefined
  PlaceDetail: { place: PlaceSearchResult }
  ItineraryDetail: { tripId: string }
  AITripPreview: { itinerary: GeneratedItinerary }
}

export type TabParamList = {
  Places: undefined
  Itinerary: undefined
  Map: undefined
}
