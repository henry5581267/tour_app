# Tour App 資料夾架構

```
d:/tour_app/
│
├── src/                          # 所有 App 程式碼
│   ├── shared/                   # 跨功能共用
│   │   ├── types/index.ts        # TypeScript 型別（Trip、TripPlace 等）
│   │   ├── config.ts             # API Key 常數
│   │   ├── api/
│   │   │   ├── places.ts         # Google Places API 封裝
│   │   │   └── directions.ts     # Google Directions API 封裝
│   │   ├── storage/
│   │   │   ├── tripsStorage.ts   # 行程本機讀寫（AsyncStorage）
│   │   │   └── placesCache.ts    # 搜尋結果 24hr 快取
│   │   └── components/
│   │       ├── PlaceCard.tsx     # 大圖地點卡片
│   │       ├── CategoryBadge.tsx # 景點/餐廳/遊玩 標籤
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── features/
│   │   ├── places/               # 探索功能
│   │   │   ├── screens/
│   │   │   │   ├── PlacesScreen.tsx      # 搜尋畫面
│   │   │   │   └── PlaceDetailScreen.tsx # 地點詳情
│   │   │   └── components/
│   │   │       └── SearchBar.tsx
│   │   │
│   │   ├── itinerary/            # 行程功能
│   │   │   ├── screens/
│   │   │   │   ├── ItineraryListScreen.tsx   # 行程列表
│   │   │   │   └── ItineraryDetailScreen.tsx # 行程詳細
│   │   │   ├── components/
│   │   │   │   ├── DaySection.tsx        # 單日地點列表（▲▼排序）
│   │   │   │   ├── CreateTripModal.tsx   # 建立行程
│   │   │   │   ├── AddToTripModal.tsx    # 加入行程
│   │   │   │   └── ManualPlaceModal.tsx  # 手動新增地點
│   │   │   ├── utils/
│   │   │   │   └── sortByDistance.ts     # 最近鄰自動排序演算法
│   │   │   └── store.ts                  # Zustand 狀態管理
│   │   │
│   │   └── map/                  # 地圖功能
│   │       └── screens/
│   │           └── MapScreen.tsx # 地圖 + Pin + 路線
│   │
│   └── navigation/
│       ├── AppNavigator.tsx      # 根層 Stack 導航
│       └── TabNavigator.tsx      # 底部 Tab（探索/行程/地圖）
│
├── android/                      # Android 原生專案
├── ios/                          # iOS 原生專案
├── __mocks__/                    # Jest 測試用 mock
├── App.tsx                       # App 進入點
├── index.js                      # React Native 註冊點
├── .env                          # Google API Key（不進 git）
└── package.json                  # 依賴清單
```

## 三個主要功能模組

| 模組 | 說明 |
|------|------|
| **places** | 搜尋地點，看詳情，加入行程 |
| **itinerary** | 管理行程，自動排序，手動調整順序 |
| **map** | 視覺化顯示行程路線 |

## 技術堆疊

| 套件 | 用途 |
|------|------|
| React Native CLI | 跨平台 iOS / Android |
| React Navigation v6 | 頁面導航 |
| Zustand | 狀態管理 |
| AsyncStorage | 本機資料儲存 |
| Google Places API | 地點搜尋 |
| Google Directions API | 步行時間計算 |
| React Native Maps | 地圖顯示 |
| react-native-config | 讀取 .env 設定 |
