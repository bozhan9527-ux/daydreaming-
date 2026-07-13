import { GemType } from './equipment';

// 週期成就輪替(P3):每日任務(見 game/daily.ts)解決「每天登入都有事做」,這裡解決「破完
// 102 個永久成就+每天固定的每日任務池之後,還有沒有新鮮感」——尤其輪迴系統(見 game/ascension.ts)
// 上線後,高等級玩家進入的是「破完一輪又一輪」的長期循環,更需要一個會持續變化的短期目標層。
// 用「週」為週期,固定3條、從9個範本輪替,3週一個完整循環——刻意重用每日任務池已經在追蹤的
// 5種活動類型(擊殺/鑑定/副本/強化/寵物坐騎裝備),不新增使用者要學習的新玩法,只是把既有活動
// 的「單週累積量」門檻拉高、獎勵拉大,呼應 daily.ts 開頭「避免又疊一套跟現有系統打架的新機制」
// 的既有設計原則。輪替用固定公式(週序號 % 3)決定本週生效哪一組,不用隨機,玩家可以預期
// 「下星期會換哪三條」,也方便測試。

export type WeeklyStatKey = 'kills' | 'identify' | 'dungeon' | 'enhance' | 'companionGear';

export interface WeeklyChallengeDef {
  id: string;
  statKey: WeeklyStatKey;
  label: string;
  target: number;
  reward: { coins: number; enhanceStones?: number; gems?: Partial<Record<GemType, number>> };
}

// 3 組 x 3 條 = 9 個範本,每組刻意混不同的活動類型,避免同一週 3 條都逼玩家做同一件事。
// 獎勵量級明顯高於每日任務(單週投入 > 單日投入),但不到成就系統里程碑等級,定位介於兩者之間。
const WEEKLY_CHALLENGE_POOL: WeeklyChallengeDef[][] = [
  [
    { id: 'week_kills_300', statKey: 'kills', label: '本週擊敗300隻怪物', target: 300, reward: { coins: 1000, enhanceStones: 2 } },
    { id: 'week_enhance_5', statKey: 'enhance', label: '本週強化5次裝備', target: 5, reward: { coins: 800, enhanceStones: 3 } },
    { id: 'week_identify_3', statKey: 'identify', label: '本週鑑定3件裝備', target: 3, reward: { coins: 600 } },
  ],
  [
    { id: 'week_kills_500', statKey: 'kills', label: '本週擊敗500隻怪物', target: 500, reward: { coins: 1500, enhanceStones: 3 } },
    {
      id: 'week_dungeon_5',
      statKey: 'dungeon',
      label: '本週挑戰5次副本',
      target: 5,
      reward: { coins: 800, gems: { expGem: 1, coinGem: 1, speedGem: 1 } },
    },
    { id: 'week_companionGear_3', statKey: 'companionGear', label: '本週升級3次寵物坐騎裝備', target: 3, reward: { coins: 600 } },
  ],
  [
    { id: 'week_kills_800', statKey: 'kills', label: '本週擊敗800隻怪物', target: 800, reward: { coins: 2000, enhanceStones: 4 } },
    { id: 'week_enhance_10', statKey: 'enhance', label: '本週強化10次裝備', target: 10, reward: { coins: 1200, enhanceStones: 5 } },
    {
      id: 'week_dungeon_8',
      statKey: 'dungeon',
      label: '本週挑戰8次副本',
      target: 8,
      reward: { coins: 1200, gems: { expGem: 2, coinGem: 2, speedGem: 2 } },
    },
  ],
];

export const WEEKLY_CHALLENGE_IDS: string[] = WEEKLY_CHALLENGE_POOL.flat().map((def) => def.id);

// 用「距 epoch 幾個 7 天」當週序號,不用 ISO 8601 週曆——跟 game/daily.ts 的 todayDateString
// 同一種「不處理時區/跨年複雜度」的簡化取捨,對放置遊戲來說切齊 UTC 天數已經足夠。
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function weekIndex(now: number = Date.now()): number {
  return Math.floor(now / WEEK_MS);
}

export function isNewWeek(lastResetWeekIndex: number, now: number = Date.now()): boolean {
  return lastResetWeekIndex !== weekIndex(now);
}

export function getActiveWeeklyChallenges(index: number = weekIndex()): WeeklyChallengeDef[] {
  return WEEKLY_CHALLENGE_POOL[index % WEEKLY_CHALLENGE_POOL.length];
}

export function getWeeklyChallengeDef(id: string): WeeklyChallengeDef {
  for (const group of WEEKLY_CHALLENGE_POOL) {
    const found = group.find((def) => def.id === id);
    if (found) return found;
  }
  throw new Error(`No weekly challenge defined for id: ${id}`);
}

export function canClaimWeeklyChallenge(
  id: string,
  progress: Partial<Record<WeeklyStatKey, number>>,
  claimedIds: string[]
): boolean {
  if (claimedIds.includes(id)) return false;
  const def = getWeeklyChallengeDef(id);
  return (progress[def.statKey] ?? 0) >= def.target;
}
