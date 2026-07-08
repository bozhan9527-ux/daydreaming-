export const MAX_LEVEL = 500;
export const EXP_BANK_CAP_MULTIPLIER = 30;

const BASE_EXP_PER_MIN = 10;
const EXP_PER_MIN_LEVEL_FACTOR = 0.05;

// exp_to_next 分兩段:Lv1~99 用較陡的曲線衝前期爽感(~3 週到 Lv100),
// Lv100 起換成溫和許多的曲線,在交界處(Lv99/Lv100)平滑銜接、不斷檔。
// 全程節奏皆遠低於「20 等/週」上限,Lv500 封頂約需 1.6 年。
const BASE_EXP_TO_NEXT = 100;
const TIER1_GROWTH = 1.0728445077758875;
const TIER2_GROWTH = 1.005;
const TIER2_START_LEVEL = 100;

export interface LevelState {
  level: number;
  bankedExp: number;
}

export function createInitialLevelState(): LevelState {
  return { level: 1, bankedExp: 0 };
}

export function expPerMin(level: number): number {
  return BASE_EXP_PER_MIN * (1 + level * EXP_PER_MIN_LEVEL_FACTOR);
}

function tier1ExpToNext(level: number): number {
  return Math.floor(BASE_EXP_TO_NEXT * Math.pow(TIER1_GROWTH, level));
}

const TIER2_BASE = tier1ExpToNext(TIER2_START_LEVEL - 1);

export function expToNext(level: number): number {
  if (level < TIER2_START_LEVEL) return tier1ExpToNext(level);
  return Math.floor(TIER2_BASE * Math.pow(TIER2_GROWTH, level - (TIER2_START_LEVEL - 1)));
}

export function expBankCap(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return expToNext(level) * EXP_BANK_CAP_MULTIPLIER;
}

export function calcOfflineExp(level: number, elapsedMs: number): number {
  const cappedMs = Math.min(elapsedMs, 24 * 60 * 60 * 1000);
  const minutes = cappedMs / 60000;
  return Math.floor(expPerMin(level) * minutes);
}

export function accumulateExp(state: LevelState, gainedExp: number): LevelState {
  if (state.level >= MAX_LEVEL || gainedExp <= 0) return state;
  const cap = expBankCap(state.level);
  const bankedExp = Math.min(state.bankedExp + gainedExp, cap);
  return { ...state, bankedExp };
}

export function canLevelUp(state: LevelState): boolean {
  return state.level < MAX_LEVEL && state.bankedExp >= expToNext(state.level);
}

export function levelUp(state: LevelState, times: 1 | 5 | 10): { state: LevelState; levelsGained: number } {
  let level = state.level;
  let bankedExp = state.bankedExp;
  let levelsGained = 0;

  while (levelsGained < times && level < MAX_LEVEL) {
    const cost = expToNext(level);
    if (bankedExp < cost) break;
    bankedExp -= cost;
    level += 1;
    levelsGained += 1;
  }

  return { state: { level, bankedExp }, levelsGained };
}
