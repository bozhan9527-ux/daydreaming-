import { ComponentType } from 'react';

import { TabIconId } from '../game/sprites/tabIcons';
import { AchievementPanel } from './AchievementPanel';
import { AscensionPanel } from './AscensionPanel';
import { CompanionPanel } from './CompanionPanel';
import { DungeonPanel } from './DungeonPanel';
import { InventoryTab } from './InventoryTab';
import { JobTab } from './JobTab';

export interface PanelTab {
  id: string;
  label: string;
  icon: TabIconId;
  Component: ComponentType;
  // 每個系統一個識別色:除了圖示,分頁列的啟用態邊框、分頁Modal的標題色都套這個顏色——
  // 目前6個系統的卡片/背景樣式幾乎一樣(同一套深色底+灰邊框),玩家單看色彩分不出「自己在
  // 哪個系統裡」。挑色時避開既有全域語意色(金色=成就/貨幣通用高亮、紅色=警示/戰敗),
  // 其餘6色盡量分散在色相環上,飽和度跟現有厭世莫蘭迪基調（HERO_PALETTE同一量級)保持一致,
  // 不會比角色本體還搶眼。
  accentColor: string;
}

// 之後要加新系統(例如商店)的分頁,只要在這裡多加一筆、在 game/sprites/tabIcons.ts 補一個 icon frame,
// TabBar 跟 app/index.tsx 都不用改。強化/鑲嵌已經收納進「裝備」子分頁裡(見 EquipmentPanel.tsx
// 的 SUB_VIEWS);「技能」併進「職業」分頁當子分頁(見 JobTab.tsx)、「裝備」併回「背包」分頁
// 當子分頁(見 InventoryTab.tsx)——原本8個頂層分頁塞一排太擠、且裝備/背包各自維護一份選取
// 部位的狀態互相不同步,兩組併成子分頁瀏覽後兩個問題一起解掉。
// 6顆等寬平分一整排(見 TabBar.tsx),圖示像素倍率統一交給 TabBar 的預設值,不再逐項各調各的,
// 不然等寬按鈕裡圖示忽大忽小反而更不整齊。
export const PANEL_TABS: PanelTab[] = [
  { id: 'job', label: '職業', icon: 'job', Component: JobTab, accentColor: '#e0a95c' },
  { id: 'inventory', label: '背包', icon: 'inventory', Component: InventoryTab, accentColor: '#8fd992' },
  { id: 'achievement', label: '成就', icon: 'achievement', Component: AchievementPanel, accentColor: '#c9a94f' },
  { id: 'companion', label: '寵物坐騎', icon: 'companion', Component: CompanionPanel, accentColor: '#e08a9e' },
  { id: 'dungeon', label: '副本', icon: 'dungeon', Component: DungeonPanel, accentColor: '#e0705c' },
  { id: 'ascension', label: '轉生', icon: 'ascension', Component: AscensionPanel, accentColor: '#7ad0c8' },
];
