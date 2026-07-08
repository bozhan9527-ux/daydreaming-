export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface RarityWeight {
  rarity: Rarity;
  probability: number;
}

const RARITY_TABLE: RarityWeight[] = [
  { rarity: 'common', probability: 0.7 },
  { rarity: 'rare', probability: 0.22 },
  { rarity: 'epic', probability: 0.07 },
  { rarity: 'legendary', probability: 0.01 },
];

const RARE_OR_ABOVE_TABLE: RarityWeight[] = RARITY_TABLE.filter((entry) => entry.rarity !== 'common');

export const PITY_THRESHOLD = 30;

export interface TriggerState {
  pityCounter: number;
}

export function createInitialTriggerState(): TriggerState {
  return { pityCounter: 0 };
}

export function isRareOrAbove(rarity: Rarity): boolean {
  return rarity !== 'common';
}

function pickFromTable(table: RarityWeight[], roll: number): Rarity {
  const totalWeight = table.reduce((sum, entry) => sum + entry.probability, 0);
  let cumulative = 0;
  for (const entry of table) {
    cumulative += entry.probability / totalWeight;
    if (roll < cumulative) return entry.rarity;
  }
  return table[table.length - 1].rarity;
}

export interface TriggerRoll {
  rarity: Rarity;
  state: TriggerState;
  pityTriggered: boolean;
}

export function rollTrigger(state: TriggerState, rng: () => number = Math.random): TriggerRoll {
  const pityTriggered = state.pityCounter >= PITY_THRESHOLD;
  const table = pityTriggered ? RARE_OR_ABOVE_TABLE : RARITY_TABLE;
  const rarity = pickFromTable(table, rng());

  const pityCounter = isRareOrAbove(rarity) ? 0 : state.pityCounter + 1;

  return { rarity, state: { pityCounter }, pityTriggered };
}
