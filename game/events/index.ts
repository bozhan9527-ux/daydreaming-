import { STUDENT_TIER2_LEVEL } from '../equipment';
import { Rarity } from '../trigger';
import { COMMON_EVENTS } from './common';
import { EPIC_EVENTS } from './epic';
import { STUDENT_JOB_EGGS } from './jobEggs/student';
import { LEGENDARY_EVENTS } from './legendary';
import { RARE_EVENTS } from './rare';
import { GameEvent } from './types';

const EVENTS_BY_RARITY: Record<Rarity, GameEvent[]> = {
  common: COMMON_EVENTS,
  rare: RARE_EVENTS,
  epic: EPIC_EVENTS,
  legendary: LEGENDARY_EVENTS,
};

// 學生彩蛋(見 game/events/jobEggs/student.ts):是曾經學生期的回憶,永久併入對應稀有度的
// 反應池,不是另開一組機率——跟基礎反應共用同一個 pool,一起等機率抽選,轉職/畢業後也不會被
// 移除。studentTier 對照 game/equipment.ts 的 STUDENT_TIER2_LEVEL(Lv10 起「風雲人物」),
// 玩家等級只會往上升,Lv10 前用tier1「新生」那組,Lv10 起改用tier2那組,兩組不會同時出現。
export interface EventPoolContext {
  level: number;
}

export function getRandomEvent(
  rarity: Rarity,
  context: EventPoolContext,
  rng: () => number = Math.random
): GameEvent {
  const studentTier = context.level >= STUDENT_TIER2_LEVEL ? 2 : 1;
  const studentEggs = STUDENT_JOB_EGGS.filter((event) => event.rarity === rarity && event.studentTier === studentTier);
  const pool: GameEvent[] = studentEggs.length > 0 ? [...EVENTS_BY_RARITY[rarity], ...studentEggs] : EVENTS_BY_RARITY[rarity];
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}

export type { EventType, GameEvent } from './types';
