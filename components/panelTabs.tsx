import { ComponentType } from 'react';

import { TabIconId } from '../game/sprites/tabIcons';
import { CompanionPanel } from './CompanionPanel';
import { DungeonPanel } from './DungeonPanel';
import { InventoryTab } from './InventoryTab';
import { JobTab } from './JobTab';
import { ShopTab } from './ShopTab';
import { WorkshopTab } from './WorkshopTab';

export interface PanelTab {
  id: string;
  label: string;
  icon: TabIconId;
  Component: ComponentType;
  // 每個系統一個識別色:除了圖示,分頁列的啟用態邊框、分頁Modal的標題色都套這個顏色——
  // 目前幾個系統的卡片/背景樣式幾乎一樣(同一套深色底+灰邊框),玩家單看色彩分不出「自己在
  // 哪個系統裡」。挑色時避開既有全域語意色(金色=成就/貨幣通用高亮、紅色=警示/戰敗),
  // 其餘顏色盡量分散在色相環上,飽和度跟現有厭世莫蘭迪基調（HERO_PALETTE同一量級)保持一致,
  // 不會比角色本體還搶眼。
  accentColor: string;
}

// 強化/鑲嵌已經收納進「裝備」子分頁裡(見 EquipmentPanel.tsx 的 SUB_VIEWS);「技能」併進
// 「職業」分頁當子分頁(見 JobTab.tsx)、「裝備」併回「背包」分頁當子分頁(見 InventoryTab.tsx)
// ——原本8個頂層分頁塞一排太擠、且裝備/背包各自維護一份選取部位的狀態互相不同步,兩組併成
// 子分頁瀏覽後兩個問題一起解掉。「成就」整個移出頂層分頁,併進右側任務徽章(見
// DailyQuestBadge.tsx 的成就收合區塊)——終生累積的成就清單跟每日/每週任務同樣是「有事可領」
// 的提醒性質,收在同一個徽章裡比另外佔一個頂層分頁位置更直覺。
// 「轉生」原本也是頂層分頁,UX覆盤發現它是Lv50+限定的終局系統,平常不需要隨時可見,騰出來
// 的位置換給更常用的「商店」——轉生改成右上角獨立小icon(見 AscensionBadge.tsx,位置緊接在
// 成就icon下面),玩法/數值/存檔完全不動,只是換個入口。「商店」則從「背包→裝備」子分頁裡
// 的一個切換態升格成獨立頂層分頁(見 ShopTab.tsx),核心的花錢買裝備迴圈原本要點三層才到
// 得了,拉到跟其餘系統同一層。
// 等寬平分一整排(見 TabBar.tsx),圖示像素倍率統一交給 TabBar 的預設值,不再逐項各調各的,
// 不然等寬按鈕裡圖示忽大忽小反而更不整齊。
export const PANEL_TABS: PanelTab[] = [
  { id: 'job', label: '職業', icon: 'job', Component: JobTab, accentColor: '#e0a95c' },
  { id: 'inventory', label: '背包', icon: 'inventory', Component: InventoryTab, accentColor: '#8fd992' },
  { id: 'equipment', label: '商店', icon: 'equipment', Component: ShopTab, accentColor: '#7ad0c8' },
  { id: 'workshop', label: '工坊', icon: 'enhance', Component: WorkshopTab, accentColor: '#9b8ee0' },
  { id: 'companion', label: '寵物坐騎', icon: 'companion', Component: CompanionPanel, accentColor: '#e08a9e' },
  { id: 'dungeon', label: '副本', icon: 'dungeon', Component: DungeonPanel, accentColor: '#e0705c' },
];
