import { Archetype, DamageType, JobTier } from './combat';
import { isNewDay, todayDateString } from './daily';
import { GEM_SPECS, GEM_TYPES, GemType } from './equipment';
import { expPerMin } from './leveling';
import { MATERIAL_TIERS, MaterialTier } from './materials';

// 轉職試煉副本系統:6 個職業各自獨立的副本,打贏保證掉落該職業的轉職碎片(見 game/transfer.ts),
// 把過去唯一取得碎片的方式(打大魔王 3% 隨機機率、不分職業亂抽)補上一條主動、有目標的路線。
// 挑戰次數是節奏閥門(避免無限刷),戰鬥勝負判定直接複用 game/heroHealth.ts 的 resolveFightHealth,
// 不另外發明一套。

// 副本六分頁(見 components/DungeonPanel.tsx):職業試煉之外再拆五種各自獨立的材料/資源副本。
// 每個分頁各自獨立每日次數(不共用同一組計數),日期基準沿用 game/daily.ts 的
// todayDateString/isNewDay——轉職試煉(job)一天只能打2次(晉升試煉也算在這個計數裡,見
// hooks/useGameState.ts 的 promoteJobTier),其餘5種各自獨立3次/日,彼此不互相排擠。
export type DungeonTab = 'job' | 'skillBook' | 'enhanceStone' | 'gem' | 'exp' | 'coin';
export const DUNGEON_TABS: DungeonTab[] = ['job', 'skillBook', 'enhanceStone', 'gem', 'exp', 'coin'];
export const DUNGEON_TAB_LABELS: Record<DungeonTab, string> = {
  job: '職業副本',
  skillBook: '技能書副本',
  enhanceStone: '強化石副本',
  gem: '鑲嵌石副本',
  exp: '經驗副本',
  coin: '金錢副本',
};

export const DUNGEON_DAILY_CAP: Record<DungeonTab, number> = {
  job: 2,
  skillBook: 3,
  enhanceStone: 3,
  gem: 3,
  exp: 3,
  coin: 3,
};

export interface DungeonState {
  lastResetAt: string; // 日期字串(見 game/daily.ts todayDateString),跨日才重置 usedToday
  usedToday: Record<DungeonTab, number>;
}

function createEmptyUsedToday(): Record<DungeonTab, number> {
  return { job: 0, skillBook: 0, enhanceStone: 0, gem: 0, exp: 0, coin: 0 };
}

// 新玩家/新分頁一開始今天都還沒打過,6個分頁次數全滿,呼應其他「解鎖當下就能馬上用」的
// 既有設計慣例。
export function createInitialDungeonState(now: number = Date.now()): DungeonState {
  return { lastResetAt: todayDateString(now), usedToday: createEmptyUsedToday() };
}

// 純函式:跨日才把6個分頁的今日已用次數一起歸零,不用等玩家手動點進副本分頁才觸發
// (見 hooks/useGameState.ts 的 load(),跟每日任務/登入獎勵同一套「跨日重置」精神)。
export function applyDungeonDailyReset(state: DungeonState, now: number = Date.now()): DungeonState {
  if (!isNewDay(state.lastResetAt, now)) return state;
  return { lastResetAt: todayDateString(now), usedToday: createEmptyUsedToday() };
}

export function remainingDungeonChallenges(state: DungeonState, tab: DungeonTab): number {
  return Math.max(0, DUNGEON_DAILY_CAP[tab] - state.usedToday[tab]);
}

// 消耗一次指定分頁的每日挑戰次數。沒有剩餘次數回傳 null,呼叫端要處理這個 null
// (不能挑戰、UI 按鈕本來就該 disabled)。
export function spendDungeonChallenge(state: DungeonState, tab: DungeonTab): DungeonState | null {
  if (remainingDungeonChallenges(state, tab) <= 0) return null;
  return { ...state, usedToday: { ...state.usedToday, [tab]: state.usedToday[tab] + 1 } };
}

// 副本難度倍率:吃玩家等級(不是關卡進度),讓副本是一個穩定的「build夠不夠強」檢驗,
// 不會因為玩家剛好卡在關卡循環的哪個位置而忽大忽小。數值校準:Lv50→5.5x、Lv200→10x、
// Lv500(封頂)→19x,對照 game/stages.ts 大魔王倍率封頂約 9.35x(FINAL_BOSS_MULTIPLIER=5 疊加
// 關卡進度算出來的),副本在中後期會是比大魔王更硬的檢驗,呼應「有真實失敗風險」的定位。
export function dungeonDifficultyMultiplier(level: number): number {
  return 4 + level * 0.03;
}

// 打贏的金幣獎勵(碎片是保證掉落的主獎勵,金幣是附帶的次要獎勵)。
export function dungeonWinCoinReward(level: number): number {
  return Math.round(50 + level * 3);
}

export const DUNGEON_ARCHETYPES: Archetype[] = [
  'physicalMelee',
  'physicalRanged',
  'physicalSupport',
  'magicMelee',
  'magicRanged',
  'magicSupport',
];

// 強化石副本:固定初階,打贏保證掉落固定數量。獎勵改版(+50%):2→3。
export const ENHANCE_STONE_DUNGEON_REWARD_AMOUNT = 3;
export const ENHANCE_STONE_DUNGEON_SCHOOL: DamageType = 'physical';

// 技能書副本:保底15本(獎勵改版,原10本+50%),且依職業階級開放對應階的副本——玩家目前的
// jobTier 開到哪,0階(初階,學生期也能挑戰)到 jobTier 之間的每一階都各自是一個獨立副本卡片,
// 一旦開放就不會因為之後繼續轉職而關閉(jobTier 只會往上升、不會倒退,所以「開過的階級
// 永久可玩」自然成立,不需要額外的「最高曾達到階級」欄位)。
export const SKILL_BOOK_DUNGEON_REWARD_AMOUNT = 15;
export const SKILL_BOOK_DUNGEON_SCHOOL: DamageType = 'magic';

export function unlockedSkillBookDungeonTiers(hasChosenJob: boolean, jobTier: JobTier): MaterialTier[] {
  const maxTier = hasChosenJob ? jobTier : 0;
  return MATERIAL_TIERS.filter((tier) => tier <= maxTier);
}

// 鑲嵌石副本:只開放10種「素質石」(kind: 'substat'),經驗/金幣/速度3種加成石不列入
// (那3種已經有其他常態管道,不需要再開副本)。平日(週一~週五)一天只開放2種、5天剛好
// 排完全部10種,一組固定配對呼應同一類數值(抗性/物理爆擊/魔法爆擊/攻擊/生存);
// 週末(六日)全部10種一次開放,給錯過平日輪值的玩家補打的機會。
const GEM_DUNGEON_SUBSTAT_TYPES: GemType[] = GEM_TYPES.filter((type) => GEM_SPECS[type].kind === 'substat');
const WEEKDAY_GEM_DUNGEON_PAIRS: Partial<Record<number, [GemType, GemType]>> = {
  1: ['physicalResistanceGem', 'magicResistanceGem'],
  2: ['physicalCritRateGem', 'physicalCritDamageGem'],
  3: ['magicCritRateGem', 'magicCritDamageGem'],
  4: ['physicalAttackGem', 'magicAttackGem'],
  5: ['lifestealGem', 'hpRegenGem'],
};
// 獎勵改版:3→5(原提案4~5,取上限)。
export const GEM_DUNGEON_REWARD_AMOUNT = 5;
export const GEM_DUNGEON_SCHOOL: DamageType = 'magic';

// weekday:JS Date.getDay() 的 0(日)~6(六)。
export function availableGemDungeonTypes(weekday: number): GemType[] {
  return WEEKDAY_GEM_DUNGEON_PAIRS[weekday] ?? GEM_DUNGEON_SUBSTAT_TYPES;
}

// 經驗/金錢副本:跟現有離線經驗公式(expPerMin)同樣邏輯隨等級成長——經驗直接借
// expPerMin 換算成「打贏=N分鐘份離線經驗」;金錢延續 dungeonWinCoinReward 同一組線性
// 成長參數放大,兩者都不吃隨機,打贏一次就是固定這個數。獎勵改版(+50%上下):
// 45分鐘→68分鐘、基礎值/等級係數同比例放大。
const DUNGEON_EXP_REWARD_MINUTES = 68;
export function dungeonExpDropAmount(level: number): number {
  return Math.floor(expPerMin(level) * DUNGEON_EXP_REWARD_MINUTES);
}
export const EXP_DUNGEON_SCHOOL: DamageType = 'physical';

const DUNGEON_COIN_DROP_BASE = 450;
const DUNGEON_COIN_DROP_LEVEL_FACTOR = 30;
export function dungeonCoinDropAmount(level: number): number {
  return Math.round(DUNGEON_COIN_DROP_BASE + level * DUNGEON_COIN_DROP_LEVEL_FACTOR);
}
export const COIN_DUNGEON_SCHOOL: DamageType = 'physical';
