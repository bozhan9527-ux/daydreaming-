// 限時活動系統:手遊玩家角度檢討提出的缺口——目前只有隨機觸發的小彩蛋,沒有「這幾天限定」
// 的活動製造回訪高峰。用「星期幾」當固定排程表(不用隨機、不用存檔),跟 game/weeklyChallenge.ts
// 的輪替公式同一種「不接後端也能做限時內容」的精神:活動本身是純函式算出來的,今天有沒有活動、
// 是哪個活動,兩台裝置、任何時候算出來的答案都一樣,不需要伺服器同步、也不用存檔記錄「目前活動」
// (不會有「玩家在活動快結束時登入,活動卻已經消失」的競態問題——activity 本身就是 now 的函式)。
// 重用既有的加成倍率架構(見 hooks/useGameState.ts 的 computeRewardMultipliers):活動只是把
// exp/coins/speed 其中一項乘數再往上疊一點,不是新的玩法。

export type LimitedEventStat = 'exp' | 'coins' | 'speed';

export interface LimitedEventDef {
  id: string;
  label: string;
  stat: LimitedEventStat;
  bonus: number; // 小數,例如 0.3 = +30%
}

// key 是 UTC 星期幾(0=週日...6=週六,對應 Date.getUTCDay()),跟 game/daily.ts 的
// todayDateString 一樣用 UTC 基準,不處理時區/夏令時複雜度。value 是 null 代表當天沒有活動。
const WEEKLY_SCHEDULE: Record<number, LimitedEventDef | null> = {
  0: { id: 'weekend_hunt', label: '週末狩獵祭', stat: 'coins', bonus: 0.3 },
  1: null,
  2: null,
  3: { id: 'midweek_training', label: '週三特訓日', stat: 'exp', bonus: 0.3 },
  4: null,
  5: null,
  6: { id: 'weekend_hunt', label: '週末狩獵祭', stat: 'coins', bonus: 0.3 },
};

export function getActiveLimitedEvent(now: number = Date.now()): LimitedEventDef | null {
  const day = new Date(now).getUTCDay();
  return WEEKLY_SCHEDULE[day] ?? null;
}

// 活動固定在當天(UTC)結束,回傳結束時間戳給倒數用——跟 todayDateString 用同一個「一天」的
// 定義,活動不會跨到隔天還顯示著。
export function getLimitedEventEndsAt(now: number = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0);
}
