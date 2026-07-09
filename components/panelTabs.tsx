import { ComponentType } from 'react';

import { TabIconId } from '../game/sprites/tabIcons';
import { CompanionPanel } from './CompanionPanel';
import { EnhancementPanel } from './EnhancementPanel';
import { EquipmentCodexPanel } from './EquipmentCodexPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { JobSelector } from './JobSelector';
import { SkillPanel } from './SkillPanel';
import { SocketPanel } from './SocketPanel';

export interface PanelTab {
  id: string;
  label: string;
  icon: TabIconId;
  Component: ComponentType;
  // 分頁圖示的像素放大倍率,不填就用 TabBar 的預設值。裝備/技能是最常用的兩個分頁,
  // 特別放大方便辨識;圖鑑圖示縮小,讓 7 個分頁擠得進同一排。
  iconPixelSize?: number;
}

// 之後要加新系統(例如商店)的分頁,只要在這裡多加一筆、在 game/sprites/tabIcons.ts 補一個 icon frame,
// TabBar 跟 app/index.tsx 都不用改。
export const PANEL_TABS: PanelTab[] = [
  { id: 'job', label: '職業', icon: 'job', Component: JobSelector },
  { id: 'equipment', label: '裝備', icon: 'equipment', Component: EquipmentPanel, iconPixelSize: 4 },
  { id: 'skill', label: '技能', icon: 'skill', Component: SkillPanel, iconPixelSize: 4 },
  { id: 'companion', label: '寵物坐騎', icon: 'companion', Component: CompanionPanel },
  { id: 'enhance', label: '強化', icon: 'enhance', Component: EnhancementPanel },
  { id: 'socket', label: '鑲嵌', icon: 'socket', Component: SocketPanel },
  { id: 'codex', label: '圖鑑', icon: 'codex', Component: EquipmentCodexPanel, iconPixelSize: 2 },
];
