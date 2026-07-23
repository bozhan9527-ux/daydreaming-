import { Archetype, DamageType, JobTier } from './combat';
import { GEM_SPECS, GEM_TYPES, GemType } from './equipment';
import { expPerMin } from './leveling';
import { MATERIAL_TIERS, MaterialTier } from './materials';

// 轉職試煉副本系統:6 個職業各自獨立的副本,打贏保證掉落該職業的轉職碎片(見 game/transfer.ts),
// 把過去唯一取得碎片的方式(打大魔王 3% 隨機機率、不分職業亂抽)補上一條主動、有目標的路線。
// 入場券是節奏閥門(避免無限刷),戰鬥勝負判定直接複用 game/heroHealth.ts 的 resolveFightHealth,
// 不另外發明一套。

export const DUNGEON_TICKET_CAP = 5;
export const DUNGEON_TICKET_REGEN_MS = 30 * 60 * 1000; // 30分鐘回1張

export interface DungeonState {
  tickets: number;
  lastTicketRegenAt: number; // timestamp,回滿(=DUNGEON_TICKET_CAP)時這個值語意上是「上次算到哪」
}

// 新玩家/新分頁一開始就是滿的,不用等,呼應其他「解鎖當下就能馬上用」的既有設計慣例。
export function createInitialDungeonState(now: number = Date.now()): DungeonState {
  return { tickets: DUNGEON_TICKET_CAP, lastTicketRegenAt: now };
}

// 純函式:依經過時間回補入場券,回滿就停(不會超過上限),沒用完的零頭時間保留到下次
// (用「往前推進整數個 DUNGEON_TICKET_REGEN_MS」的方式更新 lastTicketRegenAt,不要直接設成 now,
// 不然玩家在快回滿前一秒點進來看一眼,會把已經累積的零頭時間全部歸零,等於變相拉長回復時間)。
export function applyDungeonTicketRegen(state: DungeonState, now: number = Date.now()): DungeonState {
  if (state.tickets >= DUNGEON_TICKET_CAP) return state;
  const elapsed = now - state.lastTicketRegenAt;
  if (elapsed < DUNGEON_TICKET_REGEN_MS) return state;
  const regenerated = Math.floor(elapsed / DUNGEON_TICKET_REGEN_MS);
  const nextTickets = Math.min(DUNGEON_TICKET_CAP, state.tickets + regenerated);
  const consumedMs = regenerated * DUNGEON_TICKET_REGEN_MS;
  return { tickets: nextTickets, lastTicketRegenAt: state.lastTicketRegenAt + consumedMs };
}

// UI 顯示用:回滿了回傳 null(不用倒數),沒回滿回傳距離下一張還剩幾毫秒。
export function msUntilNextDungeonTicket(state: DungeonState, now: number = Date.now()): number | null {
  const regened = applyDungeonTicketRegen(state, now);
  if (regened.tickets >= DUNGEON_TICKET_CAP) return null;
  return DUNGEON_TICKET_REGEN_MS - (now - regened.lastTicketRegenAt);
}

// 消耗一張入場券(呼叫前後都會先套用回補,確保拿到的是當下最新可用張數)。
// 沒有票可用回傳 null,呼叫端要處理這個 null(不能挑戰、UI 按鈕本來就該 disabled)。
export function spendDungeonTicket(state: DungeonState, now: number = Date.now()): DungeonState | null {
  const regened = applyDungeonTicketRegen(state, now);
  if (regened.tickets <= 0) return null;
  return { tickets: regened.tickets - 1, lastTicketRegenAt: regened.lastTicketRegenAt };
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

// 副本六分頁(見 components/DungeonPanel.tsx):職業試煉之外再拆五種各自獨立的材料/資源副本,
// 全部共用同一組入場券池,不分頁另外開票。
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

// 強化石副本:固定初階,打贏保證掉落固定數量,維持既有份量不變(這次改版只提高技能書副本的量)。
export const ENHANCE_STONE_DUNGEON_REWARD_AMOUNT = 2;
export const ENHANCE_STONE_DUNGEON_SCHOOL: DamageType = 'physical';

// 技能書副本:保底10本(舊制2本的5倍),且依職業階級開放對應階的副本——玩家目前的 jobTier
// 開到哪,0階(初階,學生期也能挑戰)到 jobTier 之間的每一階都各自是一個獨立副本卡片,
// 一旦開放就不會因為之後繼續轉職而關閉(jobTier 只會往上升、不會倒退,所以「開過的階級
// 永久可玩」自然成立,不需要額外的「最高曾達到階級」欄位)。
export const SKILL_BOOK_DUNGEON_REWARD_AMOUNT = 10;
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
export const GEM_DUNGEON_REWARD_AMOUNT = 3;
export const GEM_DUNGEON_SCHOOL: DamageType = 'magic';

// weekday:JS Date.getDay() 的 0(日)~6(六)。
export function availableGemDungeonTypes(weekday: number): GemType[] {
  return WEEKDAY_GEM_DUNGEON_PAIRS[weekday] ?? GEM_DUNGEON_SUBSTAT_TYPES;
}

// 經驗/金錢副本:跟現有離線經驗公式(expPerMin)同樣邏輯隨等級成長——經驗直接借
// expPerMin 換算成「打贏=N分鐘份離線經驗」;金錢延續 dungeonWinCoinReward 同一組線性
// 成長參數放大,兩者都不吃隨機,打贏一次就是固定這個數。
const DUNGEON_EXP_REWARD_MINUTES = 45;
export function dungeonExpDropAmount(level: number): number {
  return Math.floor(expPerMin(level) * DUNGEON_EXP_REWARD_MINUTES);
}
export const EXP_DUNGEON_SCHOOL: DamageType = 'physical';

const DUNGEON_COIN_DROP_BASE = 300;
const DUNGEON_COIN_DROP_LEVEL_FACTOR = 20;
export function dungeonCoinDropAmount(level: number): number {
  return Math.round(DUNGEON_COIN_DROP_BASE + level * DUNGEON_COIN_DROP_LEVEL_FACTOR);
}
export const COIN_DUNGEON_SCHOOL: DamageType = 'physical';
