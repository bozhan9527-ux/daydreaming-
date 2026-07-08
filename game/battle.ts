import { coinsForRarity } from './currency';
import { expPerMin } from './leveling';
import { getMonstersByRarity, MonsterSpec, pickMonster } from './monsters';
import { Rarity, rollTrigger, TriggerState } from './trigger';

// 每個稀有度的「基準」戰鬥時長,只用來換算擊殺經驗值,不隨職業倍率縮放
// (職業/技能倍率改套在擊殺獎勵上,不改戰鬥動畫時間,呈現上比較好預期)。
const BASE_FIGHT_DURATION_MS: Record<Rarity, number> = {
  common: 3000,
  rare: 5000,
  epic: 8000,
  legendary: 15000,
};

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
export function generateEncounter(triggerState: TriggerState, rng: () => number = Math.random): Encounter {
  const roll = rollTrigger(triggerState, rng);
  const monster = pickMonster(roll.rarity, rng);
  return {
    monster,
    rarity: roll.rarity,
    fightDurationMs: BASE_FIGHT_DURATION_MS[roll.rarity],
    triggerState: roll.state,
    pityTriggered: roll.pityTriggered,
  };
}

export interface KillReward {
  exp: number;
  coins: number;
}

// 擊殺經驗 =「這隻怪基準戰鬥時長」換算出的經驗值,再套職業戰鬥倍率跟技能加成——
// 跟舊版離線結算公式「expPerMin * 分鐘數 * 職業倍率 * 技能倍率」完全等價,
// 只是把時間切成一隻一隻怪來發放,平均下來速率不變,不需要重新調整經濟平衡。
export function calcKillReward(
  rarity: Rarity,
  level: number,
  jobMultiplier: number,
  skillMultiplier: number
): KillReward {
  const expPerSec = expPerMin(level) / 60;
  const baseExp = (expPerSec * BASE_FIGHT_DURATION_MS[rarity]) / 1000;
  const exp = Math.max(1, Math.round(baseExp * jobMultiplier * skillMultiplier));
  const coins = coinsForRarity(rarity);
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
// 那套已經調好的公式在算,這裡不影響、也不重算經驗。
export function estimateOfflineBattleResult(elapsedMs: number, jobMultiplier: number): OfflineBattleEstimate {
  const effectiveDurationMs = AVG_FIGHT_DURATION_MS / jobMultiplier;
  const kills = Math.max(0, Math.floor(elapsedMs / effectiveDurationMs));
  const coins = Math.round(kills * AVG_COINS_PER_KILL);
  return { kills, coins };
}
