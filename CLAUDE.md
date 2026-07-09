# 勇者發呆中 (Hero Idling)

> 本專案以 Claude Sonnet 5 為主力開發模型。文件依 Sonnet 特性編寫:
> 指令明確化、任務小步驟化、每步可驗證。請嚴格遵循本文件,不要自行推測未寫明的架構決策。

## 專案概述
一款「反差萌」放置型手機遊戲。開著 App 時,勇者會自動往右移動、遇怪自動戰鬥(依職業呈現不同攻擊視覺),
每打倒一隻怪即時獲得經驗/貨幣,稀有度不定期跳出吐槽/彩蛋畫面;點勇者可以加速當前這場戰鬥。
玩家不玩的時候(背景/關閉 App),用同一套經驗公式反推離線期間打倒了幾隻怪、賺了多少經驗跟貨幣。
核心體驗 = 「打開就有驚喜,不開也在成長」。

- 目標平台:iOS + Android(React Native / Expo)
- 開發模式:Claude Code + GitHub,MVP 階段純本地儲存、不接後端

## 給 Sonnet 的工作原則
1. **一次只做一件事**:每個任務聚焦單一功能或單一檔案群,完成並通過驗證後才進入下一步。禁止一次大範圍改動多個模組。
2. **先讀後寫**:修改任何檔案前,先讀取該檔案與其直接依賴,確認現有模式後再動手。
3. **不確定就問**:遇到本文件未定義的架構決策(新增套件、改資料結構、改公式),先提出方案並停下等確認,不要直接實作。
4. **每次修改後自我驗證**:執行「驗證流程」章節的指令,失敗就修到通過,不可留下紅字。
5. **不要過度工程**:MVP 階段不需要抽象層、不需要為未來後端預留介面。最簡單能動的寫法優先。

## 技術棧(固定,不可自行替換)
- Runtime: Expo(最新 SDK)+ Expo Router
- 語言: TypeScript(strict mode)
- 狀態管理: Zustand
- 本地儲存: @react-native-async-storage/async-storage
- 動畫: react-native-reanimated(只用 GPU 屬性:transform、opacity)

### 禁止引入(除非使用者明確要求)
- Redux 或其他全域狀態庫
- styled-components / Emotion(一律用 StyleSheet)
- 任何 UI 元件庫(Material UI、NativeBase 等),UI 全部自製
- 遊戲引擎(Unity/Godot/Phaser)
- 任何後端相關套件(MVP 階段連 supabase-js 都不裝)

## 專案結構
```
app/          Expo Router 檔案式路由(頁面層,只做組裝)
components/   UI 元件(勇者角色、觸發畫面、數值面板)
game/         遊戲核心邏輯(純函式,禁止 import React)
  leveling.ts   等級/經驗值公式
  trigger.ts    點擊觸發機率邏輯 + 保底
  offline.ts    離線收益結算
  events/       特殊畫面內容庫(TS 資料檔)
hooks/        自訂 hooks(useGameState、useOfflineProgress)
lib/          storage.ts 儲存封裝、constants.ts 常數
assets/       圖片、音效
```

**分層鐵律**:`game/` 是純邏輯層,必須可以在 Node 環境單獨測試。
任何 React、RN、Expo 的 import 出現在 `game/` 內都算錯誤。

## 遊戲核心數值(單一真相來源:game/ 內,UI 禁止寫死數字)

### 等級與經驗值
- 離線每分鐘經驗:`exp_per_min = 10 * (1 + level * 0.05)`
- 升級所需經驗:`exp_to_next(level) = 100 * 1.15^level`
- 離線收益單次結算上限 24 小時
- 離線結算 = 「上次時間戳 vs 現在」純計算,禁止任何背景常駐方案

### 點擊觸發機率表(定義於 game/trigger.ts)
| 類型 | 機率 | 內容 |
|---|---|---|
| 一般反應 | 70% | 勇者吐槽、日常小動畫 |
| 稀有畫面 | 22% | 特殊事件插圖/動畫 |
| 超稀有彩蛋 | 7% | 大型彩蛋畫面 |
| 傳說事件 | 1% | 隱藏劇情片段 |

- 保底:連續 30 次未出「稀有以上」,下一次必定稀有以上
- 保底計數器存於遊戲狀態,隨存檔持久化

### 內容庫格式(game/events/)
```ts
{ id: string, rarity: 'common'|'rare'|'epic'|'legendary',
  type: 'text'|'image'|'animation', payload: ... }
```
- MVP 數量目標:common 20 / rare 8 / epic 4 / legendary 2
- 文案語氣:自嘲、厭世但可愛,繁體中文,禁止說教感

## 開發指令
- `npx expo start` — 啟動開發伺服器
- `npx tsc --noEmit` — 型別檢查
- `npx expo start --clear` — Metro 出問題時清快取重啟

## 驗證流程(每次修改後必跑,順序固定)
1. `npx tsc --noEmit` → 必須零錯誤
2. 若改動 `game/` 內任何檔案 → 用 node 直接跑該模組的快速驗證
   (例:印出 Lv1~Lv20 的 exp_to_next 曲線,確認單調遞增且無 NaN)
3. 若改動存檔結構 → 確認附上舊版存檔的遷移邏輯,並模擬一次「舊存檔載入」

## 程式碼規範
- functional components + hooks,元件超過 200 行就拆
- 禁用 `any`、禁用非空斷言 `!`
- 時間一律用 `Date.now()` 毫秒時間戳,禁止 Date 物件直接比較
- 隨機數統一走 `game/trigger.ts` 的封裝函式,方便未來替換與測試
- 命名:元件 PascalCase、函式 camelCase、常數 UPPER_SNAKE_CASE

## 安全規則(以下修改前必須先說明方案並取得確認)
- `game/leveling.ts` 公式常數 — 影響全體進度平衡
- `lib/storage.ts` 存檔 schema — 改壞 = 玩家進度遺失;任何變更必附遷移邏輯
- `game/trigger.ts` 機率表與保底邏輯

## 階段路線圖(目前在第 2 階段)
1. **MVP**:點擊按鈕 + 觸發機率 + 離線升級 + 本地存檔(無美術)——已完成
2. **內容擴充**:特殊畫面美術、動畫、音效——進行中
3. **雲端階段**:Supabase 雲端存檔與排行榜(屆時才更新本文件與技術棧)

## 像素美術規格(第 2 階段,單一真相來源)

- **畫布尺寸**:原生 20×24(勇者本體,`game/sprites/heroSilhouette.ts` 的 `PADDED_WIDTH`/列數),純程式產生(色碼網格 + `PixelSprite` 用 View 渲染),不是點陣圖檔;`pixelSize` 只負責顯示時等比放大,不改變原生網格大小
- **調色盤**:厭世莫蘭迪(低飽和霧灰色系)
  ```
  K 外框  #3a3542    H 髮色  #7a7488    S 膚色  #d9c9b8
  T 上衣  #8b8698    D 上衣暗部 #6b6678   B 腰帶  #5c5468
  P 褲子  #4a4456    O 靴子  #38323f
  ```
- **體型**:瘦/標準/胖 3 級,頭與身體共用同一組寬度參數同步縮放,外框隨新輪廓重描(不可用色塊疊加模擬)
  - 標準:head=4, body=4 半寬
  - 瘦:head=3, body=2 半寬
  - 胖:head=6, body=6 半寬(= 安全上限,外框剛好卡在武器插槽保留區邊界,不可再胖)
  - 臉部半寬下限為 3,確保雙眼像素間至少留 1 格鼻樑間距,不可合併成一條線
- **性別**:不做獨立身體變體。用預設裝備組合(頭飾/下身/配色)區分,共用同一套身體與插槽系統
- **裝備插槽**(10 個,由後到前疊層):
  1. 背飾 2. 下身 3. 上身 4. 腰帶 5. 頭飾 6. 面飾 7. 手套 8. 副手(盾/書) 9. 主手武器
  - 戒指不疊在本體上,純數值加成道具,UI 用圖示表示
  - 雙手武器裝備時,副手(盾/書)插槽必須鎖死清空(資料驗證邏輯,非美術問題)
  - 武器/盾牌插槽左右各保留 3px(20 寬畫布下,對應舊稿 40 寬時的 6px),體型變化不可佔用此區域

## UI/UX 設計參考原則

設計新畫面或調整版面前,先看 [`docs/ui-ux-guidelines.md`](docs/ui-ux-guidelines.md)——裡面講
「去哪裡找版面靈感、怎麼判斷版面好壞」,跟上面的像素美術規格互補(那份講畫出來的東西要符合什麼規格)。
