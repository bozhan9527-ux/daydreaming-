export const MAX_LEVEL = 500;
export const EXP_BANK_CAP_MULTIPLIER = 30;

const BASE_EXP_PER_MIN = 10;
const EXP_PER_MIN_LEVEL_FACTOR = 0.05;
const BASE_EXP_TO_NEXT = 100;
const EXP_TO_NEXT_GROWTH = 1.15;

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

export function expToNext(level: number): number {
  return Math.floor(BASE_EXP_TO_NEXT * Math.pow(EXP_TO_NEXT_GROWTH, level));
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
