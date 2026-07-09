// 每日內容層:刻意做得很輕量(1個登入獎勵+1個擊殺任務),避免又疊一套跟現有系統打架的新機制——
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

// 每日任務:今日擊敗 N 隻怪,達標可以領一次獎勵,隔天重置。
export const DAILY_QUEST_KILL_TARGET = 50;
export const DAILY_QUEST_COIN_REWARD = 300;
export const DAILY_QUEST_ENHANCE_STONE_REWARD = 2;

export function canClaimDailyQuest(dailyKillCount: number, dailyQuestClaimed: boolean): boolean {
  return !dailyQuestClaimed && dailyKillCount >= DAILY_QUEST_KILL_TARGET;
}
