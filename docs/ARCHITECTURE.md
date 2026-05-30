# Tour App 架構文件

## App 啟動順序

```
Android OS
  → MainApplication.kt   （原生初始化：載入 RN 環境、原生模組、Hermes JS 引擎）
    → MainActivity.kt    （建立視窗，回傳 "TourApp" 元件名稱）
      → index.js         （JS 橋接：AppRegistry.registerComponent('TourApp', App)）
        → App.tsx        （React 進入點：ThemeProvider → 載入行程 → AppNavigator）
          → AppNavigator.tsx   （Root Stack）
            → TabNavigator.tsx （底部 Tab：探索 / 行程 / 地圖）
              → 各功能畫面
```

---

## 資料夾架構

```
d:/tour_app/
│
├── android/                              # Android 原生專案
│   └── app/src/main/java/com/tourapp/
│       ├── MainActivity.kt               # Android 進入點，指定 RN 元件名稱
│       └── MainApplication.kt            # App 初始化，載入原生模組
│
├── src/                                  # 所有 JS/TS App 程式碼
│   │
│   ├── shared/                           # 跨功能共用
│   │   ├── types/index.ts                # 所有 TypeScript 型別定義
│   │   ├── config.ts                     # API Key 常數（從 .env 讀取）
│   │   ├── theme/
│   │   │   ├── index.ts                  # 顏色定義（light / dark）
│   │   │   └── ThemeContext.tsx          # Theme Context + useTheme hook
│   │   ├── api/
│   │   │   ├── places.ts                 # Google Places API 封裝
│   │   │   └── directions.ts             # Google Directions API 封裝
│   │   ├── storage/
│   │   │   ├── tripsStorage.ts           # 行程 AsyncStorage CRUD
│   │   │   └── placesCache.ts            # 搜尋結果 24hr 快取
│   │   └── components/
│   │       ├── PlaceCard.tsx             # 大圖地點卡片
│   │       ├── CategoryBadge.tsx         # 景點／餐廳／遊玩 標籤
│   │       ├── LoadingSpinner.tsx        # 載入指示器
│   │       ├── EmptyState.tsx            # 空白狀態畫面
│   │       └── ConfirmDialog.tsx         # 刪除確認對話框
│   │
│   ├── features/
│   │   ├── places/                       # 探索功能
│   │   │   ├── screens/
│   │   │   │   ├── PlacesScreen.tsx      # 搜尋畫面（跨分類同時搜）
│   │   │   │   └── PlaceDetailScreen.tsx # 地點詳情 + 加入行程
│   │   │   └── components/
│   │   │       └── SearchBar.tsx         # 搜尋輸入欄
│   │   │
│   │   ├── itinerary/                    # 行程功能
│   │   │   ├── screens/
│   │   │   │   ├── ItineraryListScreen.tsx    # 行程列表（長按更名/刪除）
│   │   │   │   └── ItineraryDetailScreen.tsx  # 行程詳細（按天顯示）
│   │   │   ├── components/
│   │   │   │   ├── DaySection.tsx        # 單日地點列表（▲▼排序）
│   │   │   │   ├── CreateTripModal.tsx   # 建立新行程
│   │   │   │   ├── AddToTripModal.tsx    # 加入行程（卡片式選天）
│   │   │   │   └── ManualPlaceModal.tsx  # 手動新增地點
│   │   │   ├── utils/
│   │   │   │   ├── sortByDistance.ts     # 最近鄰演算法（Haversine 直線距離）
│   │   │   │   └── sortByRoute.ts        # 優化排序（Directions API + 開放時間）
│   │   │   └── store.ts                  # Zustand 狀態管理（所有行程操作）
│   │   │
│   │   └── map/                          # 地圖功能
│   │       └── screens/
│   │           └── MapScreen.tsx         # 地圖 + Pin + 路線連線
│   │
│   └── navigation/
│       ├── AppNavigator.tsx              # Root Stack（含深層頁面）
│       └── TabNavigator.tsx              # 底部 Tab + 深色模式切換按鈕
│
├── App.tsx                               # React 進入點（ThemeProvider）
├── index.js                              # RN 橋接（AppRegistry）
├── .env                                  # Google API Key（不進 git）
└── package.json                          # 依賴清單
```

---

## 三個主要功能模組

| 模組 | 說明 |
|------|------|
| **places** | 搜尋地點（跨分類），看詳情，加入行程 |
| **itinerary** | 建立/更名/刪除行程，管理每天地點，自動排序路線 |
| **map** | 視覺化顯示行程地點 Pin 和路線 |

---

## 技術堆疊

| 套件 | 用途 |
|------|------|
| React Native CLI 0.85 | 跨平台 iOS / Android |
| React Navigation v6 | 頁面導航（Stack + BottomTab） |
| Zustand | 輕量狀態管理 |
| AsyncStorage | 本機行程資料儲存 |
| Google Places API | 地點搜尋與詳情 |
| Google Directions API | 實際步行時間 + 路線優化排序 |
| React Native Maps | 地圖顯示、Marker、Polyline |
| react-native-config | 讀取 .env API Key |
| React Context (ThemeContext) | 深色／淺色模式切換 |

---

## 路線優化排序邏輯

1. 用 **Directions API** 取得兩點間實際步行時間（秒）
2. **關門越早**的地點給予優先（避免到了才關門）
3. **預計到達時尚未開門**的地點延後安排
4. 沒有座標的手動新增地點排在最後
5. 演算法：貪婪最近鄰（Greedy Nearest Neighbor），O(N²) API 呼叫
