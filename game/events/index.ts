import { Archetype, JobBranch, JobTier } from '../combat';
import { STUDENT_TIER2_LEVEL } from '../equipment';
import { Rarity } from '../trigger';
import { COMMON_EVENTS } from './common';
import { EPIC_EVENTS } from './epic';
import { MAGIC_MELEE_JOB_EGGS } from './jobEggs/magicMelee';
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

// 六大職業彩蛋(見 game/events/jobEggs/):畢業選定職業後才加進反應池,合起來放一份總表,
// 之後補齊其餘職業只要在這裡多加一個 import + 一筆。目前還沒補的職業直接是空陣列,
// getRandomEvent 篩選時自然找不到符合的項目,不影響既有反應池的抽選。
const ALL_JOB_EGGS = [...MAGIC_MELEE_JOB_EGGS];

// 學生彩蛋(見 game/events/jobEggs/student.ts):是曾經學生期的回憶,永久併入對應稀有度的
// 反應池,不是另開一組機率——跟基礎反應共用同一個 pool,一起等機率抽選,轉職/畢業後也不會被
// 移除。studentTier 對照 game/equipment.ts 的 STUDENT_TIER2_LEVEL(Lv10 起「風雲人物」),
// 玩家等級只會往上升,Lv10 前用tier1「新生」那組,Lv10 起改用tier2那組,兩組不會同時出現。
// 職業彩蛋(見 game/events/jobEggs/types.ts 的 JobGameEvent):畢業後(hasChosenJob)才會併入,
// 依目前主職的 archetype/branch/jobTier 篩出對應那 15 則,跟學生彩蛋一樣是永久回憶,
// 換分支/繼續升階後舊階級那組不會再抽到,但也不會消失,只是換一批當下適用的。
export interface EventPoolContext {
  level: number;
  hasChosenJob: boolean;
  archetype: Archetype;
  branch: JobBranch | null;
  jobTier: JobTier;
}

export function getRandomEvent(
  rarity: Rarity,
  context: EventPoolContext,
  rng: () => number = Math.random
): GameEvent {
  const studentTier = context.level >= STUDENT_TIER2_LEVEL ? 2 : 1;
  const studentEggs = STUDENT_JOB_EGGS.filter((event) => event.rarity === rarity && event.studentTier === studentTier);
  const jobEggs = context.hasChosenJob
    ? ALL_JOB_EGGS.filter(
        (event) =>
          event.rarity === rarity &&
          event.archetype === context.archetype &&
          event.tier === context.jobTier &&
          (event.branch === null || event.branch === context.branch)
      )
    : [];
  const pool: GameEvent[] = [...EVENTS_BY_RARITY[rarity], ...studentEggs, ...jobEggs];
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}

export type { EventType, GameEvent } from './types';
