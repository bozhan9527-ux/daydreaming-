import { create } from 'zustand';

import {
  ACHIEVEMENTS,
  AchievementProgress,
  evaluateUnlockedAchievementIds,
  getAchievementBonusMultiplier,
} from '../game/achievements';
import {
  ASCENSION_POINTS_PER_CYCLE,
  ascensionUpgradeCost,
  AscensionUpgradeId,
  canUpgradeAscension,
  getAscensionBonusTotal,
  getCycleCount,
} from '../game/ascension';
import { calcKillReward, Encounter, generateEncounter } from '../game/battle';
import {
  canUpgradeCompanionGearSlot,
  COMPANIONS,
  CompanionGearSlot,
  CompanionGearState,
  CompanionKind,
  CompanionState,
  companionGearUpgradeCoinCost,
  createEmptyCompanionGearState,
  createEmptyCompanionState,
  equipCompanion,
  getCompanionBonusTotals,
  getCompanionById,
  getCompanionGearBonusTotals,
  isCompanionUnlocked,
  rollCompanionDrop,
  unequipCompanion,
  unlockCompanion,
} from '../game/companions';
import { Archetype, calcCombatMultiplier, calcSecondaryCombatBonus, canPromoteToTier, canUnlockDualClass, getArchetypeComposition, JobBranch, JobTier, oppositeDamageType, TIER_UNLOCK_LEVELS } from '../game/combat';
import { nextJobTier, promotionMaterialCost } from '../game/jobPromotion';
import {
  applyGenderDefault,
  canCraftGemTier,
  canEquipItem,
  craftGemTier,
  createEmptyGemCounts,
  createEmptyItemInstances,
  createEmptyLoadout,
  createEmptyUnlockedItems,
  ENHANCE_MAX_LEVEL,
  ENHANCE_STONE_PRICE,
  equipItem,
  EquipmentLoadout,
  EQUIPMENT_ITEMS,
  filterLoadoutForJob,
  Gender,
  GEM_SPECS,
  GEM_TYPES,
  GemCounts,
  GemType,
  getEnhanceCoinCost,
  getEnhanceFailChance,
  getEnhanceStoneCost,
  getEquipmentBonusTotalsFull,
  getGenderUnlockItems,
  getIdentifyCost,
  getItemById,
  getRerollCost,
  getSubstatTotals,
  grantGemDrop,
  isItemUnlocked,
  ItemInstances,
  rerollItemSubstats,
  rollEnhanceOutcome,
  rollEnhanceStoneDrop,
  rollEquipmentDrop,
  rollOfflineEquipmentDrops,
  rollGemDrop,
  rollItemInstance,
  SocketedGem,
  unequipSlot,
  unlockItem,
  EquipmentSlot,
  UnlockedItemIds,
} from '../game/equipment';
import { rollCoinWindfall } from '../game/currency';
import {
  applyDungeonDailyReset,
  COIN_DUNGEON_SCHOOL,
  createInitialDungeonState,
  dungeonCoinDropAmount,
  DungeonState,
  dungeonDifficultyMultiplier,
  dungeonExpDropAmount,
  dungeonWinCoinReward,
  ENHANCE_STONE_DUNGEON_REWARD_AMOUNT,
  ENHANCE_STONE_DUNGEON_SCHOOL,
  EXP_DUNGEON_SCHOOL,
  GEM_DUNGEON_REWARD_AMOUNT,
  GEM_DUNGEON_SCHOOL,
  SKILL_BOOK_DUNGEON_REWARD_AMOUNT,
  SKILL_BOOK_DUNGEON_SCHOOL,
  spendDungeonChallenge,
} from '../game/dungeon';
import { applyTransferFragmentGain, rollTransferFragmentDrop, TRANSFER_FRAGMENTS_PER_PROOF, TRANSFER_PROOF_NAMES } from '../game/transfer';
import {
  canClaimDailyQuest,
  canClaimDailyTask,
  DAILY_LOGIN_COIN_BONUS,
  DAILY_LOGIN_EXP_BONUS,
  DAILY_QUEST_COIN_REWARD,
  DAILY_QUEST_ENHANCE_STONE_REWARD,
  DAILY_QUEST_SKILL_BOOK_REWARD,
  DailyTaskId,
  getDailyTaskDef,
  isNewDay,
  todayDateString,
} from '../game/daily';
import { getRandomEvent, GameEvent } from '../game/events';
import { applyHpRegenTick, heroAttackPower, heroMaxHp, RECOVERY_DELAY_MS, resolveFightHealth } from '../game/heroHealth';
import { getActiveLimitedEvent } from '../game/limitedEvent';
import {
  canClaimWeeklyChallenge,
  getWeeklyChallengeDef,
  isNewWeek,
  weekIndex,
  WeeklyStatKey,
} from '../game/weeklyChallenge';
import { accumulateExp, autoLevelUp, calcOfflineExp, createInitialLevelState, LevelState } from '../game/leveling';
import {
  canCraftMaterialTier,
  craftMaterialTier,
  createEmptyTieredMaterialCounts,
  currentMaterialTier,
  MaterialTier,
  TieredMaterialCounts,
} from '../game/materials';
import {
  activeSkillDamageCutRatio,
  activeSkillTriggerIntervalSeconds,
  ACTIVE_SLOT_IDS,
  ActiveSkillLoadout,
  ActiveSkillRef,
  ActiveSkillSlotId,
  canSetLoadoutSlot,
  canUpgradeSkillSlot,
  createInitialActiveSkillLoadout,
  createInitialSkillTreeLevels,
  effectiveSkillLevel,
  enforceLoadoutIdentityCap,
  MAX_BORROWED_ACTIVE_SLOTS,
  getPassiveBonusValue,
  getTierTriggerBonus,
  rollSkillBookDrop,
  secondaryActiveSkillTriggerIntervalSeconds,
  skillBookDropTier,
  SKILL_SLOT_NAMES,
  skillSlotLevelCap,
  skillSlotUpgradeBookCost,
  SkillSlotId,
  SkillTreeLevels,
  TIER5_EXTRA_DAMAGE_CUT_RATIO,
  upgradeSkillSlot as nextSkillSlotLevel,
} from '../game/skillTree';
import { BodyType } from '../game/sprites/heroSilhouette';
import {
  canUpgradeStudentSkillSlot,
  createInitialStudentSkillTreeLevels,
  getStudentSkillFlavor,
  upgradeStudentSkillSlot as nextStudentSkillSlotLevel,
} from '../game/studentSkillTree';
import {
  advanceStageProgress,
  createInitialStageProgress,
  getStageDifficultyMultiplier,
  isBossSubStage,
  isFinalBossStage,
  StageProgress,
} from '../game/stages';
import { bumpPityFromClick, createInitialTriggerState, TriggerState } from '../game/trigger';
import { simulateOfflineStageProgress } from '../game/offlineProgress';
import { clearSave, JobSelection, loadSave, SCHEMA_VERSION, writeSave } from '../lib/storage';
import { playEvent, playLevelUp, playSkillUpgrade, setMusicMuted, setSoundMuted, startMusic } from '../lib/sounds';
import { useToast } from './useToast';

const DEFAULT_JOB: JobSelection = { archetype: 'physicalMelee', branch: 'A' };
const DEFAULT_BODY_TYPE: BodyType = 'normal';
const DEFAULT_GENDER: Gender = 'female';

function unlockedItemsForGender(gender: Gender): UnlockedItemIds {
  return getGenderUnlockItems(gender).reduce(
    (unlocked, itemId) => unlockItem(unlocked, itemId),
    createEmptyUnlockedItems()
  );
}

// 副職(雙職兼修)只吃自己那份倍率超出 1.0 的一半,主職才是數值主力。
// 「學生」期(!hasChosenJob)固定 1.0 倍,不套用 job 目前存的預設職業(那只是畢業前的佔位值,
// 不代表玩家真的選了它)的任何加成。吃 jobTier(玩家實際晉升到的階級)而不是從等級推算,
// 呼應「晉升改成玩家主動觸發」的設計——等級到門檻只是有資格,沒有真的晉升就不會拿到
// 該階級的戰鬥加成。
function currentJobMultiplier(job: JobSelection, tier: JobTier, secondaryJob: Archetype | null, hasChosenJob: boolean): number {
  if (!hasChosenJob) return 1.0;
  const primary = calcCombatMultiplier(job.archetype, tier);
  const secondaryBonus = secondaryJob ? calcSecondaryCombatBonus(secondaryJob, tier) : 0;
  return primary + secondaryBonus;
}

interface ActiveSkillTriggerResult {
  timers: Record<ActiveSkillSlotId, number>;
  // 削減「當前這場戰鬥」剩餘時間的比例(見 hooks/useGameState.ts 的 tickBattle 說明),
  // 不是修改擊殺獎勵——4個主動技能全部是「造成傷害」,不再碰 exp/coins。
  cutRatio: number;
  triggeredSlot: ActiveSkillSlotId | null;
}

// 技能書/強化石分階制(見 game/materials.ts):所有既有掉落/獎勵管道(擊殺掉落、商店購買、
// 每日任務、週期挑戰、成就)一律只發初階(tier 0),呼應「維持現有掉落機制」的既有設計決定——
// 更高階只能靠玩家自己合成(見 craftSkillBooks/craftEnhanceStones action)。這裡統一寫成小函式,
// 避免每個發放點各自手刻「初階+N、其餘階級原樣」的物件展開。
function grantBasicMaterial(counts: TieredMaterialCounts, amount: number): TieredMaterialCounts {
  if (amount === 0) return counts;
  return { ...counts, 0: counts[0] + amount };
}

// 技能書掉落依職業階級分配(見 game/skillTree.ts 的 skillBookDropTier),不是一律給初階,
// 所以要能發到任意指定的階級,不能沿用只發初階的 grantBasicMaterial。
function grantMaterialAtTier(counts: TieredMaterialCounts, tier: MaterialTier, amount: number): TieredMaterialCounts {
  if (amount === 0) return counts;
  return { ...counts, [tier]: counts[tier] + amount };
}

// 消耗指定階級的材料(升級技能/強化裝備用)——呼叫端自己先用 currentMaterialTier() 算出
// 「目前職業階級對應哪一階」,這個函式只單純做扣除,不重複算階級判斷邏輯。
function spendMaterialAtTier(counts: TieredMaterialCounts, tier: MaterialTier, amount: number): TieredMaterialCounts {
  return { ...counts, [tier]: counts[tier] - amount };
}

// 主動技能觸發判定共用邏輯:職業技能樹跟學生技能樹畢業後永久並存(各自獨立計時器),
// 這個函式抽出來讓 tickBattle 對兩邊各呼叫一次,避免同一段判定寫兩份。
// 主動技能欄自選(見 game/skillTree.ts 的 ActiveSkillLoadout):4個位置各自透過 loadout 指到
// 「某個職業、某個主動格」的技能,不再固定等於目前職業自己的active1-4。這裡把 loadout 攤平成
// applyActiveSkillTriggers 原本就吃的 Record<ActiveSkillSlotId, number> 形狀——空位(null)直接
// 給0級,跟既有的 Lv.0 gating(見該函式內的 slotLevels[slot]<=0 continue)完全共用同一套「不
// 參與倒數、不能觸發」邏輯,不用另外寫一套「空欄位」的特殊處理。
// 借用格的等級一樣吃「累加全部已投資階級」的有效等級,tier 一律用玩家目前的全局職業階級
// (jobTree 不分職業各自記階級,見 SaveData.jobTier 的欄位註解)——借來的技能要維持有效,
// 該職業在這一階也要有投資,不是只看曾經練過哪個archetype就一路吃到底。
function resolveLoadoutLevels(loadout: ActiveSkillLoadout, skillTree: SkillTreeLevels, tier: JobTier): Record<ActiveSkillSlotId, number> {
  const levels = {} as Record<ActiveSkillSlotId, number>;
  ACTIVE_SLOT_IDS.forEach((slot) => {
    const ref = loadout[slot];
    levels[slot] = ref ? effectiveSkillLevel(skillTree[ref.archetype], tier, ref.sourceSlot) : 0;
  });
  return levels;
}

// 全自動:冷卻好了就在下次擊殺結算直接生效,不需要玩家手動點擊觸發。4個主動技能欄現在
// 全部是「造成傷害」(見 game/skillTree.ts 的 activeSkillDamageCutRatio),傷害量只吃
// 「觸發的是哪一欄位+那一欄位的等級」,不用再像舊版那樣另外查一次「這欄位是哪種效果」。
function applyActiveSkillTriggers(
  slotLevels: Record<ActiveSkillSlotId, number>,
  timers: Record<ActiveSkillSlotId, number>,
  now: number,
  cutRatio: number
): ActiveSkillTriggerResult {
  const nextTimers = { ...timers };
  let triggeredSlot: ActiveSkillSlotId | null = null;
  for (const slot of ACTIVE_SLOT_IDS) {
    if (slotLevels[slot] <= 0) continue;
    const intervalMs = activeSkillTriggerIntervalSeconds(slot, slotLevels[slot]) * 1000;
    if (now - timers[slot] < intervalMs) continue;
    nextTimers[slot] = now;
    cutRatio += activeSkillDamageCutRatio(slot, slotLevels[slot]);
    triggeredSlot = slot;
  }
  return { timers: nextTimers, cutRatio, triggeredSlot };
}

interface RewardMultipliers {
  expMultiplier: number;
  coinMultiplier: number;
  speedMultiplier: number;
}

// 職業倍率只影響經驗;裝備(含強化+鑲嵌寶石)、寵物/坐騎、被動技能的 exp/coins/speed 加成
// 疊加在職業倍率之上。畢業前投資的學生技能樹不會因為選定主職而失效——學生被動加成永久
// 疊加在(如果已經畢業)主職被動加成之上,呼應畢業後仍可持續花書升級學生技能的設計。
function computePassiveSkillBonus(
  job: JobSelection,
  tier: JobTier,
  skillTree: SkillTreeLevels,
  studentSkillTree: Record<SkillSlotId, number>,
  hasChosenJob: boolean
): { exp: number; coins: number } {
  const studentBonus = {
    exp: getPassiveBonusValue(studentSkillTree.passive1),
    coins: getPassiveBonusValue(studentSkillTree.passive2),
  };
  if (!hasChosenJob) return studentBonus;
  // 被動加成吃「累加全部已投資階級」的有效等級(見 effectiveSkillLevel),不是只看目前
  // 這一階自己的數字——1階練滿之後升到2階,1階的投資依然疊加在角色的被動加成上。
  const jobArchetypeLevels = skillTree[job.archetype];
  return {
    exp: studentBonus.exp + getPassiveBonusValue(effectiveSkillLevel(jobArchetypeLevels, tier, 'passive1')),
    coins: studentBonus.coins + getPassiveBonusValue(effectiveSkillLevel(jobArchetypeLevels, tier, 'passive2')),
  };
}

function computeRewardMultipliers(
  job: JobSelection,
  tier: JobTier,
  equipment: EquipmentLoadout,
  companions: CompanionState,
  companionGear: CompanionGearState,
  secondaryJob: Archetype | null,
  itemInstances: ItemInstances,
  skillTree: SkillTreeLevels,
  studentSkillTree: Record<SkillSlotId, number>,
  hasChosenJob: boolean,
  ascensionUpgrades: Partial<Record<AscensionUpgradeId, number>>,
  claimedAchievementIds: string[]
): RewardMultipliers {
  const jobMultiplier = currentJobMultiplier(job, tier, secondaryJob, hasChosenJob);
  const equipmentBonus = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const companionBonus = getCompanionBonusTotals(companions);
  const companionGearBonus = getCompanionGearBonusTotals(companionGear);
  const passiveBonus = computePassiveSkillBonus(job, tier, skillTree, studentSkillTree, hasChosenJob);
  // 輪迴/轉生加成(見 game/ascension.ts):永久疊加在所有其他加成之上,不受裝備/寵物坐騎
  // 更換影響,是唯一不會因為玩家調整build而變動的加成來源。
  const ascensionExp = getAscensionBonusTotal('exp', ascensionUpgrades);
  const ascensionCoins = getAscensionBonusTotal('coins', ascensionUpgrades);
  const ascensionSpeed = getAscensionBonusTotal('speed', ascensionUpgrades);
  // 成就永久加成(見 game/achievements.ts):領過的成就數就是全部,一樣不受裝備/寵物坐騎
  // 更換影響——只加經驗/金幣,不加速度,呼應成就本身「累積成長」而非「戰鬥效率」的定位。
  const achievementBonus = getAchievementBonusMultiplier(claimedAchievementIds.length);
  // 限時活動(見 game/limitedEvent.ts):純粹是「今天星期幾」算出來的固定加成,不存檔、
  // 不用跟伺服器同步,呼叫端不用管活動有沒有在進行,這裡直接算好疊加上去就好。
  const activeEvent = getActiveLimitedEvent();
  const eventExpBonus = activeEvent?.stat === 'exp' ? activeEvent.bonus : 0;
  const eventCoinBonus = activeEvent?.stat === 'coins' ? activeEvent.bonus : 0;
  const eventSpeedBonus = activeEvent?.stat === 'speed' ? activeEvent.bonus : 0;
  return {
    expMultiplier:
      jobMultiplier *
      (1 +
        equipmentBonus.exp +
        companionBonus.exp +
        companionGearBonus.exp +
        passiveBonus.exp +
        ascensionExp +
        achievementBonus +
        eventExpBonus),
    coinMultiplier:
      1 +
      equipmentBonus.coins +
      companionBonus.coins +
      companionGearBonus.coins +
      passiveBonus.coins +
      ascensionCoins +
      achievementBonus +
      eventCoinBonus,
    speedMultiplier:
      1 + equipmentBonus.speed + companionBonus.speed + companionGearBonus.speed + ascensionSpeed + eventSpeedBonus,
  };
}

// 某件裝備第一次被玩家擁有(購買/裝備)時才擲隨機/隱藏素質,擲過就固定下來,不會重擲。
function ensureItemInstance(itemId: string, instances: ItemInstances): ItemInstances {
  if (instances[itemId]) return instances;
  const item = getItemById(itemId);
  if (!item) return instances;
  return { ...instances, [itemId]: rollItemInstance(item) };
}

// 存檔遷移到 v12 之前就已經擁有的裝備(不論免費起始款或已解鎖付費款)在這裡補齊素質,
// 不用等玩家重新裝備一次才生效。
function backfillItemInstances(itemIds: string[], instances: ItemInstances): ItemInstances {
  return itemIds.reduce((acc, id) => ensureItemInstance(id, acc), instances);
}

interface GameState {
  isLoaded: boolean;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  // 職業階級(見 game/combat.ts 的 JobTier):不再是 getCurrentTier(level.level) 純推算值,
  // 玩家自己觸發晉升(見 promoteJobTier action)才會提升——等級到 TIER_UNLOCK_LEVELS[tier]
  // 只代表「有資格挑戰晉升試煉」,不代表已經晉升。
  jobTier: JobTier;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skillTree: SkillTreeLevels;
  // 主動技能欄自選配置(見 game/skillTree.ts 的 ActiveSkillLoadout):4個位置各自指到某個
  // 已投資過等級的職業主動技能(archetype+sourceSlot),不限於目前職業自己的active1-4。
  activeSkillLoadout: ActiveSkillLoadout;
  // 「學生」期(!hasChosenJob)專屬技能樹(見 game/studentSkillTree.ts):獨立於 skillTree
  // 之外,只有一套 6 格,不分職業。
  studentSkillTree: Record<SkillSlotId, number>;
  gender: Gender;
  coins: number;
  unlockedItemIds: UnlockedItemIds;
  companions: CompanionState;
  // 寵物/坐騎專屬裝備(見 game/companions.ts):綁在 pet/mount 身分上,不是綁在特定寵物身上。
  companionGear: CompanionGearState;
  // 轉職試煉副本(見 game/dungeon.ts):6分頁各自獨立每日次數,打贏保證掉指定職業的轉職碎片。
  dungeon: DungeonState;
  secondaryJob: Archetype | null;
  itemInstances: ItemInstances;
  // 強化石(見 game/materials.ts 的 TieredMaterialCounts):分階制,初階+一階~五階共6階,
  // 呼應職業轉職階級——升級/強化「需要哪一階」直接對應目前職業階級,不對應技能等級本身。
  enhanceStones: TieredMaterialCounts;
  gemCounts: GemCounts;
  // 技能書(見 game/skillTree.ts):技能升級改吃的獨立資源,不再跟角色升等搶銀行經驗值;
  // 分階規則跟 enhanceStones 完全一樣。
  skillBooks: TieredMaterialCounts;
  stageProgress: StageProgress;
  // 這輩子總共清了幾個大關(每破一次魔王就 +1),永不隨 stageProgress 輪迴繞圈歸零——
  // 3000 關里程碑成就(見 game/achievements.ts 的 'stage' 分類)靠這個數字判定,不能直接看
  // stageProgress.stage,因為破完第300大關後 stageProgress 會繞回第1關,這個欄位不會。
  totalStagesCleared: number;
  // 輪迴/轉生系統(見 game/ascension.ts):破完一整輪 3000 關拿到的可花費點數,
  // ascensionUpgrades 是永久加成樹各節點目前等級。第幾輪不存檔,直接用 totalStagesCleared 算。
  ascensionPoints: number;
  ascensionUpgrades: Partial<Record<AscensionUpgradeId, number>>;
  // 週期成就輪替(見 game/weeklyChallenge.ts):weeklyChallengeWeekIndex 是上次重置對應的週序號,
  // weeklyChallengeProgress/weeklyChallengeClaimedIds 跟 dailyTaskProgress/dailyTaskClaimedIds
  // 同一套模式,只是週期換成一週而不是一天。
  weeklyChallengeWeekIndex: number;
  weeklyChallengeProgress: Partial<Record<WeeklyStatKey, number>>;
  weeklyChallengeClaimedIds: string[];
  // 每日內容:見 game/daily.ts。lastDailyLoginBonus 不存檔,只給 UI 顯示一次性登入獎勵彈窗用。
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  // 任務池另外 4 項每日任務(見 game/daily.ts 的 DAILY_TASKS),跟上面兩個欄位一樣跨日歸零。
  dailyTaskProgress: Partial<Record<DailyTaskId, number>>;
  dailyTaskClaimedIds: DailyTaskId[];
  // 轉職碎片/證明:見 game/transfer.ts。lastTransferFragmentArchetype 不存檔,只給 UI 顯示這次
  // 掉落通知用,跟 lastCompanionDropId/lastEquipmentDropId/lastCoinWindfall 同一套模式。
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  // 學生身份(見 game/leveling.ts):false=Lv1-29學生期,尚未套用任何職業戰鬥加成、技能分頁
  // 鎖定;true=Lv30畢業已選定主職。
  hasChosenJob: boolean;
  // 成就系統(見 game/achievements.ts):unlockedAchievementIds 是「條件已達成」成就 id 的持久化
  // 清單。v26 起改成手動領取制,獎勵不再隨條件達成自動發放——claimedAchievementIds 是「已經按過
  // 領取按鈕、拿到獎勵」的 id 清單,unlockedAchievementIds 減去 claimedAchievementIds 就是玩家
  // 在成就圖示(見 AchievementBadge.tsx)看到的「待領取」清單。
  // hasEverAssembledTransferProof/hasEverSwitchedJob 是給轉職類成就用的一次性旗標,設為 true
  // 後永不重置(轉職證明會被 setJob 消耗,單看當下數值看不出「有沒有發生過」)。
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  lastDailyLoginBonus: { coins: number; exp: number } | null;
  lastEnhanceOutcome: string | null;
  lastOfflineGain: number;
  lastOfflineKills: number;
  lastOfflineCoins: number;
  lastOfflineEnhanceStones: number;
  lastOfflineSkillBooks: number;
  lastOfflineGems: number;
  lastOfflineEquipmentCount: number;
  currentEncounter: Encounter | null;
  fightStartedAt: number | null;
  fightElapsedMs: number;
  heroClicksThisFight: number;
  killCount: number;
  // 勇者血量/戰敗風險系統(見 game/heroHealth.ts):heroHp 是這場戰鬥開始「前」的血量,
  // defeatRecoveryUntil 是戰敗倒地恢復到什麼時間戳(null = 沒有在恢復中)。
  heroHp: number;
  defeatRecoveryUntil: number | null;
  // 回血(hpRegen,見 game/heroHealth.ts 的 applyHpRegenTick):上一次時間推進 tick 的基準時間戳,
  // 跟 activeSkillTimers 那組「不存檔、重開就重算」的計時器不同——這個要存檔,不然每次重開
  // App 都會被視為「剛好經過一個新的起算點」,離線期間累積的回血 tick 會憑空消失或重算錯誤。
  lastHpRegenTickAt: number;
  lastEvent: GameEvent | null;
  lastCompanionDropId: string | null;
  lastEquipmentDropId: string | null;
  lastCoinWindfall: number | null;
  lastTransferFragmentArchetype: Archetype | null;
  // 4 個主動技能欄位各自的倒數計時器起始時間戳(不存檔,重開只是倒數重新開始算)——
  // 用 Date.now() - activeSkillTimers[slot] 對比 activeSkillTriggerIntervalSeconds() 的毫秒數判斷是否觸發。
  activeSkillTimers: Record<ActiveSkillSlotId, number>;
  // 學生主動技能畢業後永久跟職業主動技能並存,用獨立一組計時器(同樣不存檔),
  // 避免兩邊互搶同一個倒數。
  studentActiveSkillTimers: Record<ActiveSkillSlotId, number>;
  secondarySkillTimerStartedAt: number;
  // 技能剛觸發的時間戳,不存檔,只給 UI 顯示「剛發動」的短暫閃光用,跟 lastEnhanceOutcome 同一套模式。
  lastSkillTriggerAt: number | null;
  lastSecondarySkillTriggerAt: number | null;
  // 剛觸發的是「哪個職業的哪一格」技能,不存檔,純粹給 BattleScene.tsx 挑選對應招式圖示的
  // 攻擊特效動畫用——跟上面兩個時間戳分開存,因為時間戳只需要知道「有沒有剛觸發」,
  // 這個額外記住「觸發的到底是哪一招」才挑得出正確圖示。
  lastTriggeredSkillIcon: { archetype: Archetype; slot: ActiveSkillSlotId } | null;
  // 設定(見 components/SettingsModal.tsx):soundMuted 是音效總開關,hasSeenWelcome 是
  // 新手歡迎彈窗是否已經看過/關閉——兩者都要存檔,不然每次重開 App 都要重新關一次音效/
  // 重新看一次歡迎畫面。
  soundMuted: boolean;
  hasSeenWelcome: boolean;
  // 背景音樂總開關(見 lib/sounds.ts 的 startMusic/setMusicMuted),獨立於上面的音效開關。
  musicMuted: boolean;
  load: () => Promise<void>;
  toggleSound: () => void;
  toggleMusic: () => void;
  dismissWelcome: () => void;
  resetSave: () => Promise<void>;
  tickBattle: () => void;
  boostCurrentFight: () => void;
  setJob: (archetype: Archetype, branch: JobBranch) => void;
  challengeDungeon: (archetype: Archetype) => void;
  challengeSkillBookDungeon: (tier: MaterialTier) => void;
  challengeEnhanceStoneDungeon: () => void;
  challengeGemDungeon: (gemType: GemType) => void;
  challengeExpDungeon: () => void;
  challengeCoinDungeon: () => void;
  promoteJobTier: () => void;
  setSecondaryJob: (archetype: Archetype | null) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
  purchaseItem: (itemId: string) => void;
  setBodyType: (bodyType: BodyType) => void;
  upgradeSkillSlot: (archetype: Archetype, tier: JobTier, slot: SkillSlotId) => void;
  upgradeStudentSkillSlot: (slot: SkillSlotId) => void;
  // 批量升級:技能書存夠的話一次把這格衝到當前存量能到的最高等級(或封頂),不用一級一級
  // 手動點——呼應「批量升級改善」的需求,單次點擊、單次persist,不是在UI層迴圈呼叫單級版本。
  upgradeSkillSlotMax: (archetype: Archetype, tier: JobTier, slot: SkillSlotId) => void;
  upgradeStudentSkillSlotMax: (slot: SkillSlotId) => void;
  setGender: (gender: Gender) => void;
  purchaseCompanion: (id: string) => void;
  unequipCompanionSlot: (kind: CompanionKind) => void;
  upgradeCompanionGearSlot: (kind: CompanionKind, slot: CompanionGearSlot) => void;
  identifyItem: (itemId: string) => void;
  rerollEquipmentSubstats: (itemId: string) => void;
  enhanceItem: (itemId: string) => void;
  purchaseEnhanceStone: () => void;
  // 分階合成(見 game/materials.ts):兩本前一階換一本下一階,tier 是要合成出來的目標階級
  // (1~5,不能傳0——初階沒有更低階可以合成)。
  craftSkillBookTier: (tier: MaterialTier) => void;
  craftEnhanceStoneTier: (tier: MaterialTier) => void;
  purchaseGem: (gemType: GemType) => void;
  craftGemTier: (gemType: GemType, tier: MaterialTier) => void;
  socketGem: (itemId: string, socketIndex: number, gemType: GemType, tier: MaterialTier) => void;
  unsocketGem: (itemId: string, socketIndex: number) => void;
  claimDailyQuest: () => void;
  claimDailyTask: (id: DailyTaskId) => void;
  claimWeeklyChallenge: (id: string) => void;
  upgradeAscension: (id: AscensionUpgradeId) => void;
  claimAchievement: (id: string) => void;
  claimAllAchievements: () => void;
  // 主動技能欄自選(見 game/skillTree.ts 的 ActiveSkillLoadout):position 是首頁4個固定位置
  // 之一,ref=null 代表把這格清空。只能指到「已經投資過等級(>0)」的職業主動技能,防呆檢查
  // 在 action 內部做,UI 端(SkillLoadoutEditor.tsx)本來就只會列出已學過的選項可選。
  setActiveSkillLoadout: (position: ActiveSkillSlotId, ref: ActiveSkillRef | null) => void;
}

type PersistableState = Pick<
  GameState,
  | 'level'
  | 'trigger'
  | 'job'
  | 'jobTier'
  | 'equipment'
  | 'bodyType'
  | 'skillTree'
  | 'activeSkillLoadout'
  | 'studentSkillTree'
  | 'gender'
  | 'coins'
  | 'unlockedItemIds'
  | 'companions'
  | 'companionGear'
  | 'dungeon'
  | 'secondaryJob'
  | 'itemInstances'
  | 'enhanceStones'
  | 'gemCounts'
  | 'skillBooks'
  | 'stageProgress'
  | 'totalStagesCleared'
  | 'ascensionPoints'
  | 'ascensionUpgrades'
  | 'weeklyChallengeWeekIndex'
  | 'weeklyChallengeProgress'
  | 'weeklyChallengeClaimedIds'
  | 'lastDailyResetAt'
  | 'dailyKillCount'
  | 'dailyQuestClaimed'
  | 'dailyTaskProgress'
  | 'dailyTaskClaimedIds'
  | 'transferFragments'
  | 'transferProofs'
  | 'hasChosenJob'
  | 'unlockedAchievementIds'
  | 'claimedAchievementIds'
  | 'hasEverAssembledTransferProof'
  | 'hasEverSwitchedJob'
  | 'killCount'
  | 'heroHp'
  | 'defeatRecoveryUntil'
  | 'lastHpRegenTickAt'
  | 'soundMuted'
  | 'hasSeenWelcome'
  | 'musicMuted'
>;

function persist(state: PersistableState): void {
  writeSave({
    version: SCHEMA_VERSION,
    level: state.level,
    trigger: state.trigger,
    job: state.job,
    jobTier: state.jobTier,
    equipment: state.equipment,
    bodyType: state.bodyType,
    skillTree: state.skillTree,
    activeSkillLoadout: state.activeSkillLoadout,
    studentSkillTree: state.studentSkillTree,
    gender: state.gender,
    coins: state.coins,
    unlockedItemIds: state.unlockedItemIds,
    companions: state.companions,
    companionGear: state.companionGear,
    dungeon: state.dungeon,
    secondaryJob: state.secondaryJob,
    itemInstances: state.itemInstances,
    enhanceStones: state.enhanceStones,
    gemCounts: state.gemCounts,
    skillBooks: state.skillBooks,
    stageProgress: state.stageProgress,
    totalStagesCleared: state.totalStagesCleared,
    ascensionPoints: state.ascensionPoints,
    ascensionUpgrades: state.ascensionUpgrades,
    weeklyChallengeWeekIndex: state.weeklyChallengeWeekIndex,
    weeklyChallengeProgress: state.weeklyChallengeProgress,
    weeklyChallengeClaimedIds: state.weeklyChallengeClaimedIds,
    lastDailyResetAt: state.lastDailyResetAt,
    dailyKillCount: state.dailyKillCount,
    dailyQuestClaimed: state.dailyQuestClaimed,
    dailyTaskProgress: state.dailyTaskProgress,
    dailyTaskClaimedIds: state.dailyTaskClaimedIds,
    transferFragments: state.transferFragments,
    transferProofs: state.transferProofs,
    hasChosenJob: state.hasChosenJob,
    unlockedAchievementIds: state.unlockedAchievementIds,
    claimedAchievementIds: state.claimedAchievementIds,
    hasEverAssembledTransferProof: state.hasEverAssembledTransferProof,
    hasEverSwitchedJob: state.hasEverSwitchedJob,
    killCount: state.killCount,
    heroHp: state.heroHp,
    defeatRecoveryUntil: state.defeatRecoveryUntil,
    lastHpRegenTickAt: state.lastHpRegenTickAt,
    lastActiveAt: Date.now(),
    soundMuted: state.soundMuted,
    hasSeenWelcome: state.hasSeenWelcome,
    musicMuted: state.musicMuted,
  });
}

// 從即時遊戲狀態算出成就系統要的那份扁平快照(見 game/achievements.ts 的 AchievementProgress),
// 純粹讀取不修改,方便 checkAndUnlockAchievements 每次呼叫都重新算一份最新的;
// 額外 export 出去給 components/AchievementPanel.tsx 算「locked 項目的進度條」用,同一套邏輯不重複。
export function computeAchievementProgress(state: {
  killCount: number;
  level: LevelState;
  unlockedItemIds: UnlockedItemIds;
  itemInstances: ItemInstances;
  companions: CompanionState;
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  totalStagesCleared: number;
}): AchievementProgress {
  const paidItems = EQUIPMENT_ITEMS.filter((item) => item.price > 0);
  const unlockedPaidItemCount = paidItems.filter((item) => state.unlockedItemIds.includes(item.id)).length;
  const maxEnhanceLevel = Math.max(0, ...Object.values(state.itemInstances).map((instance) => instance.enhanceLevel));
  const hasFullySocketedItem = Object.values(state.itemInstances).some(
    (instance) => instance.socketedGems.length > 0 && instance.socketedGems.every((gem) => gem !== null)
  );

  return {
    killCount: state.killCount,
    level: state.level.level,
    unlockedPaidItemCount,
    totalPaidItemCount: paidItems.length,
    maxEnhanceLevel,
    hasFullySocketedItem,
    companionUnlockedCount: state.companions.unlockedIds.length,
    totalCompanionCount: COMPANIONS.length,
    hasAssembledTransferProof: state.hasEverAssembledTransferProof,
    hasSwitchedJobOnce: state.hasEverSwitchedJob,
    totalStagesCleared: state.totalStagesCleared,
  };
}

// 任務池 4 項每日任務的共用進度遞增 helper(見 game/daily.ts 的 DAILY_TASKS),避免 4 個
// 呼叫端(identifyItem/enhanceItem/challengeDungeon/upgradeCompanionGearSlot)各自手刻同一段
// 「讀目前進度、+1、寫回」邏輯——單純遞增,不做上限判斷(達標與否交給 canClaimDailyTask 比對)。
function incrementDailyTaskProgress(
  progress: Partial<Record<DailyTaskId, number>>,
  id: DailyTaskId
): Partial<Record<DailyTaskId, number>> {
  return { ...progress, [id]: (progress[id] ?? 0) + 1 };
}

// 週期成就輪替(見 game/weeklyChallenge.ts)的共用進度遞增 helper,跟上面 incrementDailyTaskProgress
// 同一套模式——刻意重用 5 個每日任務池已經在追蹤的活動類型(kills/identify/dungeon/enhance/
// companionGear),所以每個呼叫端在原本 incrementDailyTaskProgress 旁邊多呼叫這個一次就好,
// 不用新增額外的偵測邏輯。
function incrementWeeklyChallengeProgress(
  progress: Partial<Record<WeeklyStatKey, number>>,
  key: WeeklyStatKey
): Partial<Record<WeeklyStatKey, number>> {
  return { ...progress, [key]: (progress[key] ?? 0) + 1 };
}

// 成就偵測的共用入口:每次呼叫都是全量重新計算(見 evaluateUnlockedAchievementIds 的註解),
// 跟已持久化的 unlockedAchievementIds 做 diff 找出「這次新達成」的項目,更新 unlockedAchievementIds
// 並跳 toast 提示。v26 起改成手動領取制,這裡只負責「偵測條件達成」,不再自動發獎勵——
// 獎勵改由玩家在成就圖示按「領取」觸發(見 claimAchievement/claimAllAchievements),避免玩家
// 沒注意到就被動拿走獎勵。刻意不在這裡呼叫 persist(get())——呼叫端每個 mutation 本來就會在
// 自己的 set() 後面接一次 persist(get()),這裡的 set() 只要發生在那之前,新達成清單就會被
// 一起存進去。
function checkAndUnlockAchievements(get: () => GameState, set: (partial: Partial<GameState>) => void): void {
  const state = get();
  const progress = computeAchievementProgress(state);
  const unlockedNow = evaluateUnlockedAchievementIds(progress);
  const newlyUnlocked = unlockedNow.filter((id) => !state.unlockedAchievementIds.includes(id));
  if (newlyUnlocked.length === 0) return;

  set({
    unlockedAchievementIds: [...state.unlockedAchievementIds, ...newlyUnlocked],
  });

  if (newlyUnlocked.length > 1) {
    useToast.getState().show(`達成了 ${newlyUnlocked.length} 個成就(可到成就圖示領取獎勵)`);
  } else {
    const def = ACHIEVEMENTS[newlyUnlocked[0]];
    useToast.getState().show(`達成成就:${def.title}(可到成就圖示領取獎勵)`);
  }
}

export const useGameState = create<GameState>((set, get) => ({
  isLoaded: false,
  level: createInitialLevelState(),
  trigger: createInitialTriggerState(),
  job: DEFAULT_JOB,
  jobTier: 1,
  equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
  bodyType: DEFAULT_BODY_TYPE,
  skillTree: createInitialSkillTreeLevels(),
  activeSkillLoadout: createInitialActiveSkillLoadout(DEFAULT_JOB.archetype),
  studentSkillTree: createInitialStudentSkillTreeLevels(),
  gender: DEFAULT_GENDER,
  coins: 0,
  unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
  companions: createEmptyCompanionState(),
  companionGear: createEmptyCompanionGearState(),
  dungeon: createInitialDungeonState(),
  secondaryJob: null,
  itemInstances: createEmptyItemInstances(),
  enhanceStones: createEmptyTieredMaterialCounts(),
  gemCounts: createEmptyGemCounts(),
  skillBooks: createEmptyTieredMaterialCounts(),
  stageProgress: createInitialStageProgress(),
  totalStagesCleared: 0,
  ascensionPoints: 0,
  ascensionUpgrades: {},
  weeklyChallengeWeekIndex: weekIndex(),
  weeklyChallengeProgress: {},
  weeklyChallengeClaimedIds: [],
  lastDailyResetAt: '',
  dailyKillCount: 0,
  dailyQuestClaimed: false,
  dailyTaskProgress: {},
  dailyTaskClaimedIds: [],
  transferFragments: {},
  transferProofs: {},
  hasChosenJob: false,
  unlockedAchievementIds: [],
  claimedAchievementIds: [],
  hasEverAssembledTransferProof: false,
  hasEverSwitchedJob: false,
  lastDailyLoginBonus: null,
  lastEnhanceOutcome: null,
  lastOfflineGain: 0,
  lastOfflineKills: 0,
  lastOfflineCoins: 0,
  lastOfflineEnhanceStones: 0,
  lastOfflineSkillBooks: 0,
  lastOfflineGems: 0,
  lastOfflineEquipmentCount: 0,
  currentEncounter: null,
  fightStartedAt: null,
  fightElapsedMs: 0,
  heroClicksThisFight: 0,
  killCount: 0,
  heroHp: heroMaxHp(1),
  defeatRecoveryUntil: null,
  lastHpRegenTickAt: Date.now(),
  lastEvent: null,
  lastCompanionDropId: null,
  lastEquipmentDropId: null,
  lastCoinWindfall: null,
  lastTransferFragmentArchetype: null,
  activeSkillTimers: { active1: Date.now(), active2: Date.now(), active3: Date.now(), active4: Date.now() },
  studentActiveSkillTimers: { active1: Date.now(), active2: Date.now(), active3: Date.now(), active4: Date.now() },
  secondarySkillTimerStartedAt: Date.now(),
  lastSkillTriggerAt: null,
  lastSecondarySkillTriggerAt: null,
  lastTriggeredSkillIcon: null,
  soundMuted: false,
  hasSeenWelcome: false,
  musicMuted: false,

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    // 轉生加成樹的「恆常離線效率」節點(見 game/ascension.ts 的 offlineCap)延長預設24小時的
    // 離線收益結算上限,offlineCapBonusHours 直接是「小時」數(不是百分比,不用像 exp/coins/
    // speed 那樣乘進 computeRewardMultipliers)。
    const offlineCapHours = 24 + getAscensionBonusTotal('offlineCap', save.ascensionUpgrades);
    const baseGain = calcOfflineExp(save.level.level, elapsedMs, offlineCapHours);

    // 補齊舊存檔(v11 以前)已經擁有的裝備(含免費起始款,免費款不會出現在 unlockedItemIds 裡)
    // 的隨機/隱藏素質,不用等玩家重新裝備一次才生效。
    const ownedItemIds = [...save.unlockedItemIds, ...Object.values(save.equipment).filter((id): id is string => !!id)];
    const itemInstances = backfillItemInstances(ownedItemIds, save.itemInstances);

    const { expMultiplier, coinMultiplier, speedMultiplier } = computeRewardMultipliers(
      save.job,
      save.jobTier,
      save.equipment,
      save.companions,
      save.companionGear,
      save.secondaryJob,
      itemInstances,
      save.skillTree,
      save.studentSkillTree,
      save.hasChosenJob,
      save.ascensionUpgrades,
      save.claimedAchievementIds
    );
    const gainedExp = Math.floor(baseGain * expMultiplier);

    // 每日內容:跨日(用UTC日期字串比對)才重置每日任務進度+領一次登入獎勵,固定小額,
    // 不隨等級縮放,是「歡迎回來」的心意,不會變成新的主要收入來源。
    const newDay = isNewDay(save.lastDailyResetAt);
    const dailyLoginBonus = newDay ? { coins: DAILY_LOGIN_COIN_BONUS, exp: DAILY_LOGIN_EXP_BONUS } : null;
    // 離線累積的經驗值也立刻自動兌換等級(跟 tickBattle 同一套 autoLevelUp),不會變成
    // 玩家一開遊戲就要先手動點按鈕清空的一大包銀行經驗值。
    const level = autoLevelUp(accumulateExp(save.level, gainedExp + (dailyLoginBonus?.exp ?? 0))).state;

    // 週期成就輪替(見 game/weeklyChallenge.ts):跨週才重置進度+已領取清單,同一套「跨日重置」
    // 的精神換成一週為單位——沒有登入獎勵這種一次性彈窗,純粹是進度池歸零+換一組新的3條挑戰。
    const newWeek = isNewWeek(save.weeklyChallengeWeekIndex);

    // 背景/關閉期間沒有畫面可以真的打怪,離線期間用「平均稀有度」怪物血量反推大概擊敗幾隻、
    // 真的推進關卡進度(見 game/offlineProgress.ts)——跟前景同一套裝備/寵物加成,攻擊力用
    // 離線前的裝備/等級快照計算;跟 exp 一樣被 offlineCapHours 上限夾住,避免長時間沒開的
    // 存檔一次推進到不合理的關卡數。
    const substatTotals = getSubstatTotals(save.equipment, itemInstances);
    const heroSchool = getArchetypeComposition(save.job.archetype).damageType;
    const offlineAttackPower = heroAttackPower(
      save.level.level,
      save.jobTier,
      heroSchool === 'physical' ? substatTotals.physicalAttack : substatTotals.magicAttack
    );
    const cappedOfflineMs = Math.min(elapsedMs, offlineCapHours * 60 * 60 * 1000);
    const offlineStageResult = simulateOfflineStageProgress(
      cappedOfflineMs,
      save.stageProgress,
      save.totalStagesCleared,
      save.killCount,
      offlineAttackPower,
      speedMultiplier,
      coinMultiplier,
      ASCENSION_POINTS_PER_CYCLE
    );
    const coins = save.coins + offlineStageResult.coins + (dailyLoginBonus?.coins ?? 0);

    // 離線期間的強化石/技能書/寶石掉落(見 game/offlineProgress.ts 的期望值計算),套用方式
    // 跟前景 tickBattle 掉落到帳的寫法一致。技能書的階級用離線前的快照算一次(整段離線期間
    // 技能等級不會變動,不用像前景那樣逐次擊殺各自判定),整批都算同一階。
    const nextEnhanceStones = grantBasicMaterial(save.enhanceStones, offlineStageResult.enhanceStonesGained);
    const nextSkillBooks = grantMaterialAtTier(
      save.skillBooks,
      skillBookDropTier(save.hasChosenJob, save.jobTier, save.skillTree[save.job.archetype][save.jobTier]),
      offlineStageResult.skillBooksGained
    );
    const nextGemCounts: GemCounts = { ...save.gemCounts };
    for (const gemType of GEM_TYPES) {
      const amount = offlineStageResult.gemsGained[gemType];
      if (amount) nextGemCounts[gemType] = { ...nextGemCounts[gemType], 0: nextGemCounts[gemType][0] + amount };
    }

    // 離線期間的裝備掉落:offlineStageResult 只給期望掉落次數,實際「掉到哪一件」交給
    // rollOfflineEquipmentDrops(見 game/equipment.ts)逐次挑選,跟前景 tickBattle 掉落
    // 同一套「優先掉還沒解鎖過的款式」邏輯,用離線前的職業/等級快照(跟 offlineAttackPower 同一份)。
    const offlineEquipmentDrops = rollOfflineEquipmentDrops(
      offlineStageResult.equipmentDropCount,
      save.job.archetype,
      save.job.branch,
      save.level.level,
      save.unlockedItemIds
    );
    let nextUnlockedItemIds = save.unlockedItemIds;
    let nextItemInstances = itemInstances;
    for (const drop of offlineEquipmentDrops) {
      nextUnlockedItemIds = unlockItem(nextUnlockedItemIds, drop.id);
      nextItemInstances = ensureItemInstance(drop.id, nextItemInstances);
    }

    set({
      level,
      trigger: save.trigger,
      job: save.job,
      jobTier: save.jobTier,
      equipment: save.equipment,
      bodyType: save.bodyType,
      skillTree: save.skillTree,
      // 職業認同上限(見 game/skillTree.ts 的 enforceLoadoutIdentityCap)是這次新加的規則,
      // 舊存檔可能存著「4格全借別的職業」這種現在不合法的配置——讀檔時清一次,超標的借用格
      // 直接清空,不需要為此多加一版存檔遷移(loadout 本身的資料結構沒有變)。
      activeSkillLoadout: enforceLoadoutIdentityCap(save.activeSkillLoadout, save.job.archetype),
      studentSkillTree: save.studentSkillTree,
      gender: save.gender,
      coins,
      unlockedItemIds: nextUnlockedItemIds,
      companions: save.companions,
      companionGear: save.companionGear,
      // 每日次數重置跟每日任務同一套精神(見 game/dungeon.ts 的 applyDungeonDailyReset):
      // 跨日才歸零,不能等到玩家手動點進副本分頁才觸發。
      dungeon: applyDungeonDailyReset(save.dungeon),
      secondaryJob: save.secondaryJob,
      itemInstances: nextItemInstances,
      enhanceStones: nextEnhanceStones,
      gemCounts: nextGemCounts,
      skillBooks: nextSkillBooks,
      stageProgress: offlineStageResult.stageProgress,
      totalStagesCleared: offlineStageResult.totalStagesCleared,
      ascensionPoints: save.ascensionPoints + offlineStageResult.ascensionPointsGained,
      ascensionUpgrades: save.ascensionUpgrades,
      weeklyChallengeWeekIndex: newWeek ? weekIndex() : save.weeklyChallengeWeekIndex,
      weeklyChallengeProgress: newWeek ? {} : save.weeklyChallengeProgress,
      weeklyChallengeClaimedIds: newWeek ? [] : save.weeklyChallengeClaimedIds,
      lastDailyResetAt: newDay ? todayDateString() : save.lastDailyResetAt,
      dailyKillCount: newDay ? 0 : save.dailyKillCount,
      dailyQuestClaimed: newDay ? false : save.dailyQuestClaimed,
      dailyTaskProgress: newDay ? {} : save.dailyTaskProgress,
      dailyTaskClaimedIds: newDay ? [] : save.dailyTaskClaimedIds,
      transferFragments: save.transferFragments,
      transferProofs: save.transferProofs,
      hasChosenJob: save.hasChosenJob,
      unlockedAchievementIds: save.unlockedAchievementIds,
      claimedAchievementIds: save.claimedAchievementIds,
      hasEverAssembledTransferProof: save.hasEverAssembledTransferProof,
      hasEverSwitchedJob: save.hasEverSwitchedJob,
      killCount: offlineStageResult.killCount,
      heroHp: save.heroHp,
      defeatRecoveryUntil: save.defeatRecoveryUntil,
      lastHpRegenTickAt: save.lastHpRegenTickAt,
      soundMuted: save.soundMuted,
      hasSeenWelcome: save.hasSeenWelcome,
      musicMuted: save.musicMuted,
      lastDailyLoginBonus: dailyLoginBonus,
      isLoaded: true,
      lastOfflineGain: gainedExp,
      lastOfflineKills: offlineStageResult.kills,
      lastOfflineCoins: offlineStageResult.coins,
      lastOfflineEnhanceStones: offlineStageResult.enhanceStonesGained,
      lastOfflineSkillBooks: offlineStageResult.skillBooksGained,
      lastOfflineGems: Object.values(offlineStageResult.gemsGained).reduce((sum, n) => sum + (n ?? 0), 0),
      lastOfflineEquipmentCount: offlineEquipmentDrops.length,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
      activeSkillTimers: { active1: Date.now(), active2: Date.now(), active3: Date.now(), active4: Date.now() },
      studentActiveSkillTimers: { active1: Date.now(), active2: Date.now(), active3: Date.now(), active4: Date.now() },
      secondarySkillTimerStartedAt: Date.now(),
    });
    // 音效/BGM模組是獨立於 store 之外的命令式播放(見 lib/sounds.ts),load() 時同步一次目前的
    // 靜音設定,之後 toggleSound()/toggleMusic() 每次切換也要同步呼叫,兩邊狀態才不會不一致。
    // 開啟遊戲就直接嘗試播放BGM(startMusic()),多數瀏覽器第一次造訪會擋下這次嘗試,
    // 使用者第一次跟頁面互動時(見 hooks/useMusicUnlock.ts)會再呼叫一次當備援。
    setSoundMuted(save.soundMuted);
    setMusicMuted(save.musicMuted);
    startMusic();
    // 全量重新計算:讓存檔本身已經達標的成就(不論是老存檔在這個功能上線前就已經達成,
    // 還是離線期間的升級/掉落剛好跨過門檻)在載入當下立刻被追溯性授予。
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  toggleSound: () => {
    const nextMuted = !get().soundMuted;
    setSoundMuted(nextMuted);
    set({ soundMuted: nextMuted });
    persist(get());
  },

  toggleMusic: () => {
    const nextMuted = !get().musicMuted;
    setMusicMuted(nextMuted);
    set({ musicMuted: nextMuted });
    persist(get());
  },

  dismissWelcome: () => {
    set({ hasSeenWelcome: true });
    persist(get());
  },

  resetSave: async () => {
    await clearSave();
    await get().load();
  },

  // 前景時每隔一小段時間呼叫一次(見 hooks/useBattleLoop.ts):沒有怪就生成一隻,
  // 有怪就檢查時間到了沒,到了就發獎勵、換下一隻。
  tickBattle: () => {
    const state = get();
    if (!state.isLoaded) return;

    // 吸血(lifesteal)/回血(hpRegen)的合併素質+passive3被動加成:兩者都吃同一份 substatTotals
    // 跟同一格 passive3 等級(見 game/skillTree.ts 的 getPassiveEffectKind 'lifeMastery'),
    // 在這裡算一次給下面全部用到,不用在每個分支各自重算。畢業後學生 passive3 永久疊加在
    // 職業 passive3 之上,跟 computePassiveSkillBonus 的 exp/coins 疊加邏輯一致。
    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const hpRegenTotal = substatTotals.hpRegen + passive3Bonus;

    // 回血(hpRegen,見 game/heroHealth.ts 的 applyHpRegenTick):跟戰鬥狀態完全無關,不管目前
    // 有沒有生成中的戰鬥、戰鬥進行到哪,每次 tick 都先無條件推進一次——所以特意放在最上面,
    // 在下面 currentEncounter/fightStartedAt 的任何分支判斷之前執行,不會因為戰鬥還在跑
    // 或剛好在生成下一場而被跳過。
    const hpRegenResult = applyHpRegenTick(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.lastHpRegenTickAt,
      hpRegenTotal
    );
    if (hpRegenResult.heroHp !== state.heroHp || hpRegenResult.lastHpRegenTickAt !== state.lastHpRegenTickAt) {
      set({ heroHp: hpRegenResult.heroHp, lastHpRegenTickAt: hpRegenResult.lastHpRegenTickAt });
    }

    if (!state.currentEncounter || state.fightStartedAt === null) {
      // 戰敗倒地恢復:這段時間內不生成新戰鬥,呈現「倒地恢復中」的空檔,恢復期過了才照常生成下一場戰鬥。
      if (state.defeatRecoveryUntil !== null && Date.now() < state.defeatRecoveryUntil) {
        return;
      }
      const { speedMultiplier } = computeRewardMultipliers(
        state.job,
        state.jobTier,
        state.equipment,
        state.companions,
        state.companionGear,
        state.secondaryJob,
        state.itemInstances,
        state.skillTree,
        state.studentSkillTree,
        state.hasChosenJob,
        state.ascensionUpgrades,
        state.claimedAchievementIds
      );
      const isBoss = isBossSubStage(state.stageProgress.subStage);
      const isFinalBoss = isFinalBossStage(state.stageProgress.stage, state.stageProgress.subStage);
      const difficultyMultiplier = getStageDifficultyMultiplier(state.stageProgress, getCycleCount(state.totalStagesCleared));
      const bossTier = state.jobTier;
      const heroSchool = getArchetypeComposition(state.job.archetype).damageType;
      const attackPower = heroAttackPower(
        state.level.level,
        state.jobTier,
        heroSchool === 'physical' ? substatTotals.physicalAttack : substatTotals.magicAttack
      );
      const encounter = generateEncounter(
        state.trigger,
        speedMultiplier,
        Math.random,
        isBoss,
        isFinalBoss,
        difficultyMultiplier,
        bossTier,
        attackPower
      );
      set({
        currentEncounter: encounter,
        trigger: encounter.triggerState,
        fightStartedAt: Date.now(),
        fightElapsedMs: 0,
        heroClicksThisFight: 0,
        defeatRecoveryUntil: null,
      });
      persist(get());
      return;
    }

    // 主動技能:4 個技能欄位(active1-4)各自獨立秒數倒數,固定不受戰鬥/關卡時長影響,
    // 全部同時運作、可以同一擊一起觸發,全自動。改成「每個 tick 都檢查」(不再只在擊殺結算
    // 時才檢查),冷卻好的當下就直接削減「這場正在進行中」戰鬥的剩餘時間(把 fightStartedAt
    // 往前挪,跟 boostCurrentFight 同一套做法),不用等湊到下一次擊殺才生效——呼應「技能倒數
    // 完之後要立刻觸發」的需求。4個技能全部是「造成傷害」,不碰擊殺獎勵的 exp/coins。
    const now = Date.now();
    let cutRatio = 0;
    let lastSkillTriggerAt = state.lastSkillTriggerAt;
    let lastTriggeredSkillIcon = state.lastTriggeredSkillIcon;
    let skillStateChanged = false;
    // 職業樹分階疊加效果(tier2~5),下面技能觸發判定跟擊殺結算都共用同一份,不重複呼叫。
    const tierBonus = getTierTriggerBonus(state.jobTier);

    // 學生主動技能:畢業後不會失效,永遠跟職業主動技能並存,用自己獨立的一組計時器。
    // 學生沒有 archetype,圖示照樣借用 job.archetype 當視覺樣板(跟 SkillTracker.tsx 既有慣例一致)。
    const studentTrigger = applyActiveSkillTriggers(state.studentSkillTree, state.studentActiveSkillTimers, now, cutRatio);
    const nextStudentActiveSkillTimers = studentTrigger.timers;
    cutRatio = studentTrigger.cutRatio;
    if (studentTrigger.triggeredSlot) {
      lastSkillTriggerAt = now;
      lastTriggeredSkillIcon = { archetype: state.job.archetype, slot: studentTrigger.triggeredSlot };
      skillStateChanged = true;
    }

    // 職業主動技能:畢業前(!hasChosenJob)還沒有主職可以套用,跳過這組計時器。
    let nextActiveSkillTimers = state.activeSkillTimers;
    if (state.hasChosenJob) {
      const jobTrigger = applyActiveSkillTriggers(
        resolveLoadoutLevels(state.activeSkillLoadout, state.skillTree, state.jobTier),
        state.activeSkillTimers,
        now,
        cutRatio
      );
      nextActiveSkillTimers = jobTrigger.timers;
      cutRatio = jobTrigger.cutRatio;
      if (jobTrigger.triggeredSlot) {
        lastSkillTriggerAt = now;
        // loadout 指到的可能是借用別的職業的招式(見 SkillLoadoutEditor.tsx),圖示要照
        // loadout 實際指到的 archetype+sourceSlot 抓,不是永遠用玩家目前的職業。
        const ref = state.activeSkillLoadout[jobTrigger.triggeredSlot];
        if (ref) lastTriggeredSkillIcon = { archetype: ref.archetype, slot: ref.sourceSlot };
        // 職業樹分階疊加效果:tier2起才有,且是一次觸發批次只套用一次(不會因為剛好4格
        // 同時觸發就疊加4次)——見 game/skillTree.ts 的 getTierTriggerBonus 設計說明。
        // tier5的加成原本是「無條件瞬殺」,改成一樣的「削減比例」機制,只是機率觸發、
        // 削減幅度特別大,一樣不保證打死(見 activeSkillDamageCutRatio 的說明)。
        if (Math.random() < tierBonus.extraDamageChance) cutRatio += TIER5_EXTRA_DAMAGE_CUT_RATIO;
        skillStateChanged = true;
      }
    }

    // 副職只借用它的主動技能第1格(該職業招牌效果),間隔是本職的兩倍,跟主職各自獨立計時、
    // 可以同一擊同時觸發,呼應副職只拿「部分加成」的定位,同樣全自動、一樣是造成傷害。
    let nextSecondarySkillTimerStartedAt = state.secondarySkillTimerStartedAt;
    let lastSecondarySkillTriggerAt = state.lastSecondarySkillTriggerAt;
    if (state.secondaryJob) {
      const secondarySkillLevel = effectiveSkillLevel(state.skillTree[state.secondaryJob], state.jobTier, 'active1');
      const secondaryIntervalMs = secondaryActiveSkillTriggerIntervalSeconds(secondarySkillLevel) * 1000;
      const secondaryReady = now - state.secondarySkillTimerStartedAt >= secondaryIntervalMs;
      const secondaryTriggered = secondarySkillLevel > 0 && secondaryReady;
      if (secondaryTriggered) {
        nextSecondarySkillTimerStartedAt = now;
        cutRatio += activeSkillDamageCutRatio('active1', secondarySkillLevel);
        lastSecondarySkillTriggerAt = now;
        lastSkillTriggerAt = now;
        lastTriggeredSkillIcon = { archetype: state.secondaryJob, slot: 'active1' };
        skillStateChanged = true;
      }
    }

    // 觸發到的技能直接削減「這場正在進行中」戰鬥的剩餘時間(把開始時間往前挪),不是留到
    // 下一場戰鬥才生效。比例算出來 >=1 就等於直接打完,是傷害數字自然算出來的結果,不是
    // 另外判斷「要不要瞬殺」——刻意不夾住上限。
    const fightStartedAt =
      cutRatio > 0
        ? state.fightStartedAt - Math.round(state.currentEncounter.fightDurationMs * cutRatio)
        : state.fightStartedAt;

    const elapsed = now - fightStartedAt;
    if (elapsed < state.currentEncounter.fightDurationMs) {
      if (skillStateChanged || fightStartedAt !== state.fightStartedAt) {
        set({
          fightStartedAt,
          fightElapsedMs: elapsed,
          activeSkillTimers: nextActiveSkillTimers,
          studentActiveSkillTimers: nextStudentActiveSkillTimers,
          secondarySkillTimerStartedAt: nextSecondarySkillTimerStartedAt,
          lastSkillTriggerAt,
          lastSecondarySkillTriggerAt,
          lastTriggeredSkillIcon,
        });
      } else {
        set({ fightElapsedMs: elapsed });
      }
      return;
    }

    const { expMultiplier, coinMultiplier } = computeRewardMultipliers(
      state.job,
      state.jobTier,
      state.equipment,
      state.companions,
      state.companionGear,
      state.secondaryJob,
      state.itemInstances,
      state.skillTree,
      state.studentSkillTree,
      state.hasChosenJob,
      state.ascensionUpgrades,
      state.claimedAchievementIds
    );
    // 關卡難度倍率:跟這隻怪生成當下用的是同一份 stageProgress/輪次(這次擊殺才會讓它們晉級,
    // 所以算獎勵的當下都還沒變),疊加在等級/裝備既有的獎勵倍率之上,是完全獨立的另一條軸線。
    const difficultyMultiplier = getStageDifficultyMultiplier(state.stageProgress, getCycleCount(state.totalStagesCleared));
    const reward = calcKillReward(state.currentEncounter.rarity, state.level.level, expMultiplier, coinMultiplier, difficultyMultiplier);

    // 勇者血量/戰敗風險判定(見 game/heroHealth.ts):在這場戰鬥開始「前」的血量基礎上計算,
    // 跟結算擊殺獎勵同一個時間點一次做完,不拆到下一個 tick。substatTotals 已經在函式最上面
    // 算過一份(跟 hpRegen tick 共用),下面爆擊率判定也共用同一份,不重複呼叫。
    // currentHp 用 hpRegenResult.heroHp(這個 tick 剛推進過回血 tick 之後的血量),不是
    // 前面快照下來就沒再更新的 state.heroHp,不然這次 hpRegen tick 剛回的血會被漏算。
    const monsterSchool = state.currentEncounter.monster.damageType;
    const matchingResistance =
      monsterSchool === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const healthResult = resolveFightHealth(
      hpRegenResult.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      state.currentEncounter.rarity,
      difficultyMultiplier,
      lifestealBonus
    );

    if (healthResult.defeated) {
      // 這場戰鬥沒有擊殺成功,勇者被打倒:不算擊殺,不發任何 exp/coins/掉落/成就,killCount 不增加。
      // currentEncounter 設回 null 讓下一輪 tick 重新生成同一隻怪(等於這場戰鬥重來),
      // 進入短暫的倒地恢復期(defeatRecoveryUntil),恢復期內 tickBattle 不會生成新戰鬥。
      set({
        heroHp: healthResult.nextHp,
        currentEncounter: null,
        fightStartedAt: null,
        fightElapsedMs: 0,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        activeSkillTimers: nextActiveSkillTimers,
        studentActiveSkillTimers: nextStudentActiveSkillTimers,
        secondarySkillTimerStartedAt: nextSecondarySkillTimerStartedAt,
        lastSkillTriggerAt,
        lastSecondarySkillTriggerAt,
        lastTriggeredSkillIcon,
      });
      persist(get());
      return;
    }

    const event = getRandomEvent(state.currentEncounter.rarity, { level: state.level.level });
    const nextStageProgress = advanceStageProgress(state.stageProgress);

    let exp = reward.exp;
    let coins = reward.coins;
    // 職業樹分階的金幣/經驗加成(tier2/3/4)不吃「造成傷害」門檻,只要這一擊真的打死(必定會,
    // 這裡本來就是擊殺結算區塊)就套用,維持跟舊版一樣「每次擊殺都疊加」的既有行為。
    coins += Math.round(coins * tierBonus.bonusCoinMult) + tierBonus.bonusFlatCoins;
    exp += Math.round(exp * tierBonus.bonusExpMult);

    // 裝備隨機/隱藏素質的爆擊率:獨立於技能觸發之外的機率,額外翻倍這次擊殺獎勵。
    // substatTotals 已經在上面血量判定時算過一份,這裡共用不重算。爆擊率/爆擊傷害吃
    // 勇者本職的物理/魔法系,不是怪物那邊——所以是另一條軸線,跟上面防禦側判定的
    // matchingResistance(吃怪物的系別)刻意不同。
    const heroSchool = getArchetypeComposition(state.job.archetype).damageType;
    const critChance = heroSchool === 'physical' ? substatTotals.physicalCritRate : substatTotals.magicCritRate;
    const critDamageBonus = heroSchool === 'physical' ? substatTotals.physicalCritDamage : substatTotals.magicCritDamage;
    if (Math.random() < critChance) {
      const critMultiplier = 2 + critDamageBonus;
      exp = Math.round(exp * critMultiplier);
      coins = Math.round(coins * critMultiplier);
    }

    // 寵物/坐騎額外掉落:跟主要稀有度事件的保底機制完全獨立判定,多數時候不會掉落。
    const companionDrop = rollCompanionDrop();
    let nextCompanions = state.companions;
    let lastCompanionDropId: string | null = null;
    if (companionDrop && !isCompanionUnlocked(nextCompanions, companionDrop.id)) {
      nextCompanions = unlockCompanion(nextCompanions, companionDrop.id);
      lastCompanionDropId = companionDrop.id;
    }

    // 強化石/寶石掉落:各自獨立判定,互不干擾、跟寵物掉落同一套邏輯。掉落一律只給初階
    // (見 grantBasicMaterial 的說明),更高階要靠玩家自己合成。
    const nextEnhanceStones = grantBasicMaterial(state.enhanceStones, rollEnhanceStoneDrop() ? 1 : 0);
    const gemDrop = rollGemDrop();
    const nextGemCounts = gemDrop ? grantGemDrop(state.gemCounts, gemDrop) : state.gemCounts;
    // 技能書掉落依職業階級分配(見 game/skillTree.ts 的 skillBookDropTier 說明),不是一律初階。
    const nextSkillBooks = rollSkillBookDrop()
      ? grantMaterialAtTier(
          state.skillBooks,
          skillBookDropTier(state.hasChosenJob, state.jobTier, state.skillTree[state.job.archetype][state.jobTier]),
          1
        )
      : state.skillBooks;

    // 裝備掉落:免費直接解鎖一件當前職業/等級穿得下的付費款,豐富擊殺獎勵種類,
    // 跟上面幾種掉落一樣各自獨立判定、互不影響。
    const equipmentDrop = rollEquipmentDrop(state.job.archetype, state.job.branch, state.level.level, state.unlockedItemIds);
    let nextUnlockedItemIds = state.unlockedItemIds;
    let nextItemInstances = state.itemInstances;
    let lastEquipmentDropId: string | null = null;
    if (equipmentDrop) {
      nextUnlockedItemIds = unlockItem(nextUnlockedItemIds, equipmentDrop.id);
      nextItemInstances = ensureItemInstance(equipmentDrop.id, nextItemInstances);
      lastEquipmentDropId = equipmentDrop.id;
    }

    // 轉職碎片掉落:跟上面幾種掉落不同,不是每隻怪都判定,只在打贏本輪 5 大關最終大魔王
    // 的這一擊(state.currentEncounter.isFinalBoss)才會擲——見 game/stages.ts 的 isFinalBossStage。
    // 中了不看目前主/副職,6 種 archetype 等機率隨機挑一種,湊滿 10 片自動兌換成 1 個轉職證明。
    const transferFragmentArchetype = state.currentEncounter.isFinalBoss ? rollTransferFragmentDrop() : null;
    let nextTransferFragments = state.transferFragments;
    let nextTransferProofs = state.transferProofs;
    // 成就用的一次性旗標:在這裡(碎片湊滿、剛合成出證明的當下,消耗發生之前)判定最準——
    // 比對合成後的證明數是否比合成前多,多了就代表這一擊真的湊出了第一個轉職證明。
    let nextHasEverAssembledTransferProof = state.hasEverAssembledTransferProof;
    if (transferFragmentArchetype) {
      const gained = applyTransferFragmentGain(state.transferFragments, state.transferProofs, transferFragmentArchetype);
      nextTransferFragments = gained.fragments;
      nextTransferProofs = gained.proofs;
      if ((gained.proofs[transferFragmentArchetype] ?? 0) !== (state.transferProofs[transferFragmentArchetype] ?? 0)) {
        nextHasEverAssembledTransferProof = true;
      }
    }

    // 金幣意外之財:獨立判定,中了直接加一筆這次擊殺基礎金幣的倍數。
    const coinWindfall = rollCoinWindfall(coins);
    const lastCoinWindfall = coinWindfall > 0 ? coinWindfall : null;

    // 銀行經驗值累積後立刻自動兌換等級(取代原本要玩家按按鈕手動兌換的設計,見
    // game/leveling.ts 的 autoLevelUp 說明),兌換公式完全沒變,只是不再需要玩家自己觸發。
    const { state: nextLevel, levelsGained } = autoLevelUp(accumulateExp(state.level, exp));
    if (levelsGained > 0) playLevelUp();
    const nextCoins = state.coins + coins + coinWindfall;

    set({
      level: nextLevel,
      coins: nextCoins,
      heroHp: healthResult.nextHp,
      companions: nextCompanions,
      enhanceStones: nextEnhanceStones,
      gemCounts: nextGemCounts,
      skillBooks: nextSkillBooks,
      unlockedItemIds: nextUnlockedItemIds,
      itemInstances: nextItemInstances,
      stageProgress: nextStageProgress,
      // 魔王小關(isBoss)只需要1擊就晉級(見 game/stages.ts),所以「這隻是魔王」跟「這一擊
      // 剛清完一個大關」是同一件事,不用另外比對 stageProgress 前後差異。
      totalStagesCleared: state.totalStagesCleared + (state.currentEncounter.isBoss ? 1 : 0),
      // 輪迴/轉生點數(見 game/ascension.ts):isFinalBoss 專指第300大關的大魔王,打贏這一擊
      // 才算破完整輪 3000 關,固定發放,不隨輪次遞增/遞減。
      ascensionPoints: state.ascensionPoints + (state.currentEncounter.isFinalBoss ? ASCENSION_POINTS_PER_CYCLE : 0),
      killCount: state.killCount + 1,
      dailyKillCount: state.dailyKillCount + 1,
      weeklyChallengeProgress: incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'kills'),
      lastEvent: event,
      lastCompanionDropId,
      lastEquipmentDropId,
      lastCoinWindfall,
      transferFragments: nextTransferFragments,
      transferProofs: nextTransferProofs,
      hasEverAssembledTransferProof: nextHasEverAssembledTransferProof,
      lastTransferFragmentArchetype: transferFragmentArchetype,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
      activeSkillTimers: nextActiveSkillTimers,
      studentActiveSkillTimers: nextStudentActiveSkillTimers,
      secondarySkillTimerStartedAt: nextSecondarySkillTimerStartedAt,
      lastSkillTriggerAt,
      lastSecondarySkillTriggerAt,
      lastTriggeredSkillIcon,
    });
    // 這一擊可能同時動到擊殺數/等級/裝備解鎖(掉落)/寵物坐騎解鎖(掉落)/轉職證明,
    // 全部收斂到這一個共用檢查點,不用在上面每個掉落判定各自插一次。
    checkAndUnlockAchievements(get, set);
    persist(get());
    playEvent(state.currentEncounter.rarity);
  },

  // 轉職試煉副本(見 game/dungeon.ts):跟一般戰鬥(tickBattle)是完全獨立的另一條戰鬥判定路線,
  // 消耗入場券,勝負判定複用同一套 resolveFightHealth,唯一差異是打贏保證掉「指定」archetype 的
  // 轉職碎片(不是隨機抽),不是每隻小怪都能觸發,而是玩家主動選職業來打。
  challengeDungeon: (archetype) => {
    const state = get();
    const spent = spendDungeonChallenge(state.dungeon, 'job');
    if (spent === null) return; // 沒票,UI 按鈕本來就該 disabled,這裡是防呆。

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    // 副本沒有真的 MonsterSpec,設計上刻意用「被打的目標職業」的相反系別當這場試煉的怪物系別,
    // 逼玩家不能只堆單一系抗性就通吃所有副本(見 CLAUDE.md 派工單的取捨說明)。
    const targetSchool = getArchetypeComposition(archetype).damageType;
    const dungeonMonsterSchool = oppositeDamageType(targetSchool);
    const matchingResistance =
      dungeonMonsterSchool === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    // 吸血加成跟 tickBattle 同一套算法(裝備素質+學生 passive3 永久疊加職業 passive3),
    // 副本沒有 hpRegen tick(見 hooks/useGameState.ts 的 tickBattle 說明,只有一般戰鬥迴圈才會推進時間制回血)。
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    // 副本任務(見 game/daily.ts 的 DAILY_TASKS)看的是「有沒有挑戰過」,不看輸贏——
    // 消耗到入場券(spent !== null,上面已經檢查過)就算數,所以贏/輸兩條分支都要記一次。
    // 週期成就輪替(見 game/weeklyChallenge.ts)的副本挑戰次數同一套判定,一起記。
    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    const gained = applyTransferFragmentGain(state.transferFragments, state.transferProofs, archetype);
    const nextHasEverAssembledTransferProof =
      (gained.proofs[archetype] ?? 0) !== (state.transferProofs[archetype] ?? 0) ? true : state.hasEverAssembledTransferProof;

    set({
      heroHp: healthResult.nextHp,
      coins: state.coins + dungeonWinCoinReward(state.level.level),
      dungeon: spent,
      transferFragments: gained.fragments,
      transferProofs: gained.proofs,
      hasEverAssembledTransferProof: nextHasEverAssembledTransferProof,
      lastTransferFragmentArchetype: archetype,
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 副本六分頁裡的五種材料/資源副本(見 game/dungeon.ts):跟上面 6 個職業試煉共用同一組
  // 入場券池,邏輯照抄 challengeDungeon,差別只在沒有「目標職業」可以反推怪物系別
  // (各自固定用自己的 xxx_DUNGEON_SCHOOL),打贏發的是固定數量的資源,不是轉職碎片。
  challengeEnhanceStoneDungeon: () => {
    const state = get();
    const spent = spendDungeonChallenge(state.dungeon, 'enhanceStone');
    if (spent === null) return;

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    const matchingResistance =
      ENHANCE_STONE_DUNGEON_SCHOOL === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    set({
      heroHp: healthResult.nextHp,
      coins: state.coins + dungeonWinCoinReward(state.level.level),
      dungeon: spent,
      enhanceStones: grantBasicMaterial(state.enhanceStones, ENHANCE_STONE_DUNGEON_REWARD_AMOUNT),
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 技能書副本:保底10本(見 game/dungeon.ts 的 SKILL_BOOK_DUNGEON_REWARD_AMOUNT),挑戰時
  // 指定要打哪一階(UI 只會列出 unlockedSkillBookDungeonTiers 允許的階級,這裡不重複檢查),
  // 打贏直接發到指定的那一階,不像怪物掉落還要另外判斷「技能是否已封頂」。
  challengeSkillBookDungeon: (tier) => {
    const state = get();
    const spent = spendDungeonChallenge(state.dungeon, 'skillBook');
    if (spent === null) return;

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    const matchingResistance =
      SKILL_BOOK_DUNGEON_SCHOOL === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    set({
      heroHp: healthResult.nextHp,
      coins: state.coins + dungeonWinCoinReward(state.level.level),
      dungeon: spent,
      skillBooks: grantMaterialAtTier(state.skillBooks, tier, SKILL_BOOK_DUNGEON_REWARD_AMOUNT),
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 鑲嵌石副本:挑戰時指定要打哪一種寶石(UI 只會列出 availableGemDungeonTypes(today) 允許的
  // 種類),打贏發固定數量的該種寶石,固定初階(呼應既有寶石掉落一律初階的慣例)。
  challengeGemDungeon: (gemType) => {
    const state = get();
    const spent = spendDungeonChallenge(state.dungeon, 'gem');
    if (spent === null) return;

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    const matchingResistance =
      GEM_DUNGEON_SCHOOL === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    const nextGemCounts: GemCounts = {
      ...state.gemCounts,
      [gemType]: { ...state.gemCounts[gemType], 0: state.gemCounts[gemType][0] + GEM_DUNGEON_REWARD_AMOUNT },
    };
    set({
      heroHp: healthResult.nextHp,
      coins: state.coins + dungeonWinCoinReward(state.level.level),
      dungeon: spent,
      gemCounts: nextGemCounts,
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 經驗副本:打贏直接發固定經驗(隨等級成長,見 dungeonExpDropAmount),立刻套用
  // autoLevelUp——跟成就/每日登入獎勵的經驗發放同一套模式。
  challengeExpDungeon: () => {
    const state = get();
    const spent = spendDungeonChallenge(state.dungeon, 'exp');
    if (spent === null) return;

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    const matchingResistance =
      EXP_DUNGEON_SCHOOL === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    set({
      heroHp: healthResult.nextHp,
      dungeon: spent,
      level: autoLevelUp(accumulateExp(state.level, dungeonExpDropAmount(state.level.level))).state,
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 金錢副本:打贏直接發固定金幣(隨等級成長,見 dungeonCoinDropAmount),取代原本
  // 每場都有的附帶金幣獎勵(dungeonWinCoinReward),不會兩份一起疊加。
  challengeCoinDungeon: () => {
    const state = get();
    const spent = spendDungeonChallenge(state.dungeon, 'coin');
    if (spent === null) return;

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    const matchingResistance =
      COIN_DUNGEON_SCHOOL === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    set({
      heroHp: healthResult.nextHp,
      coins: state.coins + dungeonCoinDropAmount(state.level.level),
      dungeon: spent,
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 職業階級晉升(見 game/jobPromotion.ts):試煉沿用轉職副本同一組入場券池+難度公式,
  // 材料門檻對應晉升目標階級——有票、材料也當下夠,才會真的出手挑戰;打贏才會真的升階,
  // 材料不夠或已經滿階(5)UI 按鈕本來就該 disabled,這裡是防呆。試煉輸了照樣扣一張票
  // (呼應 challengeDungeon 既有的「有挑戰就算數,不看輸贏」票務邏輯),但輸了不會消耗
  // 材料、也不會升階。
  promoteJobTier: () => {
    const state = get();
    const nextTier = nextJobTier(state.jobTier);
    if (!nextTier) return;
    if (!canPromoteToTier(nextTier, state.level.level)) return;

    const cost = promotionMaterialCost(nextTier);
    const materialTier = nextTier as MaterialTier;
    if (state.skillBooks[materialTier] < cost.skillBooks || state.enhanceStones[materialTier] < cost.enhanceStones) return;

    const spent = spendDungeonChallenge(state.dungeon, 'job');
    if (spent === null) return;

    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    // 跟其他轉職試煉副本同一個道理:用玩家自己職業系別的相反系別當試煉怪物系別,逼玩家
    // 不能只堆單一系抗性就通吃(見 challengeDungeon 的同款設計說明)。
    const trialMonsterSchool = oppositeDamageType(getArchetypeComposition(state.job.archetype).damageType);
    const matchingResistance =
      trialMonsterSchool === 'physical' ? substatTotals.physicalResistance : substatTotals.magicResistance;
    const passive3Bonus =
      getPassiveBonusValue(state.studentSkillTree.passive3) +
      (state.hasChosenJob ? getPassiveBonusValue(effectiveSkillLevel(state.skillTree[state.job.archetype], state.jobTier, 'passive3')) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      state.jobTier,
      matchingResistance,
      'legendary',
      dungeonDifficultyMultiplier(state.level.level),
      lifestealBonus
    );

    const nextDailyTaskProgress = incrementDailyTaskProgress(state.dailyTaskProgress, 'dungeon');
    const nextWeeklyChallengeProgress = incrementWeeklyChallengeProgress(state.weeklyChallengeProgress, 'dungeon');

    if (healthResult.defeated) {
      set({
        heroHp: healthResult.nextHp,
        dungeon: spent,
        defeatRecoveryUntil: Date.now() + RECOVERY_DELAY_MS,
        dailyTaskProgress: nextDailyTaskProgress,
        weeklyChallengeProgress: nextWeeklyChallengeProgress,
      });
      persist(get());
      return;
    }

    set({
      heroHp: healthResult.nextHp,
      dungeon: spent,
      jobTier: nextTier,
      skillBooks: spendMaterialAtTier(state.skillBooks, materialTier, cost.skillBooks),
      enhanceStones: spendMaterialAtTier(state.enhanceStones, materialTier, cost.enhanceStones),
      dailyTaskProgress: nextDailyTaskProgress,
      weeklyChallengeProgress: nextWeeklyChallengeProgress,
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 點擊勇者可以搶快一點打完當前這隻怪(縮短剩餘時間);同時每次點擊都算一次「觸發點擊」,
  // 推進保底計數器,提高下一次判定落到稀有以上的機率(當前這隻怪的稀有度已經生成好了,
  // 點擊影響的是下一隻)。每場戰鬥點擊能貢獻的保底次數設上限,避免瘋狂連點直接洗出保底。
  boostCurrentFight: () => {
    // 點擊勇者也算一次使用者互動,順便重試BGM播放(見 lib/sounds.ts 的 startMusic/
    // hooks/useMusicUnlock.ts)——這裡呼叫是備援,主要依靠的是 useMusicUnlock 監聽
    // 整個頁面的互動,不限定要點勇者本體。
    startMusic();
    const { currentEncounter, fightStartedAt, trigger, heroClicksThisFight } = get();
    if (!currentEncounter || fightStartedAt === null) return;
    const BOOST_MS = 400;
    const CLICK_PITY_CAP_PER_FIGHT = 3;
    const nextHeroClicksThisFight = heroClicksThisFight + 1;
    const nextTrigger = heroClicksThisFight < CLICK_PITY_CAP_PER_FIGHT ? bumpPityFromClick(trigger) : trigger;
    set({
      fightStartedAt: fightStartedAt - BOOST_MS,
      heroClicksThisFight: nextHeroClicksThisFight,
      trigger: nextTrigger,
    });
  },

  // 同一 archetype 內只是換分支(A/B)完全免費,行為跟過去一樣。真的換成不同 archetype 才是
  // 「轉職」,需要先靠打大魔王蒐集到的轉職證明(見 game/transfer.ts)才能換,證明不夠就擋下這次
  // 切換並跳提示,不會靜默失敗;換成功會直接消耗 1 個證明。
  // 主職換成跟目前副職一樣的話,副職自動清空(不能兩職都選同一個);
  // 身上原本裝的職業鎖裝如果不符新主職,直接卸下(不限職業的款式不受影響)。
  setJob: (archetype, branch) => {
    const { job, secondaryJob, equipment, transferProofs, transferFragments, hasChosenJob, level, activeSkillLoadout } = get();

    // 「學生」畢業:第一次真正選定主職,對齊 TIER_UNLOCK_LEVELS[1](Lv30)這個既有里程碑,
    // 免費、不受轉職證明限制——job 目前存的值只是畢業前的佔位預設,不是玩家真的選過的職業,
    // 不能套用 #57 那套「換到不同 archetype 要道具」的邏輯,否則畢業選職業會被誤判成「轉職」。
    if (!hasChosenJob) {
      if (level.level < TIER_UNLOCK_LEVELS[1]) {
        useToast.getState().show(`Lv${TIER_UNLOCK_LEVELS[1]} 畢業後才能選定主職`);
        return;
      }
      set({
        job: { archetype, branch },
        hasChosenJob: true,
        equipment: filterLoadoutForJob(equipment, archetype, branch),
        // 職業認同上限(見 game/skillTree.ts):畢業前的佔位配置可能指到跟真正選定主職不同的
        // archetype,超標的借用格清掉——反正這時候 skillTree 投資都還是 0,清掉不影響任何實質效果。
        activeSkillLoadout: enforceLoadoutIdentityCap(activeSkillLoadout, archetype),
      });
      checkAndUnlockAchievements(get, set);
      persist(get());
      return;
    }

    const isJobChange = archetype !== job.archetype;

    if (isJobChange) {
      const proofCount = transferProofs[archetype] ?? 0;
      if (proofCount < 1) {
        const fragmentCount = transferFragments[archetype] ?? 0;
        useToast.getState().show(
          `尚未集齊${TRANSFER_PROOF_NAMES[archetype]}(需要1個,目前碎片${fragmentCount}/${TRANSFER_FRAGMENTS_PER_PROOF})`
        );
        return;
      }
    }

    const nextSecondaryJob = secondaryJob === archetype ? null : secondaryJob;
    set({
      job: { archetype, branch },
      secondaryJob: nextSecondaryJob,
      equipment: filterLoadoutForJob(equipment, archetype, branch),
      // 職業認同上限(見 game/skillTree.ts):轉職後基準跟著換了,原本合法的配置可能瞬間
      // 超標(例如4格都是舊職業的技能),超標的借用格清掉,不會卡在不合法狀態。
      activeSkillLoadout: enforceLoadoutIdentityCap(activeSkillLoadout, archetype),
      // 只有這條「真的換成不同 archetype、消耗證明」的分支代表玩家「改頭換面」過一次,
      // 畢業選第一個主職(上面 !hasChosenJob 分支)不算——見 transfer_first_switch 成就。
      ...(isJobChange
        ? {
            transferProofs: { ...transferProofs, [archetype]: (transferProofs[archetype] ?? 0) - 1 },
            hasEverSwitchedJob: true,
          }
        : {}),
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  // 3 階解鎖雙職兼修,副職不能跟主職同一個archetype;傳 null 可以清空副職。
  setSecondaryJob: (archetype) => {
    const { job, level } = get();
    if (archetype !== null) {
      if (!canUnlockDualClass(level.level)) return;
      if (archetype === job.archetype) return;
    }
    set({ secondaryJob: archetype, secondarySkillTimerStartedAt: Date.now(), lastSecondarySkillTriggerAt: null });
    persist(get());
  },

  equip: (itemId) => {
    const { equipment, unlockedItemIds, job, level, itemInstances } = get();
    const item = getItemById(itemId);
    if (!item || !canEquipItem(item, job.archetype, job.branch, level.level)) return;
    if (!isItemUnlocked(unlockedItemIds, itemId)) return;
    set({ equipment: equipItem(equipment, itemId), itemInstances: ensureItemInstance(itemId, itemInstances) });
    persist(get());
  },

  unequip: (slot) => {
    const { equipment } = get();
    set({ equipment: unequipSlot(equipment, slot) });
    persist(get());
  },

  // 未解鎖的裝備第一次點擊會先扣貨幣解鎖並直接穿上;貨幣不夠就靜默不做事(跟技能升級一致)。
  // 職業鎖裝/等級不足一律靜默擋下,UI 本身也只會列出目前職業+已達等級的款式。
  // 第一次真的擁有(不管免費還是花錢)這件裝備時順便擲隨機/隱藏素質,之後固定不變。
  purchaseItem: (itemId) => {
    const { equipment, coins, unlockedItemIds, job, level, itemInstances } = get();
    const item = getItemById(itemId);
    if (!item) return;
    if (!canEquipItem(item, job.archetype, job.branch, level.level)) return;

    if (isItemUnlocked(unlockedItemIds, itemId)) {
      set({ equipment: equipItem(equipment, itemId), itemInstances: ensureItemInstance(itemId, itemInstances) });
      persist(get());
      return;
    }

    if (coins < item.price) return;

    set({
      coins: coins - item.price,
      unlockedItemIds: unlockItem(unlockedItemIds, itemId),
      equipment: equipItem(equipment, itemId),
      itemInstances: ensureItemInstance(itemId, itemInstances),
    });
    persist(get());
  },

  // 花錢鑑定隱藏素質,鑑定過就永久生效;裝備不存在/沒有素質資料/金幣不夠就靜默不做事。
  identifyItem: (itemId) => {
    const { coins, itemInstances, dailyTaskProgress, weeklyChallengeProgress } = get();
    const item = getItemById(itemId);
    const instance = itemInstances[itemId];
    if (!item || !instance || instance.identified) return;
    const cost = getIdentifyCost(item);
    if (coins < cost) return;

    set({
      coins: coins - cost,
      itemInstances: { ...itemInstances, [itemId]: { ...instance, identified: true } },
      dailyTaskProgress: incrementDailyTaskProgress(dailyTaskProgress, 'identify'),
      weeklyChallengeProgress: incrementWeeklyChallengeProgress(weeklyChallengeProgress, 'identify'),
    });
    persist(get());
  },

  // 後期玩家裝備/技能/寵物都點滿之後金幣沒有長期去化管道,花金幣重擲已擁有裝備的隨機/隱藏
  // 素質(兩項一起重擲,不能只挑一項)——賭運氣的無底洞消耗,不影響強化/鑲嵌/鑑定狀態。
  rerollEquipmentSubstats: (itemId) => {
    const { coins, itemInstances } = get();
    const item = getItemById(itemId);
    const instance = itemInstances[itemId];
    if (!item || !instance) return;
    const cost = getRerollCost(item);
    if (coins < cost) return;

    set({
      coins: coins - cost,
      itemInstances: { ...itemInstances, [itemId]: rerollItemSubstats(item, instance) },
    });
    persist(get());
  },

  // 花金幣+強化石嘗試 +1;Lv1~5 失敗只浪費資源,Lv6~10 失敗可能降級或直接損毀(從裝備欄跟
  // 已解鎖清單一併移除)。resistance 素質(裝備自己的,不是全身加總)拉低失敗率。
  enhanceItem: (itemId) => {
    const {
      coins,
      enhanceStones,
      itemInstances,
      equipment,
      unlockedItemIds,
      dailyTaskProgress,
      weeklyChallengeProgress,
      hasChosenJob,
      jobTier,
    } = get();
    const item = getItemById(itemId);
    const instance = itemInstances[itemId];
    if (!item || !instance) return;
    if (instance.enhanceLevel >= ENHANCE_MAX_LEVEL) return;

    // 強化石分階制(見 game/materials.ts):要用哪一階的石頭,直接對應目前職業階級,不對應
    // 強化目標等級本身——跟技能書的分階規則完全一樣。
    const materialTier = currentMaterialTier(hasChosenJob, jobTier);
    const coinCost = getEnhanceCoinCost(item, instance.enhanceLevel);
    const stoneCost = getEnhanceStoneCost(instance.enhanceLevel);
    if (coins < coinCost || enhanceStones[materialTier] < stoneCost) return;

    const outcome = rollEnhanceOutcome(instance, instance.enhanceLevel);
    let nextInstances = itemInstances;
    let nextEquipment = equipment;
    let nextUnlockedItemIds = unlockedItemIds;
    let message: string;

    if (outcome === 'success') {
      const nextLevel = instance.enhanceLevel + 1;
      nextInstances = { ...itemInstances, [itemId]: { ...instance, enhanceLevel: nextLevel } };
      message = `強化成功!${item.name} 提升到 +${nextLevel}`;
    } else if (outcome === 'fail_safe') {
      message = `強化失敗,${item.name} 沒有受到影響`;
    } else if (outcome === 'fail_downgrade') {
      const nextLevel = Math.max(0, instance.enhanceLevel - 1);
      nextInstances = { ...itemInstances, [itemId]: { ...instance, enhanceLevel: nextLevel } };
      message = `強化失敗,${item.name} 降級到 +${nextLevel}`;
    } else {
      const rest = { ...itemInstances };
      delete rest[itemId];
      nextInstances = rest;
      nextEquipment = unequipSlot(equipment, item.slot);
      nextUnlockedItemIds = unlockedItemIds.filter((id) => id !== itemId);
      message = `強化失敗,${item.name} 損毀了!`;
    }

    set({
      coins: coins - coinCost,
      enhanceStones: spendMaterialAtTier(enhanceStones, materialTier, stoneCost),
      itemInstances: nextInstances,
      equipment: nextEquipment,
      unlockedItemIds: nextUnlockedItemIds,
      lastEnhanceOutcome: message,
      dailyTaskProgress: incrementDailyTaskProgress(dailyTaskProgress, 'enhance'),
      weeklyChallengeProgress: incrementWeeklyChallengeProgress(weeklyChallengeProgress, 'enhance'),
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  purchaseEnhanceStone: () => {
    const { coins, enhanceStones } = get();
    if (coins < ENHANCE_STONE_PRICE) return;
    set({ coins: coins - ENHANCE_STONE_PRICE, enhanceStones: grantBasicMaterial(enhanceStones, 1) });
    persist(get());
  },

  craftSkillBookTier: (tier) => {
    const { skillBooks } = get();
    if (!canCraftMaterialTier(tier, skillBooks)) return;
    set({ skillBooks: craftMaterialTier(tier, skillBooks) });
    persist(get());
  },

  craftEnhanceStoneTier: (tier) => {
    const { enhanceStones } = get();
    if (!canCraftMaterialTier(tier, enhanceStones)) return;
    set({ enhanceStones: craftMaterialTier(tier, enhanceStones) });
    persist(get());
  },

  // 商店買寶石固定拿初階(tier 0),跟強化石購買同一套規則,更高階只能自己合成(見 craftGemTier)。
  purchaseGem: (gemType) => {
    const { coins, gemCounts } = get();
    const price = GEM_SPECS[gemType].price;
    if (coins < price) return;
    set({ coins: coins - price, gemCounts: grantGemDrop(gemCounts, gemType) });
    persist(get());
  },

  // 合成:兩本前一階寶石換一顆下一階,跟技能書/強化石共用同一套 2:1 規則(見 game/materials.ts)。
  craftGemTier: (gemType, tier) => {
    const { gemCounts } = get();
    if (!canCraftGemTier(gemType, tier, gemCounts)) return;
    set({ gemCounts: craftGemTier(gemType, tier, gemCounts) });
    persist(get());
  },

  // 鑲嵌:插槽必須是空的才能鑲(要換款先 unsocketGem)。拔除寶石原樣退回對應階級的庫存,不會損毀。
  socketGem: (itemId, socketIndex, gemType, tier) => {
    const { gemCounts, itemInstances } = get();
    const instance = itemInstances[itemId];
    if (!instance) return;
    if (socketIndex < 0 || socketIndex >= instance.socketedGems.length) return;
    if (instance.socketedGems[socketIndex] !== null) return;
    if (gemCounts[gemType][tier] <= 0) return;

    const nextSockets = [...instance.socketedGems];
    nextSockets[socketIndex] = { type: gemType, tier };

    set({
      gemCounts: { ...gemCounts, [gemType]: { ...gemCounts[gemType], [tier]: gemCounts[gemType][tier] - 1 } },
      itemInstances: { ...itemInstances, [itemId]: { ...instance, socketedGems: nextSockets } },
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  unsocketGem: (itemId, socketIndex) => {
    const { gemCounts, itemInstances } = get();
    const instance = itemInstances[itemId];
    if (!instance) return;
    const socketed = instance.socketedGems[socketIndex];
    if (!socketed) return;

    const nextSockets = [...instance.socketedGems];
    nextSockets[socketIndex] = null;

    set({
      gemCounts: {
        ...gemCounts,
        [socketed.type]: { ...gemCounts[socketed.type], [socketed.tier]: gemCounts[socketed.type][socketed.tier] + 1 },
      },
      itemInstances: { ...itemInstances, [itemId]: { ...instance, socketedGems: nextSockets } },
    });
    persist(get());
  },

  setBodyType: (bodyType) => {
    set({ bodyType });
    persist(get());
  },

  // tier 是玩家在瀏覽卡片上選的「要投資哪一階」,不是目前的全局職業階級——每一階都是獨立
  // 0-10級的軌道,升到2階之後1階這格依然可以繼續點滿(見 game/skillTree.ts 的
  // SkillTreeLevels 說明),所以這裡改成呼叫端指定要投資的 tier,不再固定吃 state.jobTier。
  // 只能投資「已經晉升到」的階級(tier<=state.jobTier),還沒解鎖的階級不能超前投資。
  upgradeSkillSlot: (archetype, tier, slot) => {
    const { jobTier, skillTree, skillBooks } = get();
    if (tier > jobTier) return;
    // 技能書分階制(見 game/materials.ts):要用哪一階的書,直接對應「這次要投資的那一階」,
    // 這個 action 只在畢業後(hasChosenJob)才會被呼叫到,所以這裡直接傳 true。
    const materialTier = currentMaterialTier(true, tier);
    const currentSlotLevel = skillTree[archetype][tier][slot];
    if (!canUpgradeSkillSlot(currentSlotLevel, tier, skillBooks[materialTier])) return;

    const bookCost = skillSlotUpgradeBookCost(currentSlotLevel);
    const nextSkillTree: SkillTreeLevels = {
      ...skillTree,
      [archetype]: {
        ...skillTree[archetype],
        [tier]: { ...skillTree[archetype][tier], [slot]: nextSkillSlotLevel(currentSlotLevel, tier) },
      },
    };

    set({ skillTree: nextSkillTree, skillBooks: spendMaterialAtTier(skillBooks, materialTier, bookCost) });
    persist(get());
    playSkillUpgrade();
  },

  // 學生期(!hasChosenJob)專屬技能樹的升級 action,邏輯比照 upgradeSkillSlot,只是操作對象換成
  // studentSkillTree,upgrade/cost 函式換成 game/studentSkillTree.ts 那組(等級上限固定
  // STUDENT_SKILL_LEVEL_CAP,不吃 JobTier)。
  upgradeStudentSkillSlot: (slot) => {
    const { studentSkillTree, skillBooks } = get();
    // 學生期一律用初階書(見 currentMaterialTier:!hasChosenJob 固定回傳0)。
    const currentSlotLevel = studentSkillTree[slot];
    if (!canUpgradeStudentSkillSlot(currentSlotLevel, skillBooks[0])) return;

    const bookCost = skillSlotUpgradeBookCost(currentSlotLevel);
    const nextStudentSkillTree: Record<SkillSlotId, number> = {
      ...studentSkillTree,
      [slot]: nextStudentSkillSlotLevel(currentSlotLevel),
    };

    set({ studentSkillTree: nextStudentSkillTree, skillBooks: spendMaterialAtTier(skillBooks, 0, bookCost) });
    persist(get());
    playSkillUpgrade();
  },

  upgradeSkillSlotMax: (archetype, tier, slot) => {
    const { jobTier, skillTree, skillBooks } = get();
    if (tier > jobTier) return;
    const materialTier = currentMaterialTier(true, tier);
    let slotLevel = skillTree[archetype][tier][slot];
    let remainingBooks = skillBooks[materialTier];
    let upgradedAtLeastOnce = false;
    // 迴圈在記憶體裡跑完,只在最後 set() 一次、persist() 一次——不是在 UI 層連續呼叫單級版本,
    // 避免每級都各自觸發一次存檔 IO。
    while (canUpgradeSkillSlot(slotLevel, tier, remainingBooks)) {
      remainingBooks -= skillSlotUpgradeBookCost(slotLevel);
      slotLevel = nextSkillSlotLevel(slotLevel, tier);
      upgradedAtLeastOnce = true;
    }
    if (!upgradedAtLeastOnce) return;

    set({
      skillTree: {
        ...skillTree,
        [archetype]: { ...skillTree[archetype], [tier]: { ...skillTree[archetype][tier], [slot]: slotLevel } },
      },
      skillBooks: { ...skillBooks, [materialTier]: remainingBooks },
    });
    persist(get());
    playSkillUpgrade();
  },

  upgradeStudentSkillSlotMax: (slot) => {
    const { studentSkillTree, skillBooks } = get();
    let slotLevel = studentSkillTree[slot];
    let remainingBooks = skillBooks[0];
    let upgradedAtLeastOnce = false;
    while (canUpgradeStudentSkillSlot(slotLevel, remainingBooks)) {
      remainingBooks -= skillSlotUpgradeBookCost(slotLevel);
      slotLevel = nextStudentSkillSlotLevel(slotLevel);
      upgradedAtLeastOnce = true;
    }
    if (!upgradedAtLeastOnce) return;

    set({
      studentSkillTree: { ...studentSkillTree, [slot]: slotLevel },
      skillBooks: { ...skillBooks, 0: remainingBooks },
    });
    persist(get());
    playSkillUpgrade();
  },

  setGender: (gender) => {
    const { equipment, unlockedItemIds } = get();
    const nextEquipment = applyGenderDefault(equipment, gender);
    const nextUnlocked = getGenderUnlockItems(gender).reduce(
      (unlocked, itemId) => unlockItem(unlocked, itemId),
      unlockedItemIds
    );
    set({ gender, equipment: nextEquipment, unlockedItemIds: nextUnlocked });
    persist(get());
  },

  // 未解鎖的審物/坐騎第一次點擊先扣貨幣解鎖並直接裝備;貨幣不夠就靜默不做事。
  purchaseCompanion: (id) => {
    const { companions, coins } = get();
    const companion = getCompanionById(id);
    if (!companion) return;

    if (isCompanionUnlocked(companions, id)) {
      set({ companions: equipCompanion(companions, id) });
      persist(get());
      return;
    }

    if (coins < companion.price) return;

    const unlocked = unlockCompanion(companions, id);
    set({ coins: coins - companion.price, companions: equipCompanion(unlocked, id) });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  unequipCompanionSlot: (kind) => {
    const { companions } = get();
    set({ companions: unequipCompanion(companions, kind) });
    persist(get());
  },

  // 寵物/坐騎專屬裝備升級:比照 purchaseCompanion/upgradeStudentSkillSlot 的既有寫法,
  // 只吃金幣(不吃 bankedExp)——這是寵物系統的加成,定位是「金幣的額外去處」,
  // 不跟主要練等經濟(bankedExp)搶資源。
  upgradeCompanionGearSlot: (kind, slot) => {
    const { companionGear, level, coins, dailyTaskProgress, weeklyChallengeProgress } = get();
    const currentSlotLevel = companionGear[kind][slot];
    if (!canUpgradeCompanionGearSlot(currentSlotLevel, level.level, coins)) return;

    const coinCost = companionGearUpgradeCoinCost(currentSlotLevel);
    const nextCompanionGear: CompanionGearState = {
      ...companionGear,
      [kind]: { ...companionGear[kind], [slot]: currentSlotLevel + 1 },
    };

    set({
      companionGear: nextCompanionGear,
      coins: coins - coinCost,
      dailyTaskProgress: incrementDailyTaskProgress(dailyTaskProgress, 'companionGear'),
      weeklyChallengeProgress: incrementWeeklyChallengeProgress(weeklyChallengeProgress, 'companionGear'),
    });
    persist(get());
    playSkillUpgrade();
  },

  // 每日任務:今日擊敗數達標且還沒領過才會發獎勵,隔天(見load())dailyQuestClaimed會自動重置。
  claimDailyQuest: () => {
    const { dailyKillCount, dailyQuestClaimed, coins, enhanceStones, skillBooks } = get();
    if (!canClaimDailyQuest(dailyKillCount, dailyQuestClaimed)) return;
    set({
      coins: coins + DAILY_QUEST_COIN_REWARD,
      enhanceStones: grantBasicMaterial(enhanceStones, DAILY_QUEST_ENHANCE_STONE_REWARD),
      skillBooks: grantBasicMaterial(skillBooks, DAILY_QUEST_SKILL_BOOK_REWARD),
      dailyQuestClaimed: true,
    });
    persist(get());
  },

  // 任務池另外 4 項每日任務(見 game/daily.ts 的 DAILY_TASKS):跟上面 claimDailyQuest 同一套
  // 判定/領取模式,各自獨立,不互相影響。
  claimDailyTask: (id) => {
    const { dailyTaskProgress, dailyTaskClaimedIds, coins, enhanceStones, skillBooks } = get();
    if (!canClaimDailyTask(id, dailyTaskProgress, dailyTaskClaimedIds)) return;
    const reward = getDailyTaskDef(id).reward;
    set({
      coins: coins + reward.coins,
      enhanceStones: grantBasicMaterial(enhanceStones, reward.enhanceStones ?? 0),
      skillBooks: grantBasicMaterial(skillBooks, reward.skillBooks ?? 0),
      dailyTaskClaimedIds: [...dailyTaskClaimedIds, id],
    });
    persist(get());
  },

  // 週期成就輪替(見 game/weeklyChallenge.ts):跟上面 claimDailyTask 同一套判定/領取模式,
  // 獎勵可能含寶石(見 WEEKLY_CHALLENGE_POOL),疊加邏輯照抄 claimAchievement 那段。
  claimWeeklyChallenge: (id) => {
    const { weeklyChallengeProgress, weeklyChallengeClaimedIds, coins, enhanceStones, gemCounts } = get();
    if (!canClaimWeeklyChallenge(id, weeklyChallengeProgress, weeklyChallengeClaimedIds)) return;
    const reward = getWeeklyChallengeDef(id).reward;
    const nextGemCounts: GemCounts = { ...gemCounts };
    if (reward.gems) {
      for (const gemType of GEM_TYPES) {
        const amount = reward.gems[gemType];
        if (amount) nextGemCounts[gemType] = { ...nextGemCounts[gemType], 0: nextGemCounts[gemType][0] + amount };
      }
    }
    set({
      coins: coins + reward.coins,
      enhanceStones: grantBasicMaterial(enhanceStones, reward.enhanceStones ?? 0),
      gemCounts: nextGemCounts,
      weeklyChallengeClaimedIds: [...weeklyChallengeClaimedIds, id],
    });
    persist(get());
  },

  // 輪迴/轉生加成樹(見 game/ascension.ts):花轉生點數把某個節點升1級,金幣/bankedExp
  // 都不吃,是轉生點數這條獨立經濟軸線唯一的消耗管道。
  upgradeAscension: (id) => {
    const { ascensionPoints, ascensionUpgrades } = get();
    if (!canUpgradeAscension(id, ascensionUpgrades, ascensionPoints)) return;
    const currentLevel = ascensionUpgrades[id] ?? 0;
    const cost = ascensionUpgradeCost(currentLevel);
    set({
      ascensionPoints: ascensionPoints - cost,
      ascensionUpgrades: { ...ascensionUpgrades, [id]: currentLevel + 1 },
    });
    persist(get());
  },

  // 成就手動領取(見成就系統改成手動領取制):條件達成(unlockedAchievementIds)只是「可以領」,
  // 要玩家在成就圖示按這個才真的發獎勵並記進 claimedAchievementIds。發獎邏輯照抄舊版
  // checkAndUnlockAchievements 自動發獎年代的那段計算。
  claimAchievement: (id) => {
    const {
      unlockedAchievementIds,
      claimedAchievementIds,
      coins,
      enhanceStones,
      skillBooks,
      gemCounts,
      level,
      hasChosenJob,
      jobTier,
    } = get();
    if (!unlockedAchievementIds.includes(id) || claimedAchievementIds.includes(id)) return;
    const def = ACHIEVEMENTS[id];
    if (!def) return;

    const reward = def.reward;
    const nextGemCounts: GemCounts = { ...gemCounts };
    if (reward.gems) {
      for (const gemType of GEM_TYPES) {
        const amount = reward.gems[gemType];
        if (amount) nextGemCounts[gemType] = { ...nextGemCounts[gemType], 0: nextGemCounts[gemType][0] + amount };
      }
    }

    // 強化石/技能書發到跟成就 tier 對應的階級(見 game/achievements.ts 的 AchievementDef.tier),
    // 但不能超過玩家目前實際能用的階級(見 game/materials.ts 的 currentMaterialTier)——關卡數
    // (totalStagesCleared)會無限循環,跟等級/轉職階級脫鉤,不封頂會領到用不到的高階書。
    const grantTier = Math.min(def.tier, currentMaterialTier(hasChosenJob, jobTier)) as MaterialTier;
    set({
      coins: coins + reward.coins,
      level: reward.exp ? autoLevelUp(accumulateExp(level, reward.exp)).state : level,
      enhanceStones: grantMaterialAtTier(enhanceStones, grantTier, reward.enhanceStones ?? 0),
      skillBooks: grantMaterialAtTier(skillBooks, grantTier, reward.skillBooks ?? 0),
      gemCounts: nextGemCounts,
      claimedAchievementIds: [...claimedAchievementIds, id],
    });
    persist(get());
    useToast.getState().show(`領取成就獎勵:${def.title}(+${reward.coins}金幣)`);
  },

  // 一鍵領取全部:找出「條件達成但還沒領」的全部id,一次性 set()+persist(),不逐筆各自 set()
  // (效能跟reduce邏輯都比較乾淨)。
  claimAllAchievements: () => {
    const {
      unlockedAchievementIds,
      claimedAchievementIds,
      coins,
      enhanceStones,
      skillBooks,
      gemCounts,
      level,
      hasChosenJob,
      jobTier,
    } = get();
    const claimableIds = unlockedAchievementIds.filter((id) => !claimedAchievementIds.includes(id));
    if (claimableIds.length === 0) return;

    const grantTierCap = currentMaterialTier(hasChosenJob, jobTier);
    let nextCoins = coins;
    let nextLevel = level;
    let nextEnhanceStones = enhanceStones;
    let nextSkillBooks = skillBooks;
    const nextGemCounts: GemCounts = { ...gemCounts };
    for (const id of claimableIds) {
      const def = ACHIEVEMENTS[id];
      const reward = def.reward;
      const grantTier = Math.min(def.tier, grantTierCap) as MaterialTier;
      nextCoins += reward.coins;
      if (reward.exp) nextLevel = autoLevelUp(accumulateExp(nextLevel, reward.exp)).state;
      nextEnhanceStones = grantMaterialAtTier(nextEnhanceStones, grantTier, reward.enhanceStones ?? 0);
      nextSkillBooks = grantMaterialAtTier(nextSkillBooks, grantTier, reward.skillBooks ?? 0);
      if (reward.gems) {
        for (const gemType of GEM_TYPES) {
          const amount = reward.gems[gemType];
          if (amount) nextGemCounts[gemType] = { ...nextGemCounts[gemType], 0: nextGemCounts[gemType][0] + amount };
        }
      }
    }

    set({
      coins: nextCoins,
      level: nextLevel,
      enhanceStones: nextEnhanceStones,
      skillBooks: nextSkillBooks,
      gemCounts: nextGemCounts,
      claimedAchievementIds: [...claimedAchievementIds, ...claimableIds],
    });
    persist(get());
    useToast.getState().show(`一次領取了 ${claimableIds.length} 個成就獎勵`);
  },

  setActiveSkillLoadout: (position, ref) => {
    const state = get();
    // 清空這格一定合法;指到某個技能的話,那個技能一定要「已經投資過等級」才能放進來——
    // 呼應「從已學習的職業技能中選擇」的需求,UI 本來就只會列出已學過的選項,這裡再擋一次
    // 純防呆(避免透過非正規管道塞進一個等級 0、還沒點過的技能)。
    if (ref !== null && effectiveSkillLevel(state.skillTree[ref.archetype], state.jobTier, ref.sourceSlot) <= 0) return;
    // 職業認同上限(見 game/skillTree.ts 的 canSetLoadoutSlot):4格最多2格能借別的職業技能,
    // 超過就擋下這次設定並跳提示,不會靜默失敗。
    if (!canSetLoadoutSlot(state.activeSkillLoadout, state.job.archetype, position, ref)) {
      useToast.getState().show(`最多只能有${MAX_BORROWED_ACTIVE_SLOTS}格塞別的職業技能,至少要留給目前職業自己的招式`);
      return;
    }
    set({ activeSkillLoadout: { ...state.activeSkillLoadout, [position]: ref } });
    persist(get());
  },
}));
