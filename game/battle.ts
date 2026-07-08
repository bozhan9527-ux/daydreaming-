import { coinsForRarity } from './currency';
import { expPerMin } from './leveling';
import { getMonstersByRarity, MonsterSpec, pickMonster } from './monsters';
import { Rarity, rollTrigger, TriggerState } from './trigger';

// 每個稀有度的「基準」戰鬥時長,換算擊殺經驗值的基準,也是 speedMultiplier 縮放的基礎值。
const BASE_FIGHT_DURATION_MS: Record<Rarity, number> = {
  common: 3000,
  rare: 5000,
  epic: 8000,
  legendary: 15000,
};

const MIN_FIGHT_DURATION_MS = 500;

export function getFightDurationMs(rarity: Rarity): number {
  return BASE_FIGHT_DURATION_MS[rarity];
}

export interface Encounter {
  monster: MonsterSpec;
  rarity: Rarity;
  fightDurationMs: number;
  triggerState: TriggerState;
  pityTriggered: boolean;
}

// 怪物出現時機複用現有的稀有度機率表跟保底機制(game/trigger.ts),
// 只是觸發方式從「點擊」換成「怪物死亡後生成下一隻」,機率邏輯本身不變。
// speedMultiplier 來自裝備/坐騎的加成(1 = 無加成),縮短實際戰鬥時長,設下限避免變成 0 或負數。
export function generateEncounter(
  triggerState: TriggerState,
  speedMultiplier: number = 1,
  rng: () => number = Math.random
): Encounter {
  const roll = rollTrigger(triggerState, rng);
  const monster = pickMonster(roll.rarity, rng);
  const fightDurationMs = Math.max(
    MIN_FIGHT_DURATION_MS,
    Math.round(BASE_FIGHT_DURATION_MS[roll.rarity] / speedMultiplier)
  );
  return {
    monster,
    rarity: roll.rarity,
    fightDurationMs,
    triggerState: roll.state,
    pityTriggered: roll.pityTriggered,
  };
}

export interface KillReward {
  exp: number;
  coins: number;
}

// 擊殺經驗 =「這隻怪基準戰鬥時長」換算出的經驗值,再套 expMultiplier(職業倍率 * 裝備/寵物加成)——
// 跟舊版離線結算公式「expPerMin * 分鐘數 * 職業倍率」等價,只是把時間切成一隻一隻怪來發放。
// coinMultiplier 是裝備/寵物的金幣加成(1 = 無加成)。技能組是主動觸發效果(見 game/skills.ts),
// 不是連續倍率,所以不在這裡出現。
export function calcKillReward(
  rarity: Rarity,
  level: number,
  expMultiplier: number,
  coinMultiplier: number = 1
): KillReward {
  const expPerSec = expPerMin(level) / 60;
  const baseExp = (expPerSec * BASE_FIGHT_DURATION_MS[rarity]) / 1000;
  const exp = Math.max(1, Math.round(baseExp * expMultiplier));
  const coins = Math.max(1, Math.round(coinsForRarity(rarity) * coinMultiplier));
  return { exp, coins };
}

// 供 UI 保底顯示/測試用:確認每個稀有度都至少有一隻怪可以生成。
export function hasMonsterFor(rarity: Rarity): boolean {
  return getMonstersByRarity(rarity).length > 0;
}

const RARITY_WEIGHTS: Record<Rarity, number> = { common: 0.7, rare: 0.22, epic: 0.07, legendary: 0.01 };
const RARITY_LIST = Object.keys(RARITY_WEIGHTS) as Rarity[];

const AVG_FIGHT_DURATION_MS = RARITY_LIST.reduce(
  (sum, rarity) => sum + RARITY_WEIGHTS[rarity] * BASE_FIGHT_DURATION_MS[rarity],
  0
);
const AVG_COINS_PER_KILL = RARITY_LIST.reduce(
  (sum, rarity) => sum + RARITY_WEIGHTS[rarity] * coinsForRarity(rarity),
  0
);

export interface OfflineBattleEstimate {
  kills: number;
  coins: number;
}

// App 背景/關閉時沒有畫面可以真的一隻一隻打,離線結算用「平均戰鬥時長/平均金幣」反推
// 大概打了幾隻、賺了多少金幣,純粹是離線橫幅的風味數字——經驗值仍然是 calcOfflineExp
// 那套已經調好的公式在算,這裡不影響、也不重算經驗。speedMultiplier/coinMultiplier
// 跟前景戰鬥用的是同一套裝備/寵物加成,離線估算才不會跟實際玩起來的速率脫節。
export function estimateOfflineBattleResult(
  elapsedMs: number,
  speedMultiplier: number,
  coinMultiplier: number = 1
): OfflineBattleEstimate {
  const effectiveDurationMs = AVG_FIGHT_DURATION_MS / speedMultiplier;
  const kills = Math.max(0, Math.floor(elapsedMs / effectiveDurationMs));
  const coins = Math.round(kills * AVG_COINS_PER_KILL * coinMultiplier);
  return { kills, coins };
}
