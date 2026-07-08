import { Rarity } from './trigger';

export type CompanionKind = 'pet' | 'mount';
export type CompanionBonusStat = 'exp' | 'coins' | 'speed';

export interface CompanionBonus {
  stat: CompanionBonusStat;
  value: number;
}

export interface CompanionSpec {
  id: string;
  kind: CompanionKind;
  name: string;
  rarity: Rarity;
  bonus: CompanionBonus;
  price: number;
}

// 寵物給經驗/金幣加成,坐騎給戰鬥速度加成,各 4 個稀有度各一隻,數值/售價隨稀有度遞增。
export const COMPANIONS: CompanionSpec[] = [
  { id: 'pet-common-cat', kind: 'pet', name: '小貓', rarity: 'common', bonus: { stat: 'exp', value: 0.03 }, price: 30 },
  { id: 'pet-rare-fox', kind: 'pet', name: '狐狸', rarity: 'rare', bonus: { stat: 'coins', value: 0.06 }, price: 90 },
  { id: 'pet-epic-owl', kind: 'pet', name: '貓頭鷹', rarity: 'epic', bonus: { stat: 'exp', value: 0.1 }, price: 200 },
  {
    id: 'pet-legendary-phoenix',
    kind: 'pet',
    name: '幼鳳凰',
    rarity: 'legendary',
    bonus: { stat: 'coins', value: 0.2 },
    price: 500,
  },
  {
    id: 'mount-common-pony',
    kind: 'mount',
    name: '小馬',
    rarity: 'common',
    bonus: { stat: 'speed', value: 0.03 },
    price: 30,
  },
  {
    id: 'mount-rare-boar',
    kind: 'mount',
    name: '野豬',
    rarity: 'rare',
    bonus: { stat: 'speed', value: 0.06 },
    price: 90,
  },
  {
    id: 'mount-epic-wolf',
    kind: 'mount',
    name: '座狼',
    rarity: 'epic',
    bonus: { stat: 'speed', value: 0.1 },
    price: 200,
  },
  {
    id: 'mount-legendary-griffin',
    kind: 'mount',
    name: '幼獅鷲',
    rarity: 'legendary',
    bonus: { stat: 'speed', value: 0.2 },
    price: 500,
  },
];

export function getCompanionById(id: string): CompanionSpec | undefined {
  return COMPANIONS.find((c) => c.id === id);
}

export function getCompanionsByKind(kind: CompanionKind): CompanionSpec[] {
  return COMPANIONS.filter((c) => c.kind === kind);
}

// 掉落用的獨立稀有度權重,刻意不共用 game/trigger.ts 的保底計數器——
// 保底是給主要稀有事件用的,審物/坐騎掉落只是額外小獎勵,不應該互相干擾。
const DROP_RARITY_WEIGHTS: { rarity: Rarity; probability: number }[] = [
  { rarity: 'common', probability: 0.7 },
  { rarity: 'rare', probability: 0.22 },
  { rarity: 'epic', probability: 0.07 },
  { rarity: 'legendary', probability: 0.01 },
];

function pickDropRarity(rng: () => number): Rarity {
  const roll = rng();
  let cumulative = 0;
  for (const entry of DROP_RARITY_WEIGHTS) {
    cumulative += entry.probability;
    if (roll < cumulative) return entry.rarity;
  }
  return DROP_RARITY_WEIGHTS[DROP_RARITY_WEIGHTS.length - 1].rarity;
}

const COMPANION_DROP_CHANCE = 0.03;

// 每次擊殺後呼叫一次;多數時候回傳 null(沒掉落)。
export function rollCompanionDrop(rng: () => number = Math.random): CompanionSpec | null {
  if (rng() >= COMPANION_DROP_CHANCE) return null;
  const kind: CompanionKind = rng() < 0.5 ? 'pet' : 'mount';
  const rarity = pickDropRarity(rng);
  const pool = COMPANIONS.filter((c) => c.kind === kind && c.rarity === rarity);
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)];
}

export interface CompanionState {
  unlockedIds: string[];
  equippedPetId: string | null;
  equippedMountId: string | null;
}

export function createEmptyCompanionState(): CompanionState {
  return { unlockedIds: [], equippedPetId: null, equippedMountId: null };
}

export function isCompanionUnlocked(state: CompanionState, id: string): boolean {
  return state.unlockedIds.includes(id);
}

export function unlockCompanion(state: CompanionState, id: string): CompanionState {
  if (state.unlockedIds.includes(id)) return state;
  return { ...state, unlockedIds: [...state.unlockedIds, id] };
}

export function equipCompanion(state: CompanionState, id: string): CompanionState {
  const companion = getCompanionById(id);
  if (!companion) return state;
  if (companion.kind === 'pet') return { ...state, equippedPetId: id };
  return { ...state, equippedMountId: id };
}

export function unequipCompanion(state: CompanionState, kind: CompanionKind): CompanionState {
  if (kind === 'pet') return { ...state, equippedPetId: null };
  return { ...state, equippedMountId: null };
}

export interface CompanionBonusTotals {
  exp: number;
  coins: number;
  speed: number;
}

export function getCompanionBonusTotals(state: CompanionState): CompanionBonusTotals {
  const totals: CompanionBonusTotals = { exp: 0, coins: 0, speed: 0 };
  for (const id of [state.equippedPetId, state.equippedMountId]) {
    if (!id) continue;
    const companion = getCompanionById(id);
    if (!companion) continue;
    totals[companion.bonus.stat] += companion.bonus.value;
  }
  return totals;
}
