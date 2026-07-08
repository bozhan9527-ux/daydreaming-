import { GameEvent } from './types';

export const EPIC_EVENTS: GameEvent[] = [
  { id: 'epic-01', rarity: 'epic', type: 'text', payload: '傳說中的隱藏迷宮打開了，裡面只有一張「打烊中」的告示牌。' },
  { id: 'epic-02', rarity: 'epic', type: 'text', payload: '召喚出了古代巨龍，牠說牠也是被抓來打工的。' },
  { id: 'epic-03', rarity: 'epic', type: 'text', payload: '天空裂開一道光，掉下來一份「勇者績效考核表」。' },
  { id: 'epic-04', rarity: 'epic', type: 'text', payload: '遇到創造這個世界的神，祂問我要不要幫忙寫 BUG 回報。' },
];
