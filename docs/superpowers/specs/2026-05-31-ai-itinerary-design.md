# AI Itinerary Generation Design

**Date:** 2026-05-31  
**Status:** Approved

## Overview

Add an AI-powered itinerary planning feature to TourApp. Users describe their trip in natural language; Claude generates a full day-by-day itinerary with times, place descriptions, and meal recommendations. The result is shown in a preview screen before being saved as a Trip.

## Goals

- Let users generate a complete itinerary from a text description
- Show a preview for user review before committing
- Integrate generated places into the existing Trip/TripDay/TripPlace structure
- Keep Claude API key server-side (Firebase Cloud Functions)

## Non-Goals

- Real-time streaming of AI response
- AI editing/refining an existing trip
- Automatic geocoding of AI-generated places (coordinates are left empty; user can search and replace later)
- Multi-turn conversation with the AI

## Architecture

```
app (React Native)
  └─ claudeItinerary.ts  →  Firebase HTTPS Callable Function: generateItinerary
                                  └─ Anthropic Claude API (claude-sonnet-4-6)
```

The Claude API key is stored in Firebase Functions environment config and never exposed to the client.

## Data Flow

1. User fills in destination, days, preferences in `AITripModal`
2. app calls Firebase HTTPS callable `generateItinerary` with `{ destination, days, preferences }`
3. Function builds a system prompt + user prompt and calls Claude API
4. Claude returns a structured JSON itinerary
5. Function validates and returns the JSON to the app
6. app displays `AITripPreviewScreen` with the parsed itinerary
7. User taps "建立行程" → app creates a local `Trip` and navigates to `ItineraryDetailScreen`
8. User taps "重新規劃" → back to `AITripModal` with inputs preserved

## Firebase Cloud Function

**Name:** `generateItinerary`  
**Type:** HTTPS Callable (authenticated via Firebase app check)  
**Runtime:** Node.js 20  
**Timeout:** 60 seconds  
**Region:** asia-east1

**Input:**
```ts
interface GenerateItineraryRequest {
  destination: string   // e.g. "台中"
  days: number          // 1–14
  preferences: string   // e.g. "喜歡文創和美食，不喜歡太趕"
}
```

**Output:**
```ts
interface GeneratedItinerary {
  tripName: string
  days: GeneratedDay[]
}

interface GeneratedDay {
  dayIndex: number       // 0-based
  theme: string          // e.g. "文創與老城區"
  places: GeneratedPlace[]
}

interface GeneratedPlace {
  name: string
  category: 'attraction' | 'restaurant' | 'activity'
  address: string
  time: string           // e.g. "上午 10:00"
  note: string           // AI tip about this place
}
```

**Claude API settings:**
- Model: `claude-sonnet-4-6`
- max_tokens: 4096
- System prompt is fixed → eligible for prompt caching (cache_control: ephemeral)

**System prompt:**
```
你是一個專業的繁體中文旅遊規劃師。使用者會給你目的地、天數和偏好，你需要規劃一個詳細的行程。

規則：
1. 只回傳嚴格的 JSON，不要有任何其他文字、markdown、程式碼區塊。
2. 每天包含 3–5 個地點（含餐廳）。
3. 時間從早上 9:00 開始，合理安排。
4. category 只能是 "attraction"、"restaurant"、"activity" 其中之一。
5. 每個地點的 note 提供一句實用的旅遊小提示。

回傳格式：
{
  "tripName": "...",
  "days": [
    {
      "dayIndex": 0,
      "theme": "...",
      "places": [
        {
          "name": "...",
          "category": "attraction|restaurant|activity",
          "address": "...",
          "time": "上午 10:00",
          "note": "..."
        }
      ]
    }
  ]
}
```

**Error handling:**
- If Claude returns invalid JSON → throw `functions.https.HttpsError('internal', 'AI回傳格式錯誤')`
- If Claude API call fails → throw `functions.https.HttpsError('internal', 'AI服務暫時無法使用')`
- app shows an Alert with the error message

## New Files

| File | Responsibility |
|------|---------------|
| `functions/src/generateItinerary.ts` | Firebase Cloud Function; calls Claude API; validates and returns JSON |
| `functions/src/index.ts` | Exports all functions |
| `functions/package.json` | Node.js 20 dependencies: firebase-functions, @anthropic-ai/sdk |
| `src/shared/api/claudeItinerary.ts` | Calls the Firebase callable function; returns `GeneratedItinerary` |
| `src/features/itinerary/components/AITripModal.tsx` | Input form: destination, days picker, preferences textarea |
| `src/features/itinerary/screens/AITripPreviewScreen.tsx` | Preview screen; shows days/places; confirm or retry |

## Modified Files

| File | Change |
|------|--------|
| `src/shared/types/index.ts` | Add `GeneratedItinerary`, `GeneratedDay`, `GeneratedPlace` types |
| `src/navigation/AppNavigator.tsx` | Add `AITripPreview` to stack navigator |
| `src/shared/types/index.ts` | Add `AITripPreview` to `RootStackParamList` |
| `src/features/itinerary/screens/ItineraryListScreen.tsx` | Add ✨ AI 規劃 button; open AITripModal |
| `src/features/itinerary/store.ts` | Add `createTripFromAI(itinerary)` action |

## createTripFromAI Store Action

Converts `GeneratedItinerary` into a local `Trip`:

```ts
createTripFromAI: async (itinerary: GeneratedItinerary) => {
  const trip: Trip = {
    id: generateId(),
    name: itinerary.tripName,
    days: itinerary.days.length,
    createdAt: new Date().toISOString(),
    isShared: false,
    tripDays: itinerary.days.map(d => ({
      dayIndex: d.dayIndex,
      places: d.places.map(p => ({
        id: generateId(),
        googlePlaceId: null,
        name: p.name,
        category: p.category,
        lat: 0,
        lng: 0,
        address: p.address,
        photo: '',
        note: `${p.time} — ${p.note}`,
      })),
    })),
  }
  await addTrip(trip)
  _localTrips.push(trip)
  set({ trips: _merged() })
  return trip
}
```

Note: `lat`/`lng` are 0 because AI does not return coordinates. The place appears in the itinerary but won't show on the map until the user searches and links it via the existing search flow.

## UI Details

### AITripModal

- Text input: 目的地（required）
- Number picker: 天數 1–14（default 3）
- Multi-line text input: 偏好描述（optional, placeholder: "例如：喜歡文創景點、台灣小吃，不喜歡人擠人"）
- Button: 「✨ 開始規劃」— disabled until destination is filled
- Loading state: button shows spinner + "AI 規劃中..." while awaiting response

### AITripPreviewScreen

- Header: trip name from AI
- Scrollable list of days, each showing:
  - Day number + theme
  - Places with time badge, category badge, name, address, note
- Bottom bar with two buttons:
  - 「重新規劃」— goes back to AITripModal
  - 「建立行程」— calls createTripFromAI, navigates to ItineraryDetailScreen

### ItineraryListScreen change

Add a third button in the fab row: `✨` icon button between "加入行程" and "+".

## Firebase Setup

**Deploy command:**
```bash
firebase deploy --only functions
```

**Set Claude API key:**
```bash
firebase functions:config:set anthropic.api_key="sk-ant-..."
```

**Access in function:**
```ts
const apiKey = functions.config().anthropic.api_key
```

## Out of Scope for v1

- Geocoding AI-generated places (auto-filling lat/lng)
- AI itinerary saved to Firestore for sharing
- Streaming response
- Editing the AI prompt interactively
