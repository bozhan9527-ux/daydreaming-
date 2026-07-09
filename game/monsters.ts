import { Rarity } from './trigger';

export interface MonsterSpec {
  id: string;
  name: string;
  rarity: Rarity;
}

// 4 個稀有度共 7 種怪物,稀有度沿用 game/trigger.ts 的 Rarity,不另外發明新分級。
export const MONSTERS: MonsterSpec[] = [
  { id: 'slime', name: '史萊姆', rarity: 'common' },
  { id: 'bat', name: '蝙蝠', rarity: 'common' },
  { id: 'goblin', name: '哥布林', rarity: 'rare' },
  { id: 'mushroom', name: '菇菇怪', rarity: 'rare' },
  { id: 'skeleton', name: '骷髏戰士', rarity: 'epic' },
  { id: 'golem', name: '石魔像', rarity: 'epic' },
  { id: 'dragon', name: '幼龍', rarity: 'legendary' },
];

export function getMonstersByRarity(rarity: Rarity): MonsterSpec[] {
  return MONSTERS.filter((monster) => monster.rarity === rarity);
}

// 關卡系統(game/stages.ts)第 10 小關強制生成的魔王/大魔王,獨立於一般稀有度亂數池之外,
// rarity 標 legendary 只是借用它最高檔的戰鬥時長基準去換算獎勵,不代表跟一般傳說怪同一個抽獎池。
export const BOSS_MONSTER: MonsterSpec = { id: 'stage_boss', name: '關卡魔王', rarity: 'legendary' };
export const FINAL_BOSS_MONSTER: MonsterSpec = { id: 'final_boss', name: '大魔王', rarity: 'legendary' };

export function pickMonster(rarity: Rarity, rng: () => number = Math.random): MonsterSpec {
  const pool = getMonstersByRarity(rarity);
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}
