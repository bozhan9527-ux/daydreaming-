import { DamageType, JobTier } from './combat';
import { Rarity } from './trigger';

export interface MonsterSpec {
  id: string;
  name: string;
  rarity: Rarity;
  damageType: DamageType;
}

// 4 個稀有度共 7 種怪物,稀有度沿用 game/trigger.ts 的 Rarity,不另外發明新分級。
// damageType 為固定主題標記(物理/魔法系怪物/防禦系統對照用),非亂數決定。
export const MONSTERS: MonsterSpec[] = [
  { id: 'slime', name: '史萊姆', rarity: 'common', damageType: 'magic' },
  { id: 'bat', name: '蝙蝠', rarity: 'common', damageType: 'physical' },
  { id: 'goblin', name: '哥布林', rarity: 'rare', damageType: 'physical' },
  { id: 'mushroom', name: '菇菇怪', rarity: 'rare', damageType: 'magic' },
  { id: 'skeleton', name: '骷髏戰士', rarity: 'epic', damageType: 'physical' },
  { id: 'golem', name: '石魔像', rarity: 'epic', damageType: 'magic' },
  { id: 'dragon', name: '幼龍', rarity: 'legendary', damageType: 'magic' },
];

export function getMonstersByRarity(rarity: Rarity): MonsterSpec[] {
  return MONSTERS.filter((monster) => monster.rarity === rarity);
}

// 關卡系統(game/stages.ts)第 10 小關強制生成的魔王,獨立於一般稀有度亂數池之外,
// rarity 標 legendary 只是借用它最高檔的戰鬥時長基準去換算獎勵,不代表跟一般傳說怪同一個抽獎池。
// 魔王造型依玩家當下的職業階級(JobTier,對照 game/combat.ts 的 getCurrentTier)分成5款,
// 呼應主畫面背景(game/sprites/backgrounds.ts)本來就依階級由樸素到華麗遞進的視覺基調——
// 不再是全部關卡共用同一隻「關卡魔王」。
export const STAGE_BOSS_MONSTERS: Record<JobTier, MonsterSpec> = {
  1: { id: 'stage_boss_tier1', name: '荒地首領', rarity: 'legendary', damageType: 'physical' },
  2: { id: 'stage_boss_tier2', name: '窖藏獸王', rarity: 'legendary', damageType: 'physical' },
  3: { id: 'stage_boss_tier3', name: '鏽甲督軍', rarity: 'legendary', damageType: 'physical' },
  4: { id: 'stage_boss_tier4', name: '幽夜魔君', rarity: 'legendary', damageType: 'magic' },
  5: { id: 'stage_boss_tier5', name: '巔峰宗師', rarity: 'legendary', damageType: 'physical' },
};
export const FINAL_BOSS_MONSTER: MonsterSpec = { id: 'final_boss', name: '大魔王', rarity: 'legendary', damageType: 'magic' };

export function getStageBossMonster(tier: JobTier): MonsterSpec {
  return STAGE_BOSS_MONSTERS[tier];
}

export function pickMonster(rarity: Rarity, rng: () => number = Math.random): MonsterSpec {
  const pool = getMonstersByRarity(rarity);
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}
