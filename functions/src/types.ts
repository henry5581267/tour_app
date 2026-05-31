export interface GeneratedPlace {
  name: string
  category: 'attraction' | 'restaurant' | 'activity'
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
