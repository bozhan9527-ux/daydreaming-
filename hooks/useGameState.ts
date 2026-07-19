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
import { Archetype, calcCombatMultiplier, calcSecondaryCombatBonus, canUnlockDualClass, getArchetypeComposition, getCurrentTier, JobBranch, oppositeDamageType, TIER_UNLOCK_LEVELS } from '../game/combat';
import {
  applyGenderDefault,
  canEquipItem,
  createEmptyGemCounts,
  createEmptyItemInstances,
  createEmptyLoadout,
  createEmptyUnlockedItems,
  ENHANCE_MAX_LEVEL,
  ENHANCE_STONE_PRICE,
  equipItem,
  EquipmentLoadout,
  EQUIPMENT_ITEMS,
  filterLoadoutForArchetype,
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
  isItemUnlocked,
  ItemInstances,
  rerollItemSubstats,
  rollEnhanceOutcome,
  rollEnhanceStoneDrop,
  rollEquipmentDrop,
  rollGemDrop,
  rollItemInstance,
  unequipSlot,
  unlockItem,
  EquipmentSlot,
  UnlockedItemIds,
} from '../game/equipment';
import { rollCoinWindfall } from '../game/currency';
import {
  applyDungeonTicketRegen,
  createInitialDungeonState,
  DungeonState,
  dungeonDifficultyMultiplier,
  dungeonWinCoinReward,
  spendDungeonTicket,
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
  activeSkillTriggerIntervalSeconds,
  ACTIVE_SLOT_IDS,
  ActiveEffectKind,
  ActiveSkillLoadout,
  ActiveSkillRef,
  ActiveSkillSlotId,
  canUpgradeSkillSlot,
  createInitialActiveSkillLoadout,
  createInitialSkillTreeLevels,
  getActiveEffectKind,
  getBonusCoinsAmount,
  getExpBoostAmount,
  getPassiveBonusValue,
  getTierTriggerBonus,
  rollSkillBookDrop,
  secondaryActiveSkillTriggerIntervalSeconds,
  SKILL_SLOT_NAMES,
  skillSlotLevelCap,
  skillSlotUpgradeBookCost,
  SkillSlotId,
  SkillTreeLevels,
  upgradeSkillSlot as nextSkillSlotLevel,
} from '../game/skillTree';
import { BodyType } from '../game/sprites/heroSilhouette';
import {
  canUpgradeStudentSkillSlot,
  createInitialStudentSkillTreeLevels,
  getStudentActiveEffectKind,
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
// 不代表玩家真的選了它)的任何加成。
function currentJobMultiplier(job: JobSelection, level: number, secondaryJob: Archetype | null, hasChosenJob: boolean): number {
  if (!hasChosenJob) return 1.0;
  const tier = getCurrentTier(level);
  const primary = calcCombatMultiplier(job.archetype, tier);
  const secondaryBonus = secondaryJob ? calcSecondaryCombatBonus(secondaryJob, tier) : 0;
  return primary + secondaryBonus;
}

interface ActiveSkillTriggerResult {
  timers: Record<ActiveSkillSlotId, number>;
  exp: number;
  coins: number;
  forceInstantNextFight: boolean;
  triggered: boolean;
  firedSlots: ActiveSkillSlotId[];
}

// 技能書/強化石分階制(見 game/materials.ts):所有既有掉落/獎勵管道(擊殺掉落、商店購買、
// 每日任務、週期挑戰、成就)一律只發初階(tier 0),呼應「維持現有掉落機制」的既有設計決定——
// 更高階只能靠玩家自己合成(見 craftSkillBooks/craftEnhanceStones action)。這裡統一寫成小函式,
// 避免每個發放點各自手刻「初階+N、其餘階級原樣」的物件展開。
function grantBasicMaterial(counts: TieredMaterialCounts, amount: number): TieredMaterialCounts {
  if (amount === 0) return counts;
  return { ...counts, 0: counts[0] + amount };
}

// 消耗指定階級的材料(升級技能/強化裝備用)——呼叫端自己先用 currentMaterialTier() 算出
// 「目前職業階級對應哪一階」,這個函式只單純做扣除,不重複算階級判斷邏輯。
function spendMaterialAtTier(counts: TieredMaterialCounts, tier: MaterialTier, amount: number): TieredMaterialCounts {
  return { ...counts, [tier]: counts[tier] - amount };
}

// 拿掉這批剛觸發過的欄位,其餘已點過但還沒輪到觸發的欄位(理論上不會發生,冷卻好立刻觸發)
// 維持原樣——單純寫成小函式避免三個呼叫點(學生/職業/副職)各自重複同一段物件過濾邏輯。
function omitArmedSlots(
  armed: Partial<Record<ActiveSkillSlotId, true>>,
  firedSlots: ActiveSkillSlotId[]
): Partial<Record<ActiveSkillSlotId, true>> {
  if (firedSlots.length === 0) return armed;
  const next = { ...armed };
  for (const slot of firedSlots) delete next[slot];
  return next;
}

// 手動點擊技能(armSkill/armSecondarySkill)時,如果當下正好有一場戰鬥在進行中,把它的
// 「開始時間」直接往前搬到剛好等於 fightDurationMs——下一次 tickBattle(最多300ms後,近乎
// 即時)就會判定這場戰鬥已經打完,用剛武裝好的技能效果結算這次擊殺。呼應「只要點擊技能就會
// 觸發」的需求:不用再乾等這場戰鬥自然跑完計時器才看得到反應。沒有進行中的戰鬥(例如倒地
// 恢復中)就不強制,武裝狀態會留著,等下一場戰鬥自然結算。
function forceResolveCurrentFightUpdate(state: {
  currentEncounter: Encounter | null;
  fightStartedAt: number | null;
}): { fightStartedAt?: number } {
  if (!state.currentEncounter || state.fightStartedAt === null) return {};
  return { fightStartedAt: Date.now() - state.currentEncounter.fightDurationMs };
}

// 主動技能觸發判定共用邏輯:職業技能樹跟學生技能樹畢業後永久並存(各自獨立計時器),
// 這個函式抽出來讓 tickBattle 對兩邊各呼叫一次,避免同一段判定寫兩份。
// 主動技能欄自選(見 game/skillTree.ts 的 ActiveSkillLoadout):4個位置各自透過 loadout 指到
// 「某個職業、某個主動格」的技能,不再固定等於目前職業自己的active1-4。這裡把 loadout 攤平成
// applyActiveSkillTriggers 原本就吃的 Record<ActiveSkillSlotId, number> 形狀——空位(null)直接
// 給0級,跟既有的 Lv.0 gating(見該函式內的 slotLevels[slot]<=0 continue)完全共用同一套「不
// 參與倒數、不能觸發」邏輯,不用另外寫一套「空欄位」的特殊處理。
function resolveLoadoutLevels(loadout: ActiveSkillLoadout, skillTree: SkillTreeLevels): Record<ActiveSkillSlotId, number> {
  const levels = {} as Record<ActiveSkillSlotId, number>;
  ACTIVE_SLOT_IDS.forEach((slot) => {
    const ref = loadout[slot];
    levels[slot] = ref ? skillTree[ref.archetype][ref.sourceSlot] : 0;
  });
  return levels;
}

function resolveLoadoutEffectKind(loadout: ActiveSkillLoadout, slot: ActiveSkillSlotId): ActiveEffectKind | null {
  const ref = loadout[slot];
  return ref ? getActiveEffectKind(ref.archetype, ref.sourceSlot) : null;
}

// Lv60 前(或玩家自己關掉 AUTO)是手動模式:冷卻好了不會自動在下次擊殺生效,要等玩家
// 點過那顆技能(armedSlots 記到)才算數,呼應「新增AUTO自動釋放按鈕,滿60等前需自行點擊」
// 的設計——冷卻判定本身不變,差別只在「冷卻好了」跟「真的觸發」中間多一道玩家操作。
function applyActiveSkillTriggers(
  slotLevels: Record<ActiveSkillSlotId, number>,
  timers: Record<ActiveSkillSlotId, number>,
  getEffect: (slot: ActiveSkillSlotId) => ActiveEffectKind | null,
  now: number,
  exp: number,
  coins: number,
  forceInstantNextFight: boolean,
  autoMode: boolean,
  armedSlots: Partial<Record<ActiveSkillSlotId, true>>
): ActiveSkillTriggerResult {
  const nextTimers = { ...timers };
  const firedSlots: ActiveSkillSlotId[] = [];
  let triggered = false;
  for (const slot of ACTIVE_SLOT_IDS) {
    if (slotLevels[slot] <= 0) continue;
    const intervalMs = activeSkillTriggerIntervalSeconds(slot, slotLevels[slot]) * 1000;
    if (now - timers[slot] < intervalMs) continue;
    if (!autoMode && !armedSlots[slot]) continue;
    const effect = getEffect(slot);
    if (effect === null) continue;
    nextTimers[slot] = now;
    firedSlots.push(slot);
    triggered = true;
    if (effect === 'doubleReward') {
      exp *= 2;
      coins *= 2;
    } else if (effect === 'bonusCoins') {
      coins += getBonusCoinsAmount();
    } else if (effect === 'expBoost') {
      exp += getExpBoostAmount();
    } else if (effect === 'instantFinish') {
      forceInstantNextFight = true;
    }
  }
  return { timers: nextTimers, exp, coins, forceInstantNextFight, triggered, firedSlots };
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
  skillTree: SkillTreeLevels,
  studentSkillTree: Record<SkillSlotId, number>,
  hasChosenJob: boolean
): { exp: number; coins: number } {
  const studentBonus = {
    exp: getPassiveBonusValue(studentSkillTree.passive1),
    coins: getPassiveBonusValue(studentSkillTree.passive2),
  };
  if (!hasChosenJob) return studentBonus;
  const jobSlots = skillTree[job.archetype];
  return {
    exp: studentBonus.exp + getPassiveBonusValue(jobSlots.passive1),
    coins: studentBonus.coins + getPassiveBonusValue(jobSlots.passive2),
  };
}

function computeRewardMultipliers(
  job: JobSelection,
  level: number,
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
  const jobMultiplier = currentJobMultiplier(job, level, secondaryJob, hasChosenJob);
  const equipmentBonus = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const companionBonus = getCompanionBonusTotals(companions);
  const companionGearBonus = getCompanionGearBonusTotals(companionGear);
  const passiveBonus = computePassiveSkillBonus(job, skillTree, studentSkillTree, hasChosenJob);
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
  // 轉職試煉副本(見 game/dungeon.ts):6 個職業共用同一份入場券池,打贏保證掉指定職業的轉職碎片。
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
  // 在右側任務徽章的成就區塊(見 DailyQuestBadge.tsx)看到的「待領取」清單。
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
  forceInstantNextFight: boolean;
  // AUTO 關掉時(玩家自己選的手動模式)技能不會自動觸發,玩家要在冷卻好之後自己點一下技能
  // 圖示才算「已預備」,armSkill action 把對應欄位記到這裡,下次擊殺結算時 tickBattle 才會
  // 真的套用效果並清掉這個記錄。跟 activeSkillTimers 一樣不存檔——只是「這輪冷卻好了有沒有
  // 被點過」的暫時狀態,不是需要跨 session 保留的進度。
  armedActiveSkills: Partial<Record<ActiveSkillSlotId, true>>;
  armedStudentActiveSkills: Partial<Record<ActiveSkillSlotId, true>>;
  armedSecondarySkill: boolean;
  // AUTO 開關本身也不存檔,每次重開預設回到開啟——避免額外碰存檔 schema(見 lib/storage.ts
  // 的版本遷移機制),對玩家來說差別只是重開後要記得再關一次,不影響進度。預設就是 AUTO,
  // 手動點擊改成玩家自己選擇要不要關掉 AUTO 才會用到的節奏感選項,不再是 Lv60 前的強制門檻
  // (呼應「AUTO預設開啟,手動點擊改為加速選項」的設計調整)。
  autoSkillsEnabled: boolean;
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
  setSecondaryJob: (archetype: Archetype | null) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
  purchaseItem: (itemId: string) => void;
  setBodyType: (bodyType: BodyType) => void;
  upgradeSkillSlot: (archetype: Archetype, slot: SkillSlotId) => void;
  upgradeStudentSkillSlot: (slot: SkillSlotId) => void;
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
  socketGem: (itemId: string, socketIndex: number, gemType: GemType) => void;
  unsocketGem: (itemId: string, socketIndex: number) => void;
  claimDailyQuest: () => void;
  claimDailyTask: (id: DailyTaskId) => void;
  claimWeeklyChallenge: (id: string) => void;
  upgradeAscension: (id: AscensionUpgradeId) => void;
  claimAchievement: (id: string) => void;
  claimAllAchievements: () => void;
  // Lv60 前(或 AUTO 關掉時)手動點技能圖示用——只有冷卻好的欄位點了才算數,點還在倒數中的
  // 欄位不會有任何效果(SkillTracker.tsx 呼叫前會先自己判斷 secondsLeft<=0,這裡再擋一次
  // 純防呆)。kind 區分要記到職業/學生/副職哪一組 armed 狀態,job/student 兩組要帶 slot,
  // secondary 固定只有 active1 一格所以不用帶。
  armSkill: (kind: 'job' | 'student', slot: ActiveSkillSlotId) => void;
  armSecondarySkill: () => void;
  toggleAutoSkills: () => void;
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
// 獎勵改由玩家在右側任務徽章的成就區塊按「領取」觸發(見 claimAchievement/claimAllAchievements),避免玩家
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
    useToast.getState().show(`達成了 ${newlyUnlocked.length} 個成就(可到右側任務徽章的成就區塊領取獎勵)`);
  } else {
    const def = ACHIEVEMENTS[newlyUnlocked[0]];
    useToast.getState().show(`達成成就:${def.title}(可到右側任務徽章的成就區塊領取獎勵)`);
  }
}

export const useGameState = create<GameState>((set, get) => ({
  isLoaded: false,
  level: createInitialLevelState(),
  trigger: createInitialTriggerState(),
  job: DEFAULT_JOB,
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
  forceInstantNextFight: false,
  armedActiveSkills: {},
  armedStudentActiveSkills: {},
  armedSecondarySkill: false,
  autoSkillsEnabled: true,
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
      save.level.level,
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
      getCurrentTier(save.level.level),
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

    set({
      level,
      trigger: save.trigger,
      job: save.job,
      equipment: save.equipment,
      bodyType: save.bodyType,
      skillTree: save.skillTree,
      activeSkillLoadout: save.activeSkillLoadout,
      studentSkillTree: save.studentSkillTree,
      gender: save.gender,
      coins,
      unlockedItemIds: save.unlockedItemIds,
      companions: save.companions,
      companionGear: save.companionGear,
      // 入場券回補跟離線收益同一套精神:玩家關掉遊戲一段時間回來,票要照經過的時間回補,
      // 不能等到玩家手動點進副本分頁才觸發。
      dungeon: applyDungeonTicketRegen(save.dungeon),
      secondaryJob: save.secondaryJob,
      itemInstances,
      enhanceStones: save.enhanceStones,
      gemCounts: save.gemCounts,
      skillBooks: save.skillBooks,
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
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
      activeSkillTimers: { active1: Date.now(), active2: Date.now(), active3: Date.now(), active4: Date.now() },
      studentActiveSkillTimers: { active1: Date.now(), active2: Date.now(), active3: Date.now(), active4: Date.now() },
      secondarySkillTimerStartedAt: Date.now(),
      armedActiveSkills: {},
      armedStudentActiveSkills: {},
      armedSecondarySkill: false,
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
      (state.hasChosenJob ? getPassiveBonusValue(state.skillTree[state.job.archetype].passive3) : 0);
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
        state.level.level,
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
      const bossTier = getCurrentTier(state.level.level);
      const heroSchool = getArchetypeComposition(state.job.archetype).damageType;
      const attackPower = heroAttackPower(
        state.level.level,
        getCurrentTier(state.level.level),
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
      if (state.forceInstantNextFight) {
        encounter.fightDurationMs = 0;
      }
      set({
        currentEncounter: encounter,
        trigger: encounter.triggerState,
        fightStartedAt: Date.now(),
        fightElapsedMs: 0,
        heroClicksThisFight: 0,
        forceInstantNextFight: false,
        defeatRecoveryUntil: null,
      });
      persist(get());
      return;
    }

    const elapsed = Date.now() - state.fightStartedAt;
    if (elapsed < state.currentEncounter.fightDurationMs) {
      set({ fightElapsedMs: elapsed });
      return;
    }

    const { expMultiplier, coinMultiplier } = computeRewardMultipliers(
      state.job,
      state.level.level,
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
      getCurrentTier(state.level.level),
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
      });
      persist(get());
      return;
    }

    const event = getRandomEvent(state.currentEncounter.rarity);
    const nextStageProgress = advanceStageProgress(state.stageProgress);

    // 主動技能:4 個技能欄位(active1-4)各自獨立秒數倒數,固定不受戰鬥/關卡時長影響,
    // 全部同時運作、可以同一擊一起觸發,倒數滿了在下一次擊殺結算時套用效果。
    // AUTO 開著(預設值)就是全自動(冷卻好就發動);玩家自己關掉才是手動模式,冷卻好只是
    // 「可以點了」,要玩家自己點過(armedActiveSkills/armedStudentActiveSkills 記到)才會在
    // 這次結算生效。
    const now = Date.now();
    let exp = reward.exp;
    let coins = reward.coins;
    let forceInstantNextFight = state.forceInstantNextFight;
    let lastSkillTriggerAt = state.lastSkillTriggerAt;
    let anySkillTriggered = false;
    const autoMode = state.autoSkillsEnabled;

    // 學生主動技能:畢業後不會失效,永遠跟職業主動技能並存,用自己獨立的一組計時器
    // (見 game/studentSkillTree.ts 的 getStudentActiveEffectKind,不吃 archetype)。
    const studentTrigger = applyActiveSkillTriggers(
      state.studentSkillTree,
      state.studentActiveSkillTimers,
      getStudentActiveEffectKind,
      now,
      exp,
      coins,
      forceInstantNextFight,
      autoMode,
      state.armedStudentActiveSkills
    );
    const nextStudentActiveSkillTimers = studentTrigger.timers;
    exp = studentTrigger.exp;
    coins = studentTrigger.coins;
    forceInstantNextFight = studentTrigger.forceInstantNextFight;
    anySkillTriggered = anySkillTriggered || studentTrigger.triggered;
    const nextArmedStudentActiveSkills = omitArmedSlots(state.armedStudentActiveSkills, studentTrigger.firedSlots);

    // 職業主動技能:畢業前(!hasChosenJob)還沒有主職可以套用,跳過這組計時器。
    let nextActiveSkillTimers = state.activeSkillTimers;
    let nextArmedActiveSkills = state.armedActiveSkills;
    let jobFiredSlots: ActiveSkillSlotId[] = [];
    if (state.hasChosenJob) {
      const jobTrigger = applyActiveSkillTriggers(
        resolveLoadoutLevels(state.activeSkillLoadout, state.skillTree),
        state.activeSkillTimers,
        (slot) => resolveLoadoutEffectKind(state.activeSkillLoadout, slot),
        now,
        exp,
        coins,
        forceInstantNextFight,
        autoMode,
        state.armedActiveSkills
      );
      nextActiveSkillTimers = jobTrigger.timers;
      exp = jobTrigger.exp;
      coins = jobTrigger.coins;
      forceInstantNextFight = jobTrigger.forceInstantNextFight;
      anySkillTriggered = anySkillTriggered || jobTrigger.triggered;
      nextArmedActiveSkills = omitArmedSlots(state.armedActiveSkills, jobTrigger.firedSlots);
      jobFiredSlots = jobTrigger.firedSlots;
    }
    if (anySkillTriggered) {
      lastSkillTriggerAt = now;
      // 職業樹分階疊加效果:tier2起才有,且是一次觸發批次只套用一次(不會因為剛好4格
      // 同時觸發就疊加4次)——見 game/skillTree.ts 的 getTierTriggerBonus 設計說明。
      const tierBonus = getTierTriggerBonus(getCurrentTier(state.level.level));
      coins += Math.round(coins * tierBonus.bonusCoinMult) + tierBonus.bonusFlatCoins;
      exp += Math.round(exp * tierBonus.bonusExpMult);
      if (Math.random() < tierBonus.extraInstantChance) forceInstantNextFight = true;
    }

    // 副職只借用它的主動技能第1格(該職業招牌效果),間隔是本職的兩倍,跟主職各自獨立計時、
    // 可以同一擊同時觸發,呼應副職只拿「部分加成」的定位。跟上面兩組一樣吃 autoMode/armed 判斷。
    let nextSecondarySkillTimerStartedAt = state.secondarySkillTimerStartedAt;
    let lastSecondarySkillTriggerAt = state.lastSecondarySkillTriggerAt;
    let nextArmedSecondarySkill = state.armedSecondarySkill;
    let secondaryTriggered = false;
    if (state.secondaryJob) {
      const secondarySkillLevel = state.skillTree[state.secondaryJob].active1;
      const secondaryIntervalMs = secondaryActiveSkillTriggerIntervalSeconds(secondarySkillLevel) * 1000;
      const secondaryReady = now - state.secondarySkillTimerStartedAt >= secondaryIntervalMs;
      secondaryTriggered = secondarySkillLevel > 0 && secondaryReady && (autoMode || state.armedSecondarySkill);
      nextSecondarySkillTimerStartedAt = secondaryTriggered ? now : state.secondarySkillTimerStartedAt;
      if (secondaryTriggered) {
        const secondaryEffect = getActiveEffectKind(state.secondaryJob, 'active1');
        if (secondaryEffect === 'doubleReward') {
          exp *= 2;
          coins *= 2;
        } else if (secondaryEffect === 'bonusCoins') {
          coins += getBonusCoinsAmount();
        } else if (secondaryEffect === 'expBoost') {
          exp += getExpBoostAmount();
        } else if (secondaryEffect === 'instantFinish') {
          forceInstantNextFight = true;
        }
        lastSecondarySkillTriggerAt = now;
        nextArmedSecondarySkill = false;
      }
    }

    // 手動模式(未滿Lv60或玩家自己關掉AUTO)下,技能發動只有圖示閃一下、沒有文字提示,
    // 玩家點了 active2-4 之後很容易搞不清楚「到底有沒有生效」——這裡補一則 toast 直接報
    // 觸發了哪些技能,自動模式下省略(全自動運作時每次擊殺都可能觸發,跳出來只會洗版)。
    if (!autoMode) {
      const firedNames: string[] = [];
      for (const slot of studentTrigger.firedSlots) {
        firedNames.push(getStudentSkillFlavor(state.level.level, slot).name);
      }
      if (state.hasChosenJob) {
        for (const slot of jobFiredSlots) {
          const ref = state.activeSkillLoadout[slot];
          if (ref) firedNames.push(SKILL_SLOT_NAMES[ref.archetype][ref.sourceSlot]);
        }
      }
      if (state.secondaryJob && secondaryTriggered) {
        firedNames.push(SKILL_SLOT_NAMES[state.secondaryJob].active1);
      }
      if (firedNames.length > 0) {
        useToast.getState().show(`技能發動:${firedNames.join('、')}`);
      }
    }

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

    // 強化石/寶石/技能書掉落:各自獨立判定,互不干擾、跟寵物掉落同一套邏輯。掉落一律只給初階
    // (見 grantBasicMaterial 的說明),更高階要靠玩家自己合成。
    const nextEnhanceStones = grantBasicMaterial(state.enhanceStones, rollEnhanceStoneDrop() ? 1 : 0);
    const gemDrop = rollGemDrop();
    const nextGemCounts = gemDrop ? { ...state.gemCounts, [gemDrop]: state.gemCounts[gemDrop] + 1 } : state.gemCounts;
    const nextSkillBooks = grantBasicMaterial(state.skillBooks, rollSkillBookDrop() ? 1 : 0);

    // 裝備掉落:免費直接解鎖一件當前職業/等級穿得下的付費款,豐富擊殺獎勵種類,
    // 跟上面幾種掉落一樣各自獨立判定、互不影響。
    const equipmentDrop = rollEquipmentDrop(state.job.archetype, state.level.level, state.unlockedItemIds);
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
      armedActiveSkills: nextArmedActiveSkills,
      armedStudentActiveSkills: nextArmedStudentActiveSkills,
      armedSecondarySkill: nextArmedSecondarySkill,
      forceInstantNextFight,
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
    const spent = spendDungeonTicket(state.dungeon);
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
      (state.hasChosenJob ? getPassiveBonusValue(state.skillTree[state.job.archetype].passive3) : 0);
    const lifestealBonus = substatTotals.lifesteal + passive3Bonus;
    const healthResult = resolveFightHealth(
      state.heroHp,
      heroMaxHp(state.level.level),
      state.level.level,
      getCurrentTier(state.level.level),
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
    const { job, secondaryJob, equipment, transferProofs, transferFragments, hasChosenJob, level } = get();

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
        equipment: filterLoadoutForArchetype(equipment, archetype),
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
      equipment: filterLoadoutForArchetype(equipment, archetype),
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
    if (!item || !canEquipItem(item, job.archetype, level.level)) return;
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
    if (!canEquipItem(item, job.archetype, level.level)) return;

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
      level,
    } = get();
    const item = getItemById(itemId);
    const instance = itemInstances[itemId];
    if (!item || !instance) return;
    if (instance.enhanceLevel >= ENHANCE_MAX_LEVEL) return;

    // 強化石分階制(見 game/materials.ts):要用哪一階的石頭,直接對應目前職業階級,不對應
    // 強化目標等級本身——跟技能書的分階規則完全一樣。
    const materialTier = currentMaterialTier(hasChosenJob, getCurrentTier(level.level));
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

  purchaseGem: (gemType) => {
    const { coins, gemCounts } = get();
    const price = GEM_SPECS[gemType].price;
    if (coins < price) return;
    set({ coins: coins - price, gemCounts: { ...gemCounts, [gemType]: gemCounts[gemType] + 1 } });
    persist(get());
  },

  // 鑲嵌:插槽必須是空的才能鑲(要換款先 unsocketGem)。拔除寶石原樣退回背包,不會損毀。
  socketGem: (itemId, socketIndex, gemType) => {
    const { gemCounts, itemInstances } = get();
    const instance = itemInstances[itemId];
    if (!instance) return;
    if (socketIndex < 0 || socketIndex >= instance.socketedGems.length) return;
    if (instance.socketedGems[socketIndex] !== null) return;
    if (gemCounts[gemType] <= 0) return;

    const nextSockets = [...instance.socketedGems];
    nextSockets[socketIndex] = gemType;

    set({
      gemCounts: { ...gemCounts, [gemType]: gemCounts[gemType] - 1 },
      itemInstances: { ...itemInstances, [itemId]: { ...instance, socketedGems: nextSockets } },
    });
    checkAndUnlockAchievements(get, set);
    persist(get());
  },

  unsocketGem: (itemId, socketIndex) => {
    const { gemCounts, itemInstances } = get();
    const instance = itemInstances[itemId];
    if (!instance) return;
    const gemType = instance.socketedGems[socketIndex];
    if (!gemType) return;

    const nextSockets = [...instance.socketedGems];
    nextSockets[socketIndex] = null;

    set({
      gemCounts: { ...gemCounts, [gemType]: gemCounts[gemType] + 1 },
      itemInstances: { ...itemInstances, [itemId]: { ...instance, socketedGems: nextSockets } },
    });
    persist(get());
  },

  setBodyType: (bodyType) => {
    set({ bodyType });
    persist(get());
  },

  upgradeSkillSlot: (archetype, slot) => {
    const { level, skillTree, skillBooks } = get();
    const tier = getCurrentTier(level.level);
    // 技能書分階制(見 game/materials.ts):要用哪一階的書,直接對應目前職業階級,不對應
    // 這一格技能本身的等級——這個 action 只在畢業後(hasChosenJob)才會被呼叫到,所以這裡
    // 直接傳 true。
    const materialTier = currentMaterialTier(true, tier);
    const currentSlotLevel = skillTree[archetype][slot];
    if (!canUpgradeSkillSlot(currentSlotLevel, tier, skillBooks[materialTier])) return;

    const bookCost = skillSlotUpgradeBookCost(currentSlotLevel);
    const nextSkillTree: SkillTreeLevels = {
      ...skillTree,
      [archetype]: { ...skillTree[archetype], [slot]: nextSkillSlotLevel(currentSlotLevel, tier) },
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
        if (amount) nextGemCounts[gemType] += amount;
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
  // 要玩家在右側任務徽章的成就區塊按這個才真的發獎勵並記進 claimedAchievementIds。發獎邏輯照抄舊版
  // checkAndUnlockAchievements 自動發獎年代的那段計算。
  claimAchievement: (id) => {
    const { unlockedAchievementIds, claimedAchievementIds, coins, enhanceStones, gemCounts } = get();
    if (!unlockedAchievementIds.includes(id) || claimedAchievementIds.includes(id)) return;
    const def = ACHIEVEMENTS[id];
    if (!def) return;

    const reward = def.reward;
    const nextGemCounts: GemCounts = { ...gemCounts };
    if (reward.gems) {
      for (const gemType of GEM_TYPES) {
        const amount = reward.gems[gemType];
        if (amount) nextGemCounts[gemType] += amount;
      }
    }

    set({
      coins: coins + reward.coins,
      enhanceStones: grantBasicMaterial(enhanceStones, reward.enhanceStones ?? 0),
      gemCounts: nextGemCounts,
      claimedAchievementIds: [...claimedAchievementIds, id],
    });
    persist(get());
    useToast.getState().show(`領取成就獎勵:${def.title}(+${reward.coins}金幣)`);
  },

  // 一鍵領取全部:找出「條件達成但還沒領」的全部id,一次性 set()+persist(),不逐筆各自 set()
  // (效能跟reduce邏輯都比較乾淨)。
  claimAllAchievements: () => {
    const { unlockedAchievementIds, claimedAchievementIds, coins, enhanceStones, gemCounts } = get();
    const claimableIds = unlockedAchievementIds.filter((id) => !claimedAchievementIds.includes(id));
    if (claimableIds.length === 0) return;

    let nextCoins = coins;
    let nextEnhanceStones = enhanceStones;
    const nextGemCounts: GemCounts = { ...gemCounts };
    for (const id of claimableIds) {
      const reward = ACHIEVEMENTS[id].reward;
      nextCoins += reward.coins;
      nextEnhanceStones = grantBasicMaterial(nextEnhanceStones, reward.enhanceStones ?? 0);
      if (reward.gems) {
        for (const gemType of GEM_TYPES) {
          const amount = reward.gems[gemType];
          if (amount) nextGemCounts[gemType] += amount;
        }
      }
    }

    set({
      coins: nextCoins,
      enhanceStones: nextEnhanceStones,
      gemCounts: nextGemCounts,
      claimedAchievementIds: [...claimedAchievementIds, ...claimableIds],
    });
    persist(get());
    useToast.getState().show(`一次領取了 ${claimableIds.length} 個成就獎勵`);
  },

  armSkill: (kind, slot) => {
    const state = get();
    const jobRef = state.activeSkillLoadout[slot];
    const level =
      kind === 'job'
        ? jobRef
          ? state.skillTree[jobRef.archetype][jobRef.sourceSlot]
          : 0
        : state.studentSkillTree[slot];
    // Lv.0(還沒點過這個技能)不能被點擊發動,純防呆(SkillTracker.tsx 正常不會讓 Lv.0
    // 的圖示觸發這個 action,onPress 在那邊已經擋掉了)。
    if (level <= 0) return;
    const timerStartedAt = kind === 'job' ? state.activeSkillTimers[slot] : state.studentActiveSkillTimers[slot];
    const intervalMs = activeSkillTriggerIntervalSeconds(slot, level) * 1000;
    // 還在倒數中點了不算數,純防呆(SkillTracker.tsx 正常不會讓還在倒數的圖示觸發這個 action)。
    if (Date.now() - timerStartedAt < intervalMs) return;
    const armedUpdate =
      kind === 'job'
        ? { armedActiveSkills: { ...state.armedActiveSkills, [slot]: true } }
        : { armedStudentActiveSkills: { ...state.armedStudentActiveSkills, [slot]: true } };
    set({ ...armedUpdate, ...forceResolveCurrentFightUpdate(state) });
  },

  armSecondarySkill: () => {
    const state = get();
    if (!state.secondaryJob) return;
    const level = state.skillTree[state.secondaryJob].active1;
    if (level <= 0) return;
    const intervalMs = secondaryActiveSkillTriggerIntervalSeconds(level) * 1000;
    if (Date.now() - state.secondarySkillTimerStartedAt < intervalMs) return;
    set({ armedSecondarySkill: true, ...forceResolveCurrentFightUpdate(state) });
  },

  toggleAutoSkills: () => {
    set((state) => ({ autoSkillsEnabled: !state.autoSkillsEnabled }));
  },

  setActiveSkillLoadout: (position, ref) => {
    const state = get();
    // 清空這格一定合法;指到某個技能的話,那個技能一定要「已經投資過等級」才能放進來——
    // 呼應「從已學習的職業技能中選擇」的需求,UI 本來就只會列出已學過的選項,這裡再擋一次
    // 純防呆(避免透過非正規管道塞進一個等級 0、還沒點過的技能)。
    if (ref !== null && state.skillTree[ref.archetype][ref.sourceSlot] <= 0) return;
    set({ activeSkillLoadout: { ...state.activeSkillLoadout, [position]: ref } });
    persist(get());
  },
}));
