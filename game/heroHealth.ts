import { JobTier } from './combat';
import { Rarity } from './trigger';

// 勇者血量/戰敗風險系統:在這之前,戰鬥只有進度條跑滿=擊殺成功,勇者不會受傷、不會被打倒。
// 這裡補上「這場戰鬥有沒有可能沒打贏」的判定——公式跟常數已經用 ts-node 數值驗證過,
// 平常打一般小怪(common/rare/epic)只會小幅掉血、配合每次擊殺回血基本打平或回血,
// 只有推王/嚴重落後練等才會真的有戰敗風險,這是刻意的設計,不要為了讓一般戰鬥也有風險而調整數值。

const MONSTER_BASE_ATTACK: Record<Rarity, number> = { common: 5, rare: 12, epic: 30, legendary: 80 };

const DAMAGE_SCALE = 0.35;
// 單場戰鬥最多打掉 60% 最大HP上限,滿血不可能被一場戰鬥秒殺。
const MAX_DAMAGE_FRACTION = 0.6;
// 每次「成功擊殺」(非戰敗)回復 8% 最大HP。
const HP_REGEN_FRACTION_PER_KILL = 0.08;
// 戰敗後以 75% 最大HP重新站起來——這個數字必須嚴格大於 MAX_DAMAGE_FRACTION(0.6),
// 不然會出現無法脫困的無限戰敗迴圈:damageForFight() 是純數值函式、同一場戰鬥(同關卡/
// 同倍率)每次算出來的傷害完全一樣,如果戰敗恢復血量 <= 單場戰鬥的傷害上限,玩家會在
// 「打輸→用回復血量重新挑戰同一隻怪→傷害一樣多→又打輸」這個迴圈裡卡死出不來,
// 而且因為每次都在還沒跑到技能觸發那段程式碼前就 return,技能倒數會整個凍結——
// 這正是實測(推王時Lv偏低)踩到的真實 bug,回復血量拉到 0.75 才能保證重打一定會贏。
const DEFEAT_RECOVERY_FRACTION = 0.75;
// 戰敗後倒地恢復,這段時間不生成新戰鬥。
export const RECOVERY_DELAY_MS = 4000;

export function heroMaxHp(level: number): number {
  return 50 + level * 2;
}

export function heroDefensePower(level: number, tier: JobTier, resistanceSubstatTotal: number): number {
  return level * (1 + tier * 0.1) * (1 + resistanceSubstatTotal);
}

export function monsterAttackPower(rarity: Rarity, difficultyMultiplier: number): number {
  return MONSTER_BASE_ATTACK[rarity] * difficultyMultiplier;
}

export function damageForFight(
  level: number,
  tier: JobTier,
  resistanceSubstatTotal: number,
  rarity: Rarity,
  difficultyMultiplier: number,
  maxHp: number
): number {
  const def = heroDefensePower(level, tier, resistanceSubstatTotal);
  const atk = monsterAttackPower(rarity, difficultyMultiplier);
  const ratio = atk / def;
  return Math.round(maxHp * Math.min(MAX_DAMAGE_FRACTION, Math.max(0, ratio * DAMAGE_SCALE)));
}

export interface FightHealthResult {
  damage: number;
  nextHp: number;
  defeated: boolean; // true = 這場戰鬥沒有擊殺成功,勇者被打倒
}

// currentHp/maxHp 是這場戰鬥開始「前」的血量(呼叫端在擊殺結算的同一個時間點呼叫,
// 邏輯上等同「這場戰鬥的傷害在結算擊殺獎勵之前先算」)。
export function resolveFightHealth(
  currentHp: number,
  maxHp: number,
  level: number,
  tier: JobTier,
  resistanceSubstatTotal: number,
  rarity: Rarity,
  difficultyMultiplier: number
): FightHealthResult {
  const damage = damageForFight(level, tier, resistanceSubstatTotal, rarity, difficultyMultiplier, maxHp);
  const remaining = currentHp - damage;
  if (remaining <= 0) {
    return { damage, nextHp: Math.round(maxHp * DEFEAT_RECOVERY_FRACTION), defeated: true };
  }
  const healed = Math.min(maxHp, remaining + Math.round(maxHp * HP_REGEN_FRACTION_PER_KILL));
  return { damage, nextHp: healed, defeated: false };
}
