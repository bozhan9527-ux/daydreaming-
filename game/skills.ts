import { Archetype, getArchetypeComposition, Subtype } from './combat';
import { expToNext, MAX_LEVEL } from './leveling';

// 技能組從「5 個通用被動加成」改成「6 大職業各一個主動戰鬥技能」,
// 只有目前選擇的職業的技能會在戰鬥中觸發,但 6 個都各自累積等級、切職業不會歸零。
export const SKILL_IDS: Archetype[] = [
  'physicalMelee',
  'physicalRanged',
  'physicalSupport',
  'magicMelee',
  'magicRanged',
  'magicSupport',
];

export type SkillLevels = Record<Archetype, number>;

export function createInitialSkillLevels(): SkillLevels {
  return {
    physicalMelee: 1,
    physicalRanged: 1,
    physicalSupport: 1,
    magicMelee: 1,
    magicRanged: 1,
    magicSupport: 1,
  };
}

// 升級花費機制不變:經驗花費是對應等級 exp_to_next 的 1/5,另外疊加貨幣花費,兩者都要夠。
export function skillUpgradeCost(skillLevel: number): number {
  return Math.floor(expToNext(skillLevel) / 5);
}

const SKILL_COIN_COST_PER_LEVEL = 2;

export function skillUpgradeCoinCost(skillLevel: number): number {
  return skillLevel * SKILL_COIN_COST_PER_LEVEL;
}

export function canUpgradeSkill(skillLevel: number, bankedExp: number, coins: number): boolean {
  return (
    skillLevel < MAX_LEVEL &&
    bankedExp >= skillUpgradeCost(skillLevel) &&
    coins >= skillUpgradeCoinCost(skillLevel)
  );
}

export function upgradeSkill(skillLevel: number): number {
  return Math.min(MAX_LEVEL, skillLevel + 1);
}

// 主動技能觸發間隔:每打倒幾隻怪觸發一次,等級越高間隔越短,封頂在 3 隻。
const BASE_TRIGGER_INTERVAL = 10;
const MIN_TRIGGER_INTERVAL = 3;
const LEVELS_PER_INTERVAL_STEP = 50;

export function skillTriggerInterval(skillLevel: number): number {
  const reduction = Math.floor(skillLevel / LEVELS_PER_INTERVAL_STEP);
  return Math.max(MIN_TRIGGER_INTERVAL, BASE_TRIGGER_INTERVAL - reduction);
}

// 副職的技能也會觸發,但間隔是本職的兩倍,呼應副職只拿「部分加成」的定位。
const SECONDARY_SKILL_INTERVAL_MULTIPLIER = 2;

export function secondarySkillTriggerInterval(skillLevel: number): number {
  return skillTriggerInterval(skillLevel) * SECONDARY_SKILL_INTERVAL_MULTIPLIER;
}

// 三種主動技能效果,依 subtype(近戰/遠程/輔助)決定,物理/魔法只是同一個效果換個特效顏色。
export type SkillEffectKind = 'instantFinish' | 'doubleReward' | 'bonusCoins';

const SUBTYPE_SKILL_EFFECT: Record<Subtype, SkillEffectKind> = {
  melee: 'instantFinish',
  ranged: 'doubleReward',
  support: 'bonusCoins',
};

export function getSkillEffectKind(archetype: Archetype): SkillEffectKind {
  return SUBTYPE_SKILL_EFFECT[getArchetypeComposition(archetype).subtype];
}

const BONUS_COINS_AMOUNT = 20;

export function getBonusCoinsAmount(): number {
  return BONUS_COINS_AMOUNT;
}
