export type Archetype =
  | 'physicalMelee'
  | 'physicalRanged'
  | 'physicalSupport'
  | 'magicMelee'
  | 'magicRanged'
  | 'magicSupport';

export type JobTier = 1 | 2 | 3 | 4 | 5;

type Subtype = 'melee' | 'ranged' | 'support';
type DamageType = 'physical' | 'magic';

const ARCHETYPE_COMPOSITION: Record<Archetype, { subtype: Subtype; damageType: DamageType }> = {
  physicalMelee: { subtype: 'melee', damageType: 'physical' },
  physicalRanged: { subtype: 'ranged', damageType: 'physical' },
  physicalSupport: { subtype: 'support', damageType: 'physical' },
  magicMelee: { subtype: 'melee', damageType: 'magic' },
  magicRanged: { subtype: 'ranged', damageType: 'magic' },
  magicSupport: { subtype: 'support', damageType: 'magic' },
};

// 5 階轉職的基準倍率,解鎖等級對齊 game/leveling.ts 的分段點(Lv1/120/250/360/450)。
// 6 條路線在滿階(5 階)時完全一致,路線差異只影響 1~4 階的節奏。
const BASE_MULTIPLIER: Record<JobTier, number> = { 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.35, 5: 1.5 };

// 近戰前段衝快、遠程平均分散、輔助前段弱後段補回來;5 階時三者加成都收斂回 0。
const SUBTYPE_BONUS: Record<Subtype, Record<JobTier, number>> = {
  melee: { 1: 0.05, 2: 0.03, 3: 0, 4: 0, 5: 0 },
  ranged: { 1: 0.02, 2: 0.02, 3: 0.02, 4: 0, 5: 0 },
  support: { 1: -0.05, 2: -0.03, 3: 0.02, 4: 0.03, 5: 0 },
};

// 物理前段穩定、魔法前段偏弱但後段反超;5 階時兩者加成也收斂回 0。
const DAMAGE_TYPE_BONUS: Record<DamageType, Record<JobTier, number>> = {
  physical: { 1: 0.02, 2: 0.01, 3: 0, 4: 0, 5: 0 },
  magic: { 1: -0.02, 2: -0.01, 3: 0.01, 4: 0.02, 5: 0 },
};

export const TIER_UNLOCK_LEVELS: Record<JobTier, number> = { 1: 1, 2: 120, 3: 250, 4: 360, 5: 450 };

export function calcCombatMultiplier(archetype: Archetype, tier: JobTier): number {
  const { subtype, damageType } = ARCHETYPE_COMPOSITION[archetype];
  return BASE_MULTIPLIER[tier] + SUBTYPE_BONUS[subtype][tier] + DAMAGE_TYPE_BONUS[damageType][tier];
}

export function canPromoteToTier(tier: JobTier, level: number): boolean {
  return level >= TIER_UNLOCK_LEVELS[tier];
}
