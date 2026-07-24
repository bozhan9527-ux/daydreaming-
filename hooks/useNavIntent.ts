import { create } from 'zustand';

// 跨分頁跳轉意圖:材料/鑲嵌石瀏覽頁(在「背包」分頁底下)點擊素材後,要跳到「職業」
// (技能書用在技能升級)或「工坊」(強化石/鑲嵌石實際使用的地方)這種不同頂層分頁,
// 但 openTabId 是 app/index.tsx 內的區域 state,深埋在Modal裡的子元件構不到——比照
// useToast.ts 同一套「小型全域單例store」做法,不用把整棵分頁狀態樹搬進zustand。
//
// tabId 由 app/index.tsx 消化(切換 openTabId 後立刻清空);workshopView 由
// WorkshopTab.tsx 自己在掛載/更新時消化(切換 hostView 後立刻清空)——兩個欄位各自
// 獨立清空,不用互相等對方的render時機。
interface NavIntentState {
  tabId: string | null;
  workshopView: 'enhance' | 'craft' | 'socket' | null;
  requestTab: (tabId: string, workshopView?: 'enhance' | 'craft' | 'socket') => void;
  consumeTab: () => void;
  consumeWorkshopView: () => void;
}

export const useNavIntent = create<NavIntentState>((set) => ({
  tabId: null,
  workshopView: null,
  requestTab: (tabId, workshopView) => set({ tabId, workshopView: workshopView ?? null }),
  consumeTab: () => set({ tabId: null }),
  consumeWorkshopView: () => set({ workshopView: null }),
}));
