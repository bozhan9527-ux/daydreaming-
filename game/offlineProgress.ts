// 離線期間讓「關卡進度」也真的推進,不是只補經驗值——沿用即時戰鬥(hooks/useGameState.ts的
// tickBattle)同一套規則(每小關5殺、魔王小關1殺晉級、大魔王觸發轉生點數),但簡化成不擲稀有度
// 亂數(直接用平均值)、不觸發裝備/寵物/轉職碎片這類「一次性、有意義內容」的掉落/技能/爆擊/成就,
// 維持「離線是簡化版」的既有定位。強化石/寶石/技能書這三種純數量材料是例外——用擊殺數×掉落機率
// 算期望值(無條件四捨五入),不逐次擲亂數,一樣不違背「離線=期望值計算、不加RNG」的精神。
// 獨立成一個檔案而不是塞進 game/battle.ts,是因為 battle.ts 的既有設計刻意不認識關卡系統的
// StageProgress 結構(見 battle.ts 的 generateEncounter 說明);這裡是兩邊規則的交會點,
// 跟 tickBattle 本身是同樣定位,只是拆出來成純函式方便離線結算重用/測試。
import { getCycleCount } from './ascension';
import { coinsForRarity } from './currency';
import { ENHANCE_STONE_DROP_CHANCE, GEM_DROP_CHANCE, GEM_TYPES, GemType } from './equipment';
import { monsterHp } from './heroHealth';
import { SKILL_BOOK_DROP_CHANCE } from './skillTree';
import {
  advanceStageProgress,
  getStageDifficultyMultiplier,
  isBossSubStage,
  isFinalBossStage,
  StageProgress,
} from './stages';
import { Rarity } from './trigger';

const RARITY_WEIGHTS: Record<Rarity, number> = { common: 0.7, rare: 0.22, epic: 0.07, legendary: 0.01 };
const RARITY_LIST = Object.keys(RARITY_WEIGHTS) as Rarity[];

const MIN_FIGHT_DURATION_MS = 500;
// 極端邊界(例如攻擊力接近0)保底安全閥,避免離線結算迴圈真的卡死。
const SAFETY_MAX_KILLS = 300_000;

function avgMonsterHp(difficultyMultiplier: number): number {
  return RARITY_LIST.reduce((sum, rarity) => sum + RARITY_WEIGHTS[rarity] * monsterHp(rarity, difficultyMultiplier), 0);
}

function avgCoinsPerKill(difficultyMultiplier: number, coinMultiplier: number): number {
  const base = RARITY_LIST.reduce((sum, rarity) => sum + RARITY_WEIGHTS[rarity] * coinsForRarity(rarity), 0);
  return base * coinMultiplier * difficultyMultiplier;
}

export interface OfflineStageProgressResult {
  stageProgress: StageProgress;
  totalStagesCleared: number;
  killCount: number;
  kills: number;
  coins: number;
  ascensionPointsGained: number;
  enhanceStonesGained: number;
  skillBooksGained: number;
  gemsGained: Partial<Record<GemType, number>>;
}

export function simulateOfflineStageProgress(
  elapsedMs: number,
  stageProgress: StageProgress,
  totalStagesCleared: number,
  killCount: number,
  heroAttackPowerValue: number,
  speedMultiplier: number,
  coinMultiplier: number,
  ascensionPointsPerCycle: number
): OfflineStageProgressResult {
  let remainingMs = elapsedMs;
  let progress = stageProgress;
  let stagesCleared = totalStagesCleared;
  let kills = killCount;
  let killsThisPeriod = 0;
  let coins = 0;
  let ascensionPointsGained = 0;

  for (let i = 0; i < SAFETY_MAX_KILLS; i++) {
    const diff = getStageDifficultyMultiplier(progress, getCycleCount(stagesCleared));
    const isBoss = isBossSubStage(progress.subStage);
    const isFinal = isFinalBossStage(progress.stage, progress.subStage);
    const hp = isBoss || isFinal ? monsterHp('legendary', diff) : avgMonsterHp(diff);
    const fightMs = Math.max(MIN_FIGHT_DURATION_MS, Math.round(hp / heroAttackPowerValue / speedMultiplier));
    if (fightMs > remainingMs) break;

    remainingMs -= fightMs;
    kills += 1;
    killsThisPeriod += 1;
    coins += Math.round(isBoss || isFinal ? coinsForRarity('legendary') * coinMultiplier * diff : avgCoinsPerKill(diff, coinMultiplier));
    if (isBoss) stagesCleared += 1;
    if (isFinal) ascensionPointsGained += ascensionPointsPerCycle;
    progress = advanceStageProgress(progress);
  }

  // 三種材料掉落用「這段期間擊殺數 × 掉落機率」算期望值,不逐次擲亂數(理由見檔案開頭說明)。
  const enhanceStonesGained = Math.round(killsThisPeriod * ENHANCE_STONE_DROP_CHANCE);
  const skillBooksGained = Math.round(killsThisPeriod * SKILL_BOOK_DROP_CHANCE);
  const gemsGained: Partial<Record<GemType, number>> = {};
  const perGemTypeGained = Math.round((killsThisPeriod * GEM_DROP_CHANCE) / GEM_TYPES.length);
  if (perGemTypeGained > 0) {
    for (const gemType of GEM_TYPES) gemsGained[gemType] = perGemTypeGained;
  }

  return {
    stageProgress: progress,
    totalStagesCleared: stagesCleared,
    killCount: kills,
    kills: killsThisPeriod,
    coins,
    ascensionPointsGained,
    enhanceStonesGained,
    skillBooksGained,
    gemsGained,
  };
}
