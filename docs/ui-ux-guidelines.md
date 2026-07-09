# UI/UX 設計參考原則

給後續調整畫面版面/美術時用的判斷依據,取代「憑空設計」。跟 `CLAUDE.md` 的「像素美術規格」互補:
這份文件講「設計前先看什麼、怎麼判斷版面好壞」,`CLAUDE.md` 講「畫出來的東西要符合什麼規格」。

## 結論

不引進任何外部 UI 元件庫或遊戲引擎(呼應 `CLAUDE.md` 既有的「禁止引入」清單)。這個專案是純
React Native 元件樹 + 手刻像素圖(`buildFrame`/mark-based grid),市面上找到的遊戲 UI 資源
(Phaser PixUI、PixelUIEngine、react-native-game-engine、react-game-kit 等)都是給 Canvas/引擎
渲染的遊戲用,換過去等於重寫渲染架構,不划算。

真正該做的只有兩件事:

1. **設計新畫面或調整版面前,先看參考再動手**:去 [Game UI Database](https://www.gameuidatabase.com/)
   篩對應分類(Inventory/Equipment/HUD 等)看幾張截圖抓版面結構靈感(欄位怎麼分組、清單怎麼排序、
   標籤怎麼放),再照現有像素美術規格手刻。不直接複製圖片、不引入套件。
2. **用 Laws of UX 當版面簡化的判斷依據**,不是憑感覺。例如 Hick's Law(選項越多、決策越慢)可以
   解釋「7 個分頁擠一排 + 經驗條整合」這類簡化為什麼是對的方向。

## 重要限制:AI 目前無法直接瀏覽/查看外部網站的圖片內容

WebSearch 只回傳文字搜尋結果(標題+摘要),不能真的載入 gameuidatabase.com 或其他網站去「看」
截圖長什麼樣。所以「依據參考重新設計」在實務上只能是下面兩種做法之一,不能跳過就說「已經參考過了」:

- **使用者自己去篩選、把想要的截圖貼給 AI 看**(Read 工具可以讀圖片檔),AI 才能真的比對畫面元素。
- **AI 只套用版面原則(分組、對齊、資訊層級、Hick's Law 這類結構性判斷)**,不涉及模仿特定視覺風格。

如果沒有依上述兩種方式之一取得具體參考,任何「已依據 Game UI Database 重繪」的說法都是不準確的,
只是重新畫一次而已。

## 不建議採用的資源(僅供之後排除時參考,不用重複研究)

- Phaser PixUI / PixelUIEngine(LibGDX)/ react-native-game-engine / react-game-kit — 引擎導向,跟本專案渲染方式不合
- matter-of-scale-clone / farcebook / idle-game-engine 等 Redux 放置遊戲範例 — 講遊戲邏輯不是 UI,而且本專案已用 zustand,架構更精簡
