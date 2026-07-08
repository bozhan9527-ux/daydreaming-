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

export function pickMonster(rarity: Rarity, rng: () => number = Math.random): MonsterSpec {
  const pool = getMonstersByRarity(rarity);
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}
