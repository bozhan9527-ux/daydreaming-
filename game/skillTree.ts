import { Archetype, getArchetypeComposition, JobTier, Subtype } from './combat';

// 每個職業 7 個技能欄位:3 被動(永久數值加成)+ 4 主動(各自獨立冷卻,同時運作)。
// passive3 是吸血(lifesteal)+回血(hpRegen)雙效合一的通用被動,見 getPassiveEffectKind 的
// 'lifeMastery' 分類與 game/heroHealth.ts 的實際套用點。
export type SkillSlotId = 'passive1' | 'passive2' | 'passive3' | 'active1' | 'active2' | 'active3' | 'active4';
export type ActiveSkillSlotId = 'active1' | 'active2' | 'active3' | 'active4';

export const PASSIVE_SLOT_IDS: SkillSlotId[] = ['passive1', 'passive2', 'passive3'];
export const ACTIVE_SLOT_IDS: ActiveSkillSlotId[] = ['active1', 'active2', 'active3', 'active4'];
export const SKILL_SLOT_IDS: SkillSlotId[] = [...PASSIVE_SLOT_IDS, ...ACTIVE_SLOT_IDS];

export function isPassiveSlot(slot: SkillSlotId): boolean {
  return PASSIVE_SLOT_IDS.includes(slot);
}

export type SkillTreeLevels = Record<Archetype, Record<SkillSlotId, number>>;

export function createInitialSkillTreeLevels(): SkillTreeLevels {
  const emptySlots = { passive1: 0, passive2: 0, passive3: 0, active1: 0, active2: 0, active3: 0, active4: 0 };
  return {
    physicalMelee: { ...emptySlots },
    physicalRanged: { ...emptySlots },
    physicalSupport: { ...emptySlots },
    magicMelee: { ...emptySlots },
    magicRanged: { ...emptySlots },
    magicSupport: { ...emptySlots },
  };
}

// 技能等級上限改成「累積技能書」制:單一格最高 10 級,依現有轉職階級(1-5階)分段解鎖
// (階1封頂2級、階2封頂4級...階5封頂10級),呼應「10級的進度比300級好懂太多」的重新設計。
export const SKILL_LEVEL_CAP = 10;
const LEVEL_CAP_PER_TIER = SKILL_LEVEL_CAP / 5;

export function skillSlotLevelCap(tier: JobTier): number {
  return tier * LEVEL_CAP_PER_TIER;
}

// 升級花費改成純粹技能書、倍增制:0→1級要1本、1→2級要2本...9→10級要512本,逼玩家在6格
// 之間做真實取捨(不再跟角色升等搶銀行經驗值,也不再吃金幣)。
export function skillSlotUpgradeBookCost(level: number): number {
  return Math.pow(2, level);
}

export function canUpgradeSkillSlot(level: number, tier: JobTier, skillBooks: number): boolean {
  return level < skillSlotLevelCap(tier) && skillBooks >= skillSlotUpgradeBookCost(level);
}

export function upgradeSkillSlot(level: number, tier: JobTier): number {
  return Math.min(skillSlotLevelCap(tier), level + 1);
}

// 技能書掉落:比照 game/equipment.ts 的強化石/寶石掉落,每次擊殺獨立判定一次,互不干擾。
const SKILL_BOOK_DROP_CHANCE = 0.04;

export function rollSkillBookDrop(rng: () => number = Math.random): boolean {
  return rng() < SKILL_BOOK_DROP_CHANCE;
}

// 主動技能觸發間隔:秒數倒數,固定不受戰鬥/關卡時長影響。4 個主動欄位各自有自己的基準秒數
// (前3招一般技能 6/7/8 秒,第4招特別技能 15 秒),隨等級線性降到 tier5 封頂等級(10級,
// 對齊 skillSlotLevelCap(5))時觸底,下限是基準值的 2/3——6→4秒、7→4.67秒、8→5.33秒、15→10秒。
const ACTIVE_SLOT_BASE_INTERVAL_SECONDS: Record<ActiveSkillSlotId, number> = {
  active1: 6,
  active2: 7,
  active3: 8,
  active4: 15,
};
const INTERVAL_FLOOR_RATIO = 2 / 3;
const INTERVAL_DECAY_LEVEL_CAP = SKILL_LEVEL_CAP;

export function activeSkillTriggerIntervalSeconds(slot: ActiveSkillSlotId, level: number): number {
  const base = ACTIVE_SLOT_BASE_INTERVAL_SECONDS[slot];
  const progress = Math.min(level, INTERVAL_DECAY_LEVEL_CAP) / INTERVAL_DECAY_LEVEL_CAP;
  const interval = base * (1 - (1 - INTERVAL_FLOOR_RATIO) * progress);
  return Math.round(interval * 100) / 100;
}

export type ActiveEffectKind = 'instantFinish' | 'doubleReward' | 'bonusCoins' | 'expBoost';
export type PassiveEffectKind = 'expMastery' | 'coinMastery' | 'lifeMastery';

const BONUS_COINS_AMOUNT = 20;
const EXP_BOOST_AMOUNT = 30;

export function getBonusCoinsAmount(): number {
  return BONUS_COINS_AMOUNT;
}

export function getExpBoostAmount(): number {
  return EXP_BOOST_AMOUNT;
}

// 職業樹分階內容:每晉一階(2/3/4/5),主動技能觸發時額外「疊加」一個新效果在既有4種基礎機制
// 之外——是疊加不是取代,tier5玩家同時享有tier2~5全部疊加效果,呼應「職業樹點進去可以看到
// 2/3/4/5階分支,各階都有專屬新技能」的需求。數值刻意壓在跟被動技能封頂(+30%)、裝備爆擊率
// 等既有加成同一量級,不會讓經濟大幅波動。每次「任一主動技能觸發」的批次只套用一次(不會因為
// 剛好4格同時觸發就疊加4次),見 hooks/useGameState.ts 的 tickBattle。副職觸發不套用這組加成,
// 呼應副職「只拿部分加成」的既有定位。
export const TIER2_BONUS_COIN_MULT = 0.1;
export const TIER3_BONUS_EXP_MULT = 0.1;
export const TIER4_BONUS_FLAT_COINS = 3;
export const TIER5_EXTRA_INSTANT_CHANCE = 0.08;

export interface TierTriggerBonus {
  bonusCoinMult: number;
  bonusExpMult: number;
  bonusFlatCoins: number;
  extraInstantChance: number;
}

export function getTierTriggerBonus(tier: JobTier): TierTriggerBonus {
  return {
    bonusCoinMult: tier >= 2 ? TIER2_BONUS_COIN_MULT : 0,
    bonusExpMult: tier >= 3 ? TIER3_BONUS_EXP_MULT : 0,
    bonusFlatCoins: tier >= 4 ? TIER4_BONUS_FLAT_COINS : 0,
    extraInstantChance: tier >= 5 ? TIER5_EXTRA_INSTANT_CHANCE : 0,
  };
}

// 4 種主動效果依 subtype 決定排列順序:跟該 subtype 呼應的「招牌效果」排在 active1(沿用舊版單一
// 技能的效果分配),其餘 3 種依固定順序輪流填滿 active2-4,確保每個職業的 4 個主動技能各不相同。
const ACTIVE_KIND_ORDER: ActiveEffectKind[] = ['instantFinish', 'doubleReward', 'bonusCoins', 'expBoost'];

const SUBTYPE_SIGNATURE_KIND: Record<Subtype, ActiveEffectKind> = {
  melee: 'instantFinish',
  ranged: 'doubleReward',
  support: 'bonusCoins',
};

function rotatedKinds(signature: ActiveEffectKind): ActiveEffectKind[] {
  const startIndex = ACTIVE_KIND_ORDER.indexOf(signature);
  return [...ACTIVE_KIND_ORDER.slice(startIndex), ...ACTIVE_KIND_ORDER.slice(0, startIndex)];
}

export function getActiveEffectKind(archetype: Archetype, slot: SkillSlotId): ActiveEffectKind {
  const { subtype } = getArchetypeComposition(archetype);
  const order = rotatedKinds(SUBTYPE_SIGNATURE_KIND[subtype]);
  const index = (ACTIVE_SLOT_IDS as SkillSlotId[]).indexOf(slot);
  return order[index];
}

// 副職(雙職兼修)只借用主動技能第 1 格(該職業的招牌效果)在戰鬥中觸發,間隔是本職的兩倍,
// 呼應副職只拿「部分加成」的定位——被動技能/其餘 3 個主動技能不會套用在副職上。
const SECONDARY_SKILL_INTERVAL_MULTIPLIER = 2;

export function secondaryActiveSkillTriggerIntervalSeconds(level: number): number {
  return activeSkillTriggerIntervalSeconds('active1', level) * SECONDARY_SKILL_INTERVAL_MULTIPLIER;
}

// 被動一律是 passive1=經驗系、passive2=金幣系、passive3=吸血+回血雙效合一系,所有職業共用
// 同一套分類,靠名稱/描述表現職業風味。
export function getPassiveEffectKind(slot: SkillSlotId): PassiveEffectKind {
  if (slot === 'passive1') return 'expMastery';
  if (slot === 'passive2') return 'coinMastery';
  return 'lifeMastery';
}

// 每級 +3% 加成,階5滿級(10級)時最高 +30%(跟舊制「300級封頂30%」戰力對齊,只是刻度從
// 0.1%/級改成3%/級),量級跟裝備/寵物既有加成同一個數量級,不會暴衝。
const PASSIVE_BONUS_PER_LEVEL = 0.03;

export function getPassiveBonusValue(level: number): number {
  return level * PASSIVE_BONUS_PER_LEVEL;
}

// 36 個技能名稱(6 職業 x 6 欄位),每個職業的 active1 沿用舊版單一技能系統的原名,維持敘事延續性。
export const SKILL_SLOT_NAMES: Record<Archetype, Record<SkillSlotId, string>> = {
  physicalMelee: {
    passive1: '扛貨練出的體感',
    passive2: '工地行情摸透了',
    passive3: '扛出來的韌性',
    active1: '爆擊一擊',
    active2: '連環出拳',
    active3: '順手清點庫存',
    active4: '扎實的一天',
  },
  physicalRanged: {
    passive1: '抄近路練出的直覺',
    passive2: '跑單跑出的效率',
    passive3: '跑車練出的耐力',
    active1: '連續多重射擊',
    active2: '順路多接一單',
    active3: '熟門熟路',
    active4: '精準一擊',
  },
  physicalSupport: {
    passive1: '站櫃練出的觀察力',
    passive2: '會員點數精算術',
    passive3: '顧客服務練出的抗壓性',
    active1: '治療光環',
    active2: '貼心的叮嚀',
    active3: '速戰速決',
    active4: '雙倍關懷',
  },
  magicMelee: {
    passive1: '修煉日常',
    passive2: '香油錢緣分',
    passive3: '打坐修煉的元氣',
    active1: '能量爆發斬',
    active2: '連環符咒',
    active3: '收驚順便收紅包',
    active4: '頓悟時刻',
  },
  magicRanged: {
    passive1: '肝出來的手感',
    passive2: '接案眼光',
    passive3: '肝出來的恢復力',
    active1: '法術齊射',
    active2: '業配置入',
    active3: '熬夜肝出的心得',
    active4: '一鍵神操作',
  },
  magicSupport: {
    passive1: '臨床經驗',
    passive2: '診間人脈',
    passive3: '行醫累積的養生術',
    active1: '增幅祝福',
    active2: '衛教叮嚀',
    active3: '藥到病除',
    active4: '雙倍療效',
  },
};

export const SKILL_SLOT_DESCRIPTIONS: Record<Archetype, Record<SkillSlotId, string>> = {
  physicalMelee: {
    passive1: '日復一日扛貨練出的體感,打怪的經驗值吸收得更快。',
    passive2: '在工地行情裡打滾久了,順手多帶一點回家。',
    passive3: '長期扛重物練出的韌性,讓身體恢復力跟著變好,吸血跟自動回血效果都會提升。',
    active1: '一拳打爆眼前的敵人,直接讓下一場戰鬥瞬間結束。',
    active2: '拳拳到肉,這次擊殺的經驗與金幣獎勵直接翻倍。',
    active3: '收工前順手清點一下庫存,多賺一筆零用錢。',
    active4: '扎實幹完一天活,額外進帳一筆經驗值。',
  },
  physicalRanged: {
    passive1: '抄近路抄久了,連怎麼打怪都比別人有效率。',
    passive2: '跑單跑出心得,順路的錢也不放過。',
    passive3: '長時間在外奔波練出的底子耐力,吸血跟自動回血效果都會提升。',
    active1: '連續多重射擊招呼過去,這次擊殺的經驗與金幣獎勵直接翻倍。',
    active2: '順路多接一單,額外進帳一筆金幣。',
    active3: '熟門熟路抄捷徑,額外進帳一筆經驗值。',
    active4: '一箭封喉,直接讓下一場戰鬥瞬間結束。',
  },
  physicalSupport: {
    passive1: '站櫃檯練出的敏銳觀察力,經驗值吸收得更快。',
    passive2: '會員點數精算到位,順手多換一點回饋金。',
    passive3: '第一線服務練出的抗壓體質,吸血跟自動回血效果都會提升。',
    active1: '一圈治療光環罩住全場,額外進帳一筆金幣。',
    active2: '貼心叮嚀送到心坎裡,額外進帳一筆經驗值。',
    active3: '手腳俐落速戰速決,直接讓下一場戰鬥瞬間結束。',
    active4: '雙倍關懷灌注全場,這次擊殺的經驗與金幣獎勵直接翻倍。',
  },
  magicMelee: {
    passive1: '每天固定修煉的日常,經驗值吸收得更快。',
    passive2: '香油錢的緣分到了,順手多收一點。',
    passive3: '打坐修煉出的元氣底子,吸血跟自動回血效果都會提升。',
    active1: '灌注能量的爆發斬,直接讓下一場戰鬥瞬間結束。',
    active2: '連環符咒一張接一張,這次擊殺的經驗與金幣獎勵直接翻倍。',
    active3: '順便幫怪物收個驚,額外進帳一筆金幣。',
    active4: '一瞬間的頓悟,額外進帳一筆經驗值。',
  },
  magicRanged: {
    passive1: '肝出來的手感就是不一樣,經驗值吸收得更快。',
    passive2: '接案眼光練出來了,順手多賺一點外快。',
    passive3: '熬夜爆肝練出的恢復本能,吸血跟自動回血效果都會提升。',
    active1: '法術齊射覆蓋戰場,這次擊殺的經驗與金幣獎勵直接翻倍。',
    active2: '業配悄悄置入,額外進帳一筆金幣。',
    active3: '熬夜肝出的心得沒有白費,額外進帳一筆經驗值。',
    active4: '一鍵神操作,直接讓下一場戰鬥瞬間結束。',
  },
  magicSupport: {
    passive1: '看診看出來的臨床經驗,經驗值吸收得更快。',
    passive2: '診間累積的人脈,順手多收一點紅包。',
    passive3: '行醫多年悟出的養生之道,吸血跟自動回血效果都會提升。',
    active1: '增幅祝福籠罩全隊,額外進帳一筆金幣。',
    active2: '衛教叮嚀說得仔細,額外進帳一筆經驗值。',
    active3: '手起刀落藥到病除,直接讓下一場戰鬥瞬間結束。',
    active4: '雙倍療效發揮作用,這次擊殺的經驗與金幣獎勵直接翻倍。',
  },
};

// 依目前技能等級,把「每N秒觸發一次+實際效果」或「永久加成」組成一句人看得懂的說明,
// 對應 hooks/useGameState.ts tickBattle() 裡實際套用的效果,不是另一套規則。
export function getSkillSlotBonusDescription(archetype: Archetype, slot: SkillSlotId, level: number): string {
  if (isPassiveSlot(slot)) {
    const kind = getPassiveEffectKind(slot);
    const pct = Math.round(getPassiveBonusValue(level) * 1000) / 10;
    if (kind === 'expMastery') return `永久經驗獲取 +${pct}%`;
    if (kind === 'coinMastery') return `永久金幣獲取 +${pct}%`;
    return `永久吸血+自動回血 +${pct}%`;
  }
  const kind = getActiveEffectKind(archetype, slot);
  // isPassiveSlot(slot) 已經在上面 return 過了,能走到這裡代表 slot 一定是 4 個主動欄位之一。
  const seconds = activeSkillTriggerIntervalSeconds(slot as ActiveSkillSlotId, level);
  if (kind === 'instantFinish') return `每 ${seconds} 秒觸發一次,下一場戰鬥直接瞬間結束`;
  if (kind === 'doubleReward') return `每 ${seconds} 秒觸發一次,這次擊殺的經驗與金幣翻倍`;
  if (kind === 'bonusCoins') return `每 ${seconds} 秒觸發一次,額外獲得 ${getBonusCoinsAmount()} 金幣`;
  return `每 ${seconds} 秒觸發一次,額外獲得 ${getExpBoostAmount()} 經驗`;
}
