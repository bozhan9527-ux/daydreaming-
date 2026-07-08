export const MAX_LEVEL = 500;
export const EXP_BANK_CAP_MULTIPLIER = 30;

const BASE_EXP_PER_MIN = 10;
const EXP_PER_MIN_LEVEL_FACTOR = 0.05;

// exp_to_next 分 5 段,成長率依序遞減,轉折平滑不斷檔:
// Lv1-119(陡,衝前期爽感,~3.5 週到 Lv120) / Lv120-249 / Lv250-359 / Lv360-449 / Lv450-499(最平緩)。
// 全程節奏皆遠低於「20 等/週」上限,Lv500 封頂約需 1.8 年。
const BASE_EXP_TO_NEXT = 100;

const EXP_TIERS: { startLevel: number; growth: number }[] = [
  { startLevel: 1, growth: 1.0615672364184165 },
  { startLevel: 120, growth: 1.006 },
  { startLevel: 250, growth: 1.0055 },
  { startLevel: 360, growth: 1.005 },
  { startLevel: 450, growth: 1.0045 },
];

interface ResolvedExpTier {
  startLevel: number;
  growth: number;
  referenceLevel: number;
  baseCost: number;
}

const RESOLVED_EXP_TIERS: ResolvedExpTier[] = EXP_TIERS.reduce<ResolvedExpTier[]>((resolved, tier, i) => {
  if (i === 0) {
    resolved.push({ ...tier, referenceLevel: 0, baseCost: BASE_EXP_TO_NEXT });
    return resolved;
  }
  const prev = resolved[i - 1];
  const referenceLevel = tier.startLevel - 1;
  const baseCost = Math.floor(prev.baseCost * Math.pow(prev.growth, referenceLevel - prev.referenceLevel));
  resolved.push({ ...tier, referenceLevel, baseCost });
  return resolved;
}, []);

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
  let tier = RESOLVED_EXP_TIERS[0];
  for (const t of RESOLVED_EXP_TIERS) {
    if (level >= t.startLevel) tier = t;
  }
  return Math.floor(tier.baseCost * Math.pow(tier.growth, level - tier.referenceLevel));
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
