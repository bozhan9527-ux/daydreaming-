// 每日內容層:刻意做得很輕量(1個登入獎勵+5個小任務),避免又疊一套跟現有系統打架的新機制——
// 呼應「系統太多容易失焦」的檢討,每日內容只是既有數值的小額補充,不是另一條主線。

// 用 UTC 日期字串當「今天」的判斷基準,不用處理時區/夏令時的複雜度,對放置遊戲來說足夠。
export function todayDateString(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function isNewDay(lastResetAt: string, now: number = Date.now()): boolean {
  return lastResetAt !== todayDateString(now);
}

// 登入獎勵:固定小額,不隨等級縮放,單純「歡迎回來」的心意,不會變成新的主要收入來源。
export const DAILY_LOGIN_COIN_BONUS = 100;
export const DAILY_LOGIN_EXP_BONUS = 50;

// 每日任務(擊殺任務):今日擊敗 N 隻怪,達標可以領一次獎勵,隔天重置。這是任務池裡
// 唯一沿用舊欄位(dailyKillCount/dailyQuestClaimed)的一項,其餘 4 項見下面的 DAILY_TASKS。
export const DAILY_QUEST_KILL_TARGET = 50;
export const DAILY_QUEST_COIN_REWARD = 300;
export const DAILY_QUEST_ENHANCE_STONE_REWARD = 2;
export const DAILY_QUEST_SKILL_BOOK_REWARD = 3;

export function canClaimDailyQuest(dailyKillCount: number, dailyQuestClaimed: boolean): boolean {
  return !dailyQuestClaimed && dailyKillCount >= DAILY_QUEST_KILL_TARGET;
}

// 任務池的另外 4 項輕量任務:各自「做一次」就達標,把玩家順便導去摸鑑定/副本/強化/寵物坐騎
// 裝備這幾個既有系統,而不是純掛機湊擊殺數。跟擊殺任務各自獨立判定/領取,不互相影響。
export type DailyTaskId = 'identify' | 'dungeon' | 'enhance' | 'companionGear';

export interface DailyTaskDef {
  id: DailyTaskId;
  label: string;
  target: number;
  reward: { coins: number; enhanceStones?: number; skillBooks?: number };
}

export const DAILY_TASKS: DailyTaskDef[] = [
  { id: 'identify', label: '鑑定1件裝備的隱藏素質', target: 1, reward: { coins: 100, enhanceStones: 1 } },
  { id: 'dungeon', label: '挑戰1次轉職試煉副本', target: 1, reward: { coins: 100, skillBooks: 1 } },
  { id: 'enhance', label: '強化1次裝備', target: 1, reward: { coins: 100, enhanceStones: 1 } },
  { id: 'companionGear', label: '升級1次寵物坐騎裝備', target: 1, reward: { coins: 100 } },
];

export function getDailyTaskDef(id: DailyTaskId): DailyTaskDef {
  const def = DAILY_TASKS.find((task) => task.id === id);
  if (!def) throw new Error(`No daily task defined for id: ${id}`);
  return def;
}

export function canClaimDailyTask(
  id: DailyTaskId,
  progress: Partial<Record<DailyTaskId, number>>,
  claimedIds: DailyTaskId[]
): boolean {
  if (claimedIds.includes(id)) return false;
  return (progress[id] ?? 0) >= getDailyTaskDef(id).target;
}
