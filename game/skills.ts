import { expToNext, MAX_LEVEL } from './leveling';

export type SkillId = 'practice' | 'diligence' | 'mastery' | 'foresight' | 'focus';

export const SKILL_IDS: SkillId[] = ['practice', 'diligence', 'mastery', 'foresight', 'focus'];

export type SkillLevels = Record<SkillId, number>;

export function createInitialSkillLevels(): SkillLevels {
  return { practice: 1, diligence: 1, mastery: 1, foresight: 1, focus: 1 };
}

// 技能升級花費 = 對應等級 exp_to_next 的 1/5,跟勇者練等共用同一包經驗池
// (5 個技能同步練滿,總花費會剛好等於練等本身,詳見 game/leveling.ts 的分段曲線設計註解)。
export function skillUpgradeCost(skillLevel: number): number {
  return Math.floor(expToNext(skillLevel) / 5);
}

// 額外疊加的貨幣花費,跟經驗花費是兩包獨立資源,兩者都要夠才能升級。
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

// 每個技能滿級(Lv500)時的加成上限,5 個都是被動經驗加成,線性隨技能等級成長。
const SKILL_MAX_BONUS: Record<SkillId, number> = {
  practice: 0.2,
  diligence: 0.2,
  mastery: 0.2,
  foresight: 0.2,
  focus: 0.2,
};

export function skillBonus(skillId: SkillId, skillLevel: number): number {
  return SKILL_MAX_BONUS[skillId] * (skillLevel / MAX_LEVEL);
}

// 5 技能加成總和,套在離線經驗結算的最後一層(跟 job 戰鬥倍率一樣是疊加乘數,不動 exp_to_next 本身)。
export function totalSkillBonus(levels: SkillLevels): number {
  return SKILL_IDS.reduce((sum, id) => sum + skillBonus(id, levels[id]), 0);
}
