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

export type RootStackParamList = {
  Tabs: undefined
  PlaceDetail: { place: PlaceSearchResult }
  ItineraryDetail: { tripId: string }
}

export type TabParamList = {
  Places: undefined
  Itinerary: undefined
  Map: undefined
}
