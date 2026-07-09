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

// 六個職業技能的顯示名稱,單一真相來源,技能面板跟戰鬥畫面的技能追蹤條共用同一份。
export const SKILL_LABELS: Record<Archetype, string> = {
  physicalMelee: '爆擊一擊',
  physicalRanged: '連續多重射擊',
  physicalSupport: '治療光環',
  magicMelee: '能量爆發斬',
  magicRanged: '法術齊射',
  magicSupport: '增幅祝福',
};

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

// 主動技能觸發間隔:改成真正的秒數倒數(不再靠擊殺次數累計),等級越高秒數越短,
// 封頂在 9 秒。每 50 等縮短 3 秒,跟舊版「每 50 等縮短 1 隻怪、約 3 秒一隻怪」換算後同一條曲線,
// 玩家練等節奏不變,只是觸發判定改成看真實經過時間。
const BASE_TRIGGER_INTERVAL_SECONDS = 30;
const MIN_TRIGGER_INTERVAL_SECONDS = 9;
const INTERVAL_STEP_SECONDS = 3;
const LEVELS_PER_INTERVAL_STEP = 50;

export function skillTriggerIntervalSeconds(skillLevel: number): number {
  const reduction = Math.floor(skillLevel / LEVELS_PER_INTERVAL_STEP) * INTERVAL_STEP_SECONDS;
  return Math.max(MIN_TRIGGER_INTERVAL_SECONDS, BASE_TRIGGER_INTERVAL_SECONDS - reduction);
}

// 副職的技能也會觸發,但間隔是本職的兩倍,呼應副職只拿「部分加成」的定位。
const SECONDARY_SKILL_INTERVAL_MULTIPLIER = 2;

export function secondarySkillTriggerIntervalSeconds(skillLevel: number): number {
  return skillTriggerIntervalSeconds(skillLevel) * SECONDARY_SKILL_INTERVAL_MULTIPLIER;
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

// 職業樹點入單一技能時顯示的風味描述,單一真相來源。
export const SKILL_DESCRIPTIONS: Record<Archetype, string> = {
  physicalMelee: '一拳打爆眼前的敵人,直接讓下一場戰鬥瞬間結束。',
  physicalRanged: '連續多重射擊招呼過去,這次擊殺的經驗與金幣獎勵直接翻倍。',
  physicalSupport: '一圈治療光環罩住全場,額外進帳一筆金幣。',
  magicMelee: '灌注能量的爆發斬,直接讓下一場戰鬥瞬間結束。',
  magicRanged: '法術齊射覆蓋戰場,這次擊殺的經驗與金幣獎勵直接翻倍。',
  magicSupport: '增幅祝福籠罩全隊,額外進帳一筆金幣。',
};

// 依目前技能等級,把「每N秒觸發一次+實際效果」組成一句人看得懂的加成說明,
// 對應 hooks/useGameState.ts tickBattle() 裡技能觸發時實際套用的效果,不是另一套規則。
export function getSkillEffectDescription(archetype: Archetype, skillLevel: number): string {
  const kind = getSkillEffectKind(archetype);
  const seconds = skillTriggerIntervalSeconds(skillLevel);
  if (kind === 'instantFinish') return `每 ${seconds} 秒觸發一次,下一場戰鬥直接瞬間結束`;
  if (kind === 'doubleReward') return `每 ${seconds} 秒觸發一次,這次擊殺的經驗與金幣翻倍`;
  return `每 ${seconds} 秒觸發一次,額外獲得 ${getBonusCoinsAmount()} 金幣`;
}
