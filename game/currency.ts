import { Rarity } from './trigger';

// 觸發事件掉落的貨幣量,稀有度越高掉越多。
export const RARITY_COIN_DROP: Record<Rarity, number> = {
  common: 1,
  rare: 3,
  epic: 8,
  legendary: 20,
};

export function coinsForRarity(rarity: Rarity): number {
  return RARITY_COIN_DROP[rarity];
}
