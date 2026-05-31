# AI Itinerary Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI itinerary planner that takes a destination + preferences, calls Claude via Firebase Cloud Function, and shows a preview before creating a local Trip.

**Architecture:** Firebase Cloud Function (`generateItinerary`, region asia-east1) receives the user's request, calls Claude API (claude-sonnet-4-6) server-side to protect the API key, and returns structured JSON. The app shows a preview screen; on confirm, `createTripFromAI` converts the result into a local Trip using the existing Zustand store.

**Tech Stack:** Firebase Functions v2 (Node.js 20), @anthropic-ai/sdk, @react-native-firebase/functions, React Native, Zustand (existing)

---

## File Map

**New files:**
- `firebase.json` — Firebase project config (enables Functions)
- `functions/package.json` — Node.js 20 project for Cloud Functions
- `functions/tsconfig.json` — TypeScript config for functions
- `functions/jest.config.js` — Jest config for functions tests
- `functions/src/index.ts` — Exports all functions
- `functions/src/types.ts` — Shared types used by the function
- `functions/src/generateItinerary.ts` — Cloud Function + core buildItinerary logic
- `functions/src/__tests__/generateItinerary.test.ts`
- `src/shared/api/claudeItinerary.ts` — App-side Firebase callable client
- `src/shared/api/__tests__/claudeItinerary.test.ts`
- `src/features/itinerary/components/AITripModal.tsx` — Input form modal
- `src/features/itinerary/screens/AITripPreviewScreen.tsx` — Preview + confirm screen
- `__mocks__/@react-native-firebase/functions.js` — Jest mock

**Modified files:**
- `src/shared/types/index.ts` — Add `GeneratedPlace`, `GeneratedDay`, `GeneratedItinerary`; add `AITripPreview` to `RootStackParamList`
- `src/navigation/AppNavigator.tsx` — Register `AITripPreview` screen
- `src/features/itinerary/store.ts` — Add `createTripFromAI` action
- `src/features/itinerary/screens/ItineraryListScreen.tsx` — Add ✨ button + AITripModal
- `jest.config.js` — Add `@react-native-firebase/functions` mock mapping

---

## Task 1: Firebase Functions project scaffold

**Files:**
- Create: `firebase.json`
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/jest.config.js`
- Create: `functions/src/index.ts`
- Create: `functions/src/types.ts`

- [ ] **Step 1: Create `firebase.json` in project root `d:\tour_app\`**

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "*.local"
      ]
    }
  ]
}
```

- [ ] **Step 2: Create `functions/package.json`**

```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "jest"
  },
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^6.0.0",
    "@anthropic-ai/sdk": "^0.39.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "private": true
}
```

- [ ] **Step 3: Create `functions/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

- [ ] **Step 4: Create `functions/jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
}
```

- [ ] **Step 5: Create `functions/src/types.ts`**

```ts
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
```

- [ ] **Step 6: Create `functions/src/index.ts`**

```ts
import { initializeApp } from 'firebase-admin/app'
initializeApp()
export { generateItinerary } from './generateItinerary'
```

- [ ] **Step 7: Install functions dependencies**

```powershell
cd d:\tour_app\functions; npm install
```

Expected: `node_modules` created in `functions/`.

- [ ] **Step 8: Commit**

```bash
git add firebase.json functions/package.json functions/tsconfig.json functions/jest.config.js functions/src/index.ts functions/src/types.ts
git commit -m "feat: scaffold Firebase Functions project for AI itinerary"
```

---

## Task 2: generateItinerary Cloud Function

**Files:**
- Create: `functions/src/generateItinerary.ts`
- Create: `functions/src/__tests__/generateItinerary.test.ts`

- [ ] **Step 1: Write the failing test**

Create `functions/src/__tests__/generateItinerary.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
cd d:\tour_app\functions; npx jest --verbose 2>&1 | Select-Object -Last 10
```

Expected: FAIL — `Cannot find module '../generateItinerary'`

- [ ] **Step 3: Create `functions/src/generateItinerary.ts`**

```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'
import { GeneratedItinerary } from './types'

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `你是一個專業的繁體中文旅遊規劃師。使用者會給你目的地、天數和偏好，你需要規劃一個詳細的行程。

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
          "category": "attraction",
          "address": "...",
          "time": "上午 10:00",
          "note": "..."
        }
      ]
    }
  ]
}`

export async function buildItinerary(
  apiKey: string,
  destination: string,
  days: number,
  preferences: string,
): Promise<GeneratedItinerary> {
  const client = new Anthropic({ apiKey })
  const userPrompt = `目的地：${destination}\n天數：${days} 天\n偏好：${preferences || '無特別偏好'}`

  let text: string
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: userPrompt }],
    })
    text = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    throw new HttpsError('internal', 'AI服務暫時無法使用')
  }

  let parsed: GeneratedItinerary
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpsError('internal', 'AI回傳格式錯誤')
  }

  if (!parsed.tripName || !Array.isArray(parsed.days)) {
    throw new HttpsError('internal', 'AI回傳格式錯誤')
  }
  return parsed
}

export const generateItinerary = onCall(
  { region: 'asia-east1', secrets: [anthropicApiKey], timeoutSeconds: 60 },
  async (request) => {
    const { destination, days, preferences } = request.data as {
      destination: string
      days: number
      preferences: string
    }
    if (!destination || typeof days !== 'number') {
      throw new HttpsError('invalid-argument', '目的地和天數為必填')
    }
    return buildItinerary(anthropicApiKey.value(), destination, days, preferences ?? '')
  }
)
```

- [ ] **Step 4: Run tests**

```powershell
cd d:\tour_app\functions; npx jest --verbose 2>&1 | Select-Object -Last 15
```

Expected: 4 tests pass.

- [ ] **Step 5: Verify TypeScript compiles**

```powershell
cd d:\tour_app\functions; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add functions/src/generateItinerary.ts functions/src/__tests__/generateItinerary.test.ts
git commit -m "feat: add generateItinerary Cloud Function with Claude API"
```

---

## Task 3: AI types + navigation types

**Files:**
- Modify: `src/shared/types/index.ts`

- [ ] **Step 1: Append AI types and update `RootStackParamList` in `src/shared/types/index.ts`**

Add these interfaces after the `PlaceSearchResult` interface:

```ts
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
```

Replace the `RootStackParamList` type:

```ts
export type RootStackParamList = {
  Tabs: undefined
  PlaceDetail: { place: PlaceSearchResult }
  ItineraryDetail: { tripId: string }
  AITripPreview: { itinerary: GeneratedItinerary }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd d:\tour_app; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/types/index.ts
git commit -m "feat: add GeneratedItinerary types and AITripPreview route"
```

---

## Task 4: App-side Firebase callable client + mock

**Files:**
- Create: `__mocks__/@react-native-firebase/functions.js`
- Modify: `jest.config.js`
- Create: `src/shared/api/claudeItinerary.ts`
- Create: `src/shared/api/__tests__/claudeItinerary.test.ts`

- [ ] **Step 1: Install `@react-native-firebase/functions`**

```powershell
cd d:\tour_app; npm install @react-native-firebase/functions
```

Expected: package added to `package.json`.

- [ ] **Step 2: Create `__mocks__/@react-native-firebase/functions.js`**

```js
const mockCallable = jest.fn()

const mockFunctionsInstance = {
  httpsCallable: jest.fn(() => mockCallable),
}

const functions = jest.fn(() => mockFunctionsInstance)
functions.__mockCallable = mockCallable
functions.__mockInstance = mockFunctionsInstance

module.exports = functions
```

- [ ] **Step 3: Update `jest.config.js` to add the functions mock**

Add to `moduleNameMapper`:

```js
'@react-native-firebase/functions': '<rootDir>/__mocks__/@react-native-firebase/functions.js',
```

The full updated `jest.config.js`:

```js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testPathIgnorePatterns: ['/node_modules/', '/functions/'],
  moduleNameMapper: {
    'react-native-config': '<rootDir>/__mocks__/react-native-config.js',
    '@react-native-async-storage/async-storage':
      '<rootDir>/__mocks__/async-storage-global-mock.js',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-gesture-handler': '<rootDir>/__mocks__/react-native-gesture-handler.js',
    'react-native-draggable-flatlist': '<rootDir>/__mocks__/react-native-draggable-flatlist.js',
    '@react-native-firebase/app': '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '@react-native-firebase/firestore': '<rootDir>/__mocks__/@react-native-firebase/firestore.js',
    '@react-native-firebase/functions': '<rootDir>/__mocks__/@react-native-firebase/functions.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|@react-native-firebase|zustand)/)',
  ],
}
```

**Note:** Before editing jest.config.js, read the current file first to confirm the exact current content of the `moduleNameMapper` and `async-storage` mock path (it was changed to `async-storage-global-mock.js` in a previous task).

- [ ] **Step 4: Write the failing test**

Create `src/shared/api/__tests__/claudeItinerary.test.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify it fails**

```powershell
cd d:\tour_app; npx jest src/shared/api/__tests__/claudeItinerary.test.ts --verbose 2>&1 | Select-Object -Last 10
```

Expected: FAIL — `Cannot find module '../claudeItinerary'`

- [ ] **Step 6: Create `src/shared/api/claudeItinerary.ts`**

```ts
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
```

- [ ] **Step 7: Run tests**

```powershell
cd d:\tour_app; npx jest src/shared/api/__tests__/claudeItinerary.test.ts --verbose 2>&1 | Select-Object -Last 10
```

Expected: 2 tests pass.

- [ ] **Step 8: Run full test suite**

```powershell
cd d:\tour_app; npx jest --passWithNoTests 2>&1 | Select-Object -Last 8
```

Expected: all existing tests still pass.

- [ ] **Step 9: Commit**

```bash
git add __mocks__/@react-native-firebase/functions.js jest.config.js src/shared/api/claudeItinerary.ts src/shared/api/__tests__/claudeItinerary.test.ts package.json package-lock.json
git commit -m "feat: add claudeItinerary client with Firebase functions mock"
```

---

## Task 5: createTripFromAI store action

**Files:**
- Modify: `src/features/itinerary/store.ts`

Read the current store first. The store already has `_localTrips`, `_merged()`, `addTrip`, and `generateId` in scope.

- [ ] **Step 1: Add `createTripFromAI` to the `ItineraryState` interface in `src/features/itinerary/store.ts`**

In the `ItineraryState` interface, add after `releaseAllLocksForTrip`:

```ts
createTripFromAI: (itinerary: GeneratedItinerary) => Promise<Trip>
```

Also add the import at the top of the file:

```ts
import { GeneratedItinerary } from '../../shared/types'
```

- [ ] **Step 2: Add the implementation inside `create<ItineraryState>((set, get) => ({`**

Add after `releaseAllLocksForTrip`:

```ts
createTripFromAI: async (itinerary) => {
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
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
cd d:\tour_app; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: no new errors (only the 2 pre-existing ones).

- [ ] **Step 4: Run all tests**

```powershell
cd d:\tour_app; npx jest --passWithNoTests 2>&1 | Select-Object -Last 8
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/itinerary/store.ts
git commit -m "feat: add createTripFromAI store action"
```

---

## Task 6: AITripModal component

**Files:**
- Create: `src/features/itinerary/components/AITripModal.tsx`

- [ ] **Step 1: Create `src/features/itinerary/components/AITripModal.tsx`**

```tsx
import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { generateAIItinerary } from '../../../shared/api/claudeItinerary'
import { GeneratedItinerary } from '../../../shared/types'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: (itinerary: GeneratedItinerary) => void
}

export function AITripModal({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme()
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(3)
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = destination.trim().length > 0 && !loading

  const handleGenerate = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const itinerary = await generateAIItinerary({
        destination: destination.trim(),
        days,
        preferences,
      })
      setDestination('')
      setDays(3)
      setPreferences('')
      onSuccess(itinerary)
    } catch (err: any) {
      Alert.alert('規劃失敗', err?.message ?? 'AI服務暫時無法使用，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>✨ AI 行程規劃</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>目的地</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="例如：台中、京都、峇里島"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>天數</Text>
          <View style={styles.daysRow}>
            <TouchableOpacity
              style={[styles.dayBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setDays(d => Math.max(1, d - 1))}
              disabled={loading}
            >
              <Text style={[styles.dayBtnText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.daysNum, { color: colors.text }]}>{days} 天</Text>
            <TouchableOpacity
              style={[styles.dayBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setDays(d => Math.min(14, d + 1))}
              disabled={loading}
            >
              <Text style={[styles.dayBtnText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>偏好描述（選填）</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            value={preferences}
            onChangeText={setPreferences}
            placeholder="例如：喜歡文創景點、台灣小吃，不喜歡人擠人"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: canSubmit ? colors.primary : colors.surfaceSecondary }]}
              onPress={handleGenerate}
              disabled={!canSubmit}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={[styles.generateBtnText, { color: '#fff', marginLeft: 8 }]}>AI 規劃中...</Text>
                </View>
              ) : (
                <Text style={[styles.generateBtnText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>
                  ✨ 開始規劃
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 15 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dayBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayBtnText: { fontSize: 20, fontWeight: '600' },
  daysNum: { fontSize: 18, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  textArea: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14, height: 80 },
  btns: { marginTop: 24, gap: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  generateBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  generateBtnText: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 15 },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd d:\tour_app; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/itinerary/components/AITripModal.tsx
git commit -m "feat: add AITripModal component for AI itinerary input"
```

---

## Task 7: AITripPreviewScreen

**Files:**
- Create: `src/features/itinerary/screens/AITripPreviewScreen.tsx`

- [ ] **Step 1: Create `src/features/itinerary/screens/AITripPreviewScreen.tsx`**

```tsx
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../shared/types'
import { useItineraryStore } from '../store'
import { useTheme } from '../../../shared/theme/ThemeContext'
import { CategoryBadge } from '../../../shared/components/CategoryBadge'

type Props = NativeStackScreenProps<RootStackParamList, 'AITripPreview'>

export function AITripPreviewScreen({ route, navigation }: Props) {
  const { itinerary } = route.params
  const { colors } = useTheme()
  const createTripFromAI = useItineraryStore(s => s.createTripFromAI)

  const handleConfirm = async () => {
    const trip = await createTripFromAI(itinerary)
    navigation.replace('ItineraryDetail', { tripId: trip.id })
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.tripName, { color: colors.text }]}>{itinerary.tripName}</Text>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          地點座標尚未取得，加入行程後可在地圖搜尋補全。
        </Text>

        {itinerary.days.map(day => (
          <View key={day.dayIndex} style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>第 {day.dayIndex + 1} 天</Text>
            <Text style={[styles.dayTheme, { color: colors.text }]}>{day.theme}</Text>
            {day.places.map((place, idx) => (
              <View key={idx} style={[styles.placeRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.placeTime, { color: colors.textTertiary }]}>{place.time}</Text>
                <View style={styles.placeInfo}>
                  <View style={styles.nameRow}>
                    <CategoryBadge category={place.category} />
                    <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                  </View>
                  <Text style={[styles.placeAddr, { color: colors.textSecondary }]} numberOfLines={1}>{place.address}</Text>
                  <Text style={[styles.placeNote, { color: colors.textTertiary }]}>{place.note}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.retryBtn, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryBtnText, { color: colors.text }]}>重新規劃</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmBtnText}>建立行程</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  tripName: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  hint: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  dayCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  dayLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  dayTheme: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  placeRow: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, gap: 10 },
  placeTime: { fontSize: 11, width: 68, paddingTop: 2 },
  placeInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  placeName: { fontSize: 14, fontWeight: '700', flex: 1 },
  placeAddr: { fontSize: 12, marginBottom: 2 },
  placeNote: { fontSize: 11, fontStyle: 'italic' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1,
  },
  retryBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, alignItems: 'center' },
  retryBtnText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd d:\tour_app; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/itinerary/screens/AITripPreviewScreen.tsx
git commit -m "feat: add AITripPreviewScreen for reviewing AI-generated itinerary"
```

---

## Task 8: Navigation registration + ItineraryListScreen ✨ button

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/features/itinerary/screens/ItineraryListScreen.tsx`

- [ ] **Step 1: Update `src/navigation/AppNavigator.tsx`**

```tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../shared/types'
import { TabNavigator } from './TabNavigator'
import { PlaceDetailScreen } from '../features/places/screens/PlaceDetailScreen'
import { ItineraryDetailScreen } from '../features/itinerary/screens/ItineraryDetailScreen'
import { AITripPreviewScreen } from '../features/itinerary/screens/AITripPreviewScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen}
          options={{ title: '地點詳情', headerBackTitle: '返回' }} />
        <Stack.Screen name="ItineraryDetail" component={ItineraryDetailScreen}
          options={{ title: '行程詳細', headerBackTitle: '返回' }} />
        <Stack.Screen name="AITripPreview" component={AITripPreviewScreen}
          options={{ title: 'AI 行程預覽', headerBackTitle: '返回' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

- [ ] **Step 2: Update `src/features/itinerary/screens/ItineraryListScreen.tsx`**

Read the current file first, then make these additions:

**Add import** (after existing imports):
```tsx
import { AITripModal } from '../components/AITripModal'
import { GeneratedItinerary } from '../../../shared/types'
```

**Add state** (inside `ItineraryListScreen` function, after existing `useState` calls):
```tsx
const [showAI, setShowAI] = useState(false)
```

**Add handler** (after `handleRename`):
```tsx
const handleAISuccess = (itinerary: GeneratedItinerary) => {
  setShowAI(false)
  navigation.navigate('AITripPreview', { itinerary })
}
```

**Add ✨ button to `fabRow`** (add between the `joinBtn` and the `+` fab):
```tsx
<TouchableOpacity
  style={[styles.aiBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
  onPress={() => setShowAI(true)}
>
  <Text style={styles.aiBtnText}>✨</Text>
</TouchableOpacity>
```

**Add AITripModal** (after `<ShareTripModal .../>` and before the rename Modal):
```tsx
<AITripModal
  visible={showAI}
  onClose={() => setShowAI(false)}
  onSuccess={handleAISuccess}
/>
```

**Add styles** (inside `StyleSheet.create`):
```tsx
aiBtn: {
  width: 48, height: 48, borderRadius: 24, borderWidth: 1,
  justifyContent: 'center', alignItems: 'center',
  elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
},
aiBtnText: { fontSize: 22 },
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
cd d:\tour_app; npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Expected: no new errors.

- [ ] **Step 4: Run all tests**

```powershell
cd d:\tour_app; npx jest --passWithNoTests 2>&1 | Select-Object -Last 8
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/AppNavigator.tsx src/features/itinerary/screens/ItineraryListScreen.tsx
git commit -m "feat: add AI trip planning button and wire up navigation"
```

---

## Task 9: Firebase deploy + API key setup

This task has **manual steps** that require the user to perform in their terminal.

- [ ] **Step 1: Install Firebase CLI globally (if not already installed)**

```powershell
npm install -g firebase-tools
```

- [ ] **Step 2: Log in to Firebase**

```powershell
firebase login
```

- [ ] **Step 3: Link the project**

```powershell
cd d:\tour_app; firebase use --add
```

Select the Firebase project (the one with TourApp).

- [ ] **Step 4: Set the Claude API key as a Firebase secret**

```powershell
firebase functions:secrets:set ANTHROPIC_API_KEY
```

When prompted, paste your Anthropic API key (get from https://console.anthropic.com).

- [ ] **Step 5: Build the functions**

```powershell
cd d:\tour_app\functions; npm run build
```

Expected: `lib/` directory created with compiled JS.

- [ ] **Step 6: Deploy functions**

```powershell
cd d:\tour_app; firebase deploy --only functions
```

Expected output includes: `Function URL (generateItinerary(asia-east1)): https://asia-east1-<project>.cloudfunctions.net/generateItinerary`

- [ ] **Step 7: Verify function is deployed**

In Firebase console → Functions → you should see `generateItinerary` listed.

- [ ] **Step 8: Rebuild app and test**

```powershell
cd d:\tour_app; npx react-native start --reset-cache
```

In a separate terminal:
```powershell
cd d:\tour_app; npx react-native run-android
```

Test by tapping ✨ → enter a destination → tap "開始規劃" → verify preview appears → tap "建立行程" → verify trip is created.

- [ ] **Step 9: Final commit**

```bash
git add -A
git status
git commit -m "feat: complete AI itinerary generation feature"
```
