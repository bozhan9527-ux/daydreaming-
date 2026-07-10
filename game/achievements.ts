import { ENHANCE_MAX_LEVEL, GemType } from './equipment';

// 成就系統:純函式,不依賴 React/RN,可在 Node 環境單獨測試(見 CLAUDE.md 分層鐵律)。
// 26 個成就分 6 類:擊殺數/等級里程碑/裝備收集/強化鑲嵌/寵物坐騎/轉職。
// 判定邏輯是「全量重新計算」(evaluateUnlockedAchievementIds),不是增量判定——
// 這樣舊存檔(功能上線前就已經達標)第一次載入時能立刻被追溯性授予,不會因為
// 「達標當下這個功能還不存在」而被擋下。
export type AchievementCategory = 'kills' | 'level' | 'equipment' | 'enhance' | 'companion' | 'transfer';

export interface AchievementReward {
  coins: number;
  enhanceStones?: number;
  gems?: Partial<Record<GemType, number>>;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  reward: AchievementReward;
}

// 呼叫端(hooks/useGameState.ts)負責從即時狀態算出這份快照再傳進來,這個檔案本身不碰任何
// zustand store,維持純函式可測試性。
export interface AchievementProgress {
  killCount: number;
  level: number;
  unlockedPaidItemCount: number;
  totalPaidItemCount: number;
  maxEnhanceLevel: number;
  hasFullySocketedItem: boolean;
  companionUnlockedCount: number;
  totalCompanionCount: number;
  hasAssembledTransferProof: boolean;
  hasSwitchedJobOnce: boolean;
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  kills_1: {
    id: 'kills_1',
    category: 'kills',
    title: '初次交手',
    description: '擊敗第一隻怪物',
    reward: { coins: 20 },
  },
  kills_10: {
    id: 'kills_10',
    category: 'kills',
    title: '小試身手',
    description: '累計擊敗10隻怪物',
    reward: { coins: 50 },
  },
  kills_100: {
    id: 'kills_100',
    category: 'kills',
    title: '熟能生巧',
    description: '累計擊敗100隻怪物',
    reward: { coins: 300 },
  },
  kills_500: {
    id: 'kills_500',
    category: 'kills',
    title: '身經百戰',
    description: '累計擊敗500隻怪物',
    reward: { coins: 500, enhanceStones: 1 },
  },
  kills_1000: {
    id: 'kills_1000',
    category: 'kills',
    title: '千人斬',
    description: '累計擊敗1000隻怪物',
    reward: { coins: 1000, enhanceStones: 2 },
  },
  kills_5000: {
    id: 'kills_5000',
    category: 'kills',
    title: '屠戮無數',
    description: '累計擊敗5000隻怪物',
    reward: { coins: 3000, enhanceStones: 5, gems: { expGem: 1, coinGem: 1, speedGem: 1 } },
  },
  kills_10000: {
    id: 'kills_10000',
    category: 'kills',
    title: '傳說獵人',
    description: '累計擊敗10000隻怪物',
    reward: { coins: 6000, enhanceStones: 10, gems: { expGem: 3, coinGem: 3, speedGem: 3 } },
  },

  level_30: {
    id: 'level_30',
    category: 'level',
    title: '學生畢業',
    description: '等級達到30級,選定第一個主職',
    reward: { coins: 500 },
  },
  level_80: {
    id: 'level_80',
    category: 'level',
    title: '三轉在望',
    description: '等級達到80級,解鎖雙職兼修',
    reward: { coins: 800, enhanceStones: 1 },
  },
  level_120: {
    id: 'level_120',
    category: 'level',
    title: '資深冒險者',
    description: '等級達到120級',
    reward: { coins: 1500, enhanceStones: 2 },
  },
  level_200: {
    id: 'level_200',
    category: 'level',
    title: '四轉高手',
    description: '等級達到200級',
    reward: { coins: 2500, enhanceStones: 3, gems: { expGem: 1, coinGem: 1, speedGem: 1 } },
  },
  level_350: {
    id: 'level_350',
    category: 'level',
    title: '五轉大師',
    description: '等級達到350級,五階轉職全開',
    reward: { coins: 4000, enhanceStones: 5, gems: { expGem: 2, coinGem: 2, speedGem: 2 } },
  },
  level_500: {
    id: 'level_500',
    category: 'level',
    title: '封頂',
    description: '等級達到最高等級500級',
    reward: { coins: 8000, enhanceStones: 10, gems: { expGem: 5, coinGem: 5, speedGem: 5 } },
  },

  equip_10pct: {
    id: 'equip_10pct',
    category: 'equipment',
    title: '初嚐裝備',
    description: '解鎖10%的收費裝備款式',
    reward: { coins: 200 },
  },
  equip_25pct: {
    id: 'equip_25pct',
    category: 'equipment',
    title: '小小收藏家',
    description: '解鎖25%的收費裝備款式',
    reward: { coins: 500, enhanceStones: 1 },
  },
  equip_50pct: {
    id: 'equip_50pct',
    category: 'equipment',
    title: '裝備半藏',
    description: '解鎖50%的收費裝備款式',
    reward: { coins: 1200, enhanceStones: 3 },
  },
  equip_75pct: {
    id: 'equip_75pct',
    category: 'equipment',
    title: '裝備收藏家',
    description: '解鎖75%的收費裝備款式',
    reward: { coins: 2500, enhanceStones: 5, gems: { expGem: 2, coinGem: 2, speedGem: 2 } },
  },
  equip_100pct: {
    id: 'equip_100pct',
    category: 'equipment',
    title: '裝備圖鑑大師',
    description: '解鎖100%的收費裝備款式',
    reward: { coins: 6000, enhanceStones: 10, gems: { expGem: 5, coinGem: 5, speedGem: 5 } },
  },

  enhance_first: {
    id: 'enhance_first',
    category: 'enhance',
    title: '初次強化',
    description: '第一次強化成功',
    reward: { coins: 100 },
  },
  enhance_max: {
    id: 'enhance_max',
    category: 'enhance',
    title: '強化極限',
    description: '任一件裝備強化到+10封頂',
    reward: { coins: 1000, enhanceStones: 3 },
  },
  socket_full: {
    id: 'socket_full',
    category: 'enhance',
    title: '寶石鑲滿',
    description: '任一件裝備所有插槽都鑲上寶石',
    reward: { coins: 300, gems: { expGem: 1, coinGem: 1, speedGem: 1 } },
  },

  companion_first: {
    id: 'companion_first',
    category: 'companion',
    title: '初次相遇',
    description: '取得第一隻寵物或坐騎',
    reward: { coins: 200 },
  },
  companion_50pct: {
    id: 'companion_50pct',
    category: 'companion',
    title: '動物朋友',
    description: '收集50%的寵物坐騎圖鑑',
    reward: { coins: 800 },
  },
  companion_100pct: {
    id: 'companion_100pct',
    category: 'companion',
    title: '馴獸大師',
    description: '收集100%的寵物坐騎圖鑑',
    reward: { coins: 2000, enhanceStones: 5 },
  },

  transfer_first_proof: {
    id: 'transfer_first_proof',
    category: 'transfer',
    title: '轉職資格',
    description: '第一次集滿10個碎片、合成1個轉職證明',
    reward: { coins: 300 },
  },
  transfer_first_switch: {
    id: 'transfer_first_switch',
    category: 'transfer',
    title: '改頭換面',
    description: '第一次真正換過不同的主職職業',
    reward: { coins: 500 },
  },
};

export const ACHIEVEMENT_IDS: string[] = Object.keys(ACHIEVEMENTS);

// killCount 系門檻:達到即解鎖,單純門檻比較。
const KILL_THRESHOLDS: { id: string; threshold: number }[] = [
  { id: 'kills_1', threshold: 1 },
  { id: 'kills_10', threshold: 10 },
  { id: 'kills_100', threshold: 100 },
  { id: 'kills_500', threshold: 500 },
  { id: 'kills_1000', threshold: 1000 },
  { id: 'kills_5000', threshold: 5000 },
  { id: 'kills_10000', threshold: 10000 },
];

// 等級里程碑門檻:達到即解鎖,單純門檻比較。
const LEVEL_THRESHOLDS: { id: string; threshold: number }[] = [
  { id: 'level_30', threshold: 30 },
  { id: 'level_80', threshold: 80 },
  { id: 'level_120', threshold: 120 },
  { id: 'level_200', threshold: 200 },
  { id: 'level_350', threshold: 350 },
  { id: 'level_500', threshold: 500 },
];

// 裝備收藏比例門檻:達到即解鎖,比對「已解鎖收費裝備數 / 收費裝備總數」的比例。
const EQUIP_PCT_THRESHOLDS: { id: string; threshold: number }[] = [
  { id: 'equip_10pct', threshold: 0.1 },
  { id: 'equip_25pct', threshold: 0.25 },
  { id: 'equip_50pct', threshold: 0.5 },
  { id: 'equip_75pct', threshold: 0.75 },
  { id: 'equip_100pct', threshold: 1.0 },
];

// 寵物坐騎收藏比例門檻:同上,比對「已解鎖數 / 圖鑑總數」的比例。
const COMPANION_PCT_THRESHOLDS: { id: string; threshold: number }[] = [
  { id: 'companion_50pct', threshold: 0.5 },
  { id: 'companion_100pct', threshold: 1.0 },
];

// 純函式,全量重新計算(不是增量判定):傳入目前的完整進度快照,回傳「目前應該全部解鎖」的
// 成就 id 清單。呼叫端拿這份結果跟已持久化的 unlockedAchievementIds 做 diff 來找出「這次新解鎖」的項目。
export function evaluateUnlockedAchievementIds(progress: AchievementProgress): string[] {
  const unlocked: string[] = [];

  for (const { id, threshold } of KILL_THRESHOLDS) {
    if (progress.killCount >= threshold) unlocked.push(id);
  }

  for (const { id, threshold } of LEVEL_THRESHOLDS) {
    if (progress.level >= threshold) unlocked.push(id);
  }

  const equipPct = progress.totalPaidItemCount > 0 ? progress.unlockedPaidItemCount / progress.totalPaidItemCount : 0;
  for (const { id, threshold } of EQUIP_PCT_THRESHOLDS) {
    if (equipPct >= threshold) unlocked.push(id);
  }

  if (progress.maxEnhanceLevel >= 1) unlocked.push('enhance_first');
  if (progress.maxEnhanceLevel >= ENHANCE_MAX_LEVEL) unlocked.push('enhance_max');
  if (progress.hasFullySocketedItem) unlocked.push('socket_full');

  if (progress.companionUnlockedCount >= 1) unlocked.push('companion_first');
  const companionPct =
    progress.totalCompanionCount > 0 ? progress.companionUnlockedCount / progress.totalCompanionCount : 0;
  for (const { id, threshold } of COMPANION_PCT_THRESHOLDS) {
    if (companionPct >= threshold) unlocked.push(id);
  }

  if (progress.hasAssembledTransferProof) unlocked.push('transfer_first_proof');
  if (progress.hasSwitchedJobOnce) unlocked.push('transfer_first_switch');

  return unlocked;
}

export interface AchievementProgressDisplay {
  current: number;
  target: number;
}

// 只給「單純累積量對比單一數字門檻」的成就(擊殺數/等級/裝備收藏比例/寵物坐騎收藏比例)
// 回傳可顯示的進度(例如 87/100),給 UI 畫進度條用。其餘(enhance_first/enhance_max/
// socket_full/companion_first/transfer_*)本質是「某件裝備或某個事件是否發生過」,不是
// 單純的累積量,回傳 null——UI 端對這些只畫鎖定/解鎖兩態,不用硬湊一個進度數字。
export function getAchievementProgressDisplay(id: string, progress: AchievementProgress): AchievementProgressDisplay | null {
  const kill = KILL_THRESHOLDS.find((t) => t.id === id);
  if (kill) return { current: Math.min(progress.killCount, kill.threshold), target: kill.threshold };

  const level = LEVEL_THRESHOLDS.find((t) => t.id === id);
  if (level) return { current: Math.min(progress.level, level.threshold), target: level.threshold };

  const equipPct = EQUIP_PCT_THRESHOLDS.find((t) => t.id === id);
  if (equipPct) {
    const target = Math.max(1, Math.ceil(equipPct.threshold * progress.totalPaidItemCount));
    return { current: Math.min(progress.unlockedPaidItemCount, target), target };
  }

  const companionPct = COMPANION_PCT_THRESHOLDS.find((t) => t.id === id);
  if (companionPct) {
    const target = Math.max(1, Math.ceil(companionPct.threshold * progress.totalCompanionCount));
    return { current: Math.min(progress.companionUnlockedCount, target), target };
  }

  return null;
}
