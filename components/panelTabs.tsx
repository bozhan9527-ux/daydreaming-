import { ComponentType } from 'react';

import { TabIconId } from '../game/sprites/tabIcons';
import { AchievementPanel } from './AchievementPanel';
import { CompanionPanel } from './CompanionPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { InventoryPanel } from './InventoryPanel';
import { JobSelector } from './JobSelector';
import { SkillPanel } from './SkillPanel';

export interface PanelTab {
  id: string;
  label: string;
  icon: TabIconId;
  Component: ComponentType;
  // 分頁圖示的像素放大倍率,不填就用 TabBar 的預設值。裝備/技能是最常用的兩個分頁,特別放大方便辨識。
  iconPixelSize?: number;
}

// 之後要加新系統(例如商店)的分頁,只要在這裡多加一筆、在 game/sprites/tabIcons.ts 補一個 icon frame,
// TabBar 跟 app/index.tsx 都不用改。強化/鑲嵌已經收納進「裝備」分頁裡當子分頁(見
// EquipmentPanel.tsx 的 SUB_VIEWS),不再是這裡的獨立項目;背包則反過來從裝備分頁拆成獨立頂層項目。
export const PANEL_TABS: PanelTab[] = [
  { id: 'job', label: '職業', icon: 'job', Component: JobSelector },
  { id: 'equipment', label: '裝備', icon: 'equipment', Component: EquipmentPanel, iconPixelSize: 4 },
  { id: 'inventory', label: '背包', icon: 'inventory', Component: InventoryPanel, iconPixelSize: 4 },
  { id: 'skill', label: '技能', icon: 'skill', Component: SkillPanel, iconPixelSize: 4 },
  { id: 'achievement', label: '成就', icon: 'achievement', Component: AchievementPanel },
  { id: 'companion', label: '寵物坐騎', icon: 'companion', Component: CompanionPanel },
];
