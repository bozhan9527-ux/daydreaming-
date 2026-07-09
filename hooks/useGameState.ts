import { create } from 'zustand';

import { calcKillReward, Encounter, estimateOfflineBattleResult, generateEncounter } from '../game/battle';
import {
  CompanionKind,
  CompanionState,
  createEmptyCompanionState,
  equipCompanion,
  getCompanionBonusTotals,
  getCompanionById,
  isCompanionUnlocked,
  rollCompanionDrop,
  unequipCompanion,
  unlockCompanion,
} from '../game/companions';
import { Archetype, calcCombatMultiplier, calcSecondaryCombatBonus, canUnlockDualClass, getCurrentTier, JobBranch } from '../game/combat';
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
  getSubstatTotals,
  isItemUnlocked,
  ItemInstances,
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
import { getRandomEvent, GameEvent } from '../game/events';
import { accumulateExp, calcOfflineExp, createInitialLevelState, LevelState, levelUp as applyLevelUp } from '../game/leveling';
import {
  canUpgradeSkill,
  createInitialSkillLevels,
  getBonusCoinsAmount,
  getSkillEffectKind,
  secondarySkillTriggerIntervalSeconds,
  SkillLevels,
  skillTriggerIntervalSeconds,
  skillUpgradeCoinCost,
  skillUpgradeCost,
  upgradeSkill as nextSkillLevel,
} from '../game/skills';
import { BodyType } from '../game/sprites/heroSilhouette';
import {
  advanceStageProgress,
  createInitialStageProgress,
  getStageDifficultyMultiplier,
  isBossSubStage,
  isFinalBossStage,
  StageProgress,
} from '../game/stages';
import { bumpPityFromClick, createInitialTriggerState, TriggerState } from '../game/trigger';
import { JobSelection, loadSave, writeSave } from '../lib/storage';
import { playEvent, playLevelUp, playSkillUpgrade } from '../lib/sounds';

const SAVE_SCHEMA_VERSION = 14;

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
function currentJobMultiplier(job: JobSelection, level: number, secondaryJob: Archetype | null): number {
  const tier = getCurrentTier(level);
  const primary = calcCombatMultiplier(job.archetype, tier);
  const secondaryBonus = secondaryJob ? calcSecondaryCombatBonus(secondaryJob, tier) : 0;
  return primary + secondaryBonus;
}

interface RewardMultipliers {
  expMultiplier: number;
  coinMultiplier: number;
  speedMultiplier: number;
}

// 職業倍率只影響經驗;裝備(含強化+鑲嵌寶石)跟寵物/坐騎的 exp/coins/speed 加成疊加在職業倍率之上。
function computeRewardMultipliers(
  job: JobSelection,
  level: number,
  equipment: EquipmentLoadout,
  companions: CompanionState,
  secondaryJob: Archetype | null,
  itemInstances: ItemInstances
): RewardMultipliers {
  const jobMultiplier = currentJobMultiplier(job, level, secondaryJob);
  const equipmentBonus = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const companionBonus = getCompanionBonusTotals(companions);
  return {
    expMultiplier: jobMultiplier * (1 + equipmentBonus.exp + companionBonus.exp),
    coinMultiplier: 1 + equipmentBonus.coins + companionBonus.coins,
    speedMultiplier: 1 + equipmentBonus.speed + companionBonus.speed,
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
  skills: SkillLevels;
  gender: Gender;
  coins: number;
  unlockedItemIds: UnlockedItemIds;
  companions: CompanionState;
  secondaryJob: Archetype | null;
  itemInstances: ItemInstances;
  enhanceStones: number;
  gemCounts: GemCounts;
  stageProgress: StageProgress;
  lastEnhanceOutcome: string | null;
  lastOfflineGain: number;
  lastOfflineKills: number;
  lastOfflineCoins: number;
  currentEncounter: Encounter | null;
  fightStartedAt: number | null;
  fightElapsedMs: number;
  heroClicksThisFight: number;
  killCount: number;
  lastEvent: GameEvent | null;
  lastCompanionDropId: string | null;
  lastEquipmentDropId: string | null;
  lastCoinWindfall: number | null;
  // 技能倒數計時器起始時間戳(不存檔,重開只是倒數重新開始算),取代舊版的擊殺次數計數——
  // 用 Date.now() - skillTimerStartedAt 對比 skillTriggerIntervalSeconds() 的毫秒數判斷是否觸發。
  skillTimerStartedAt: number;
  secondarySkillTimerStartedAt: number;
  // 技能剛觸發的時間戳,不存檔,只給 UI 顯示「剛發動」的短暫閃光用,跟 lastEnhanceOutcome 同一套模式。
  lastSkillTriggerAt: number | null;
  lastSecondarySkillTriggerAt: number | null;
  forceInstantNextFight: boolean;
  load: () => Promise<void>;
  levelUp: (times: 1 | 5 | 10) => void;
  tickBattle: () => void;
  boostCurrentFight: () => void;
  setJob: (archetype: Archetype, branch: JobBranch) => void;
  setSecondaryJob: (archetype: Archetype | null) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
  purchaseItem: (itemId: string) => void;
  setBodyType: (bodyType: BodyType) => void;
  upgradeSkill: (archetype: Archetype) => void;
  setGender: (gender: Gender) => void;
  purchaseCompanion: (id: string) => void;
  unequipCompanionSlot: (kind: CompanionKind) => void;
  identifyItem: (itemId: string) => void;
  enhanceItem: (itemId: string) => void;
  purchaseEnhanceStone: () => void;
  purchaseGem: (gemType: GemType) => void;
  socketGem: (itemId: string, socketIndex: number, gemType: GemType) => void;
  unsocketGem: (itemId: string, socketIndex: number) => void;
}

type PersistableState = Pick<
  GameState,
  | 'level'
  | 'trigger'
  | 'job'
  | 'equipment'
  | 'bodyType'
  | 'skills'
  | 'gender'
  | 'coins'
  | 'unlockedItemIds'
  | 'companions'
  | 'secondaryJob'
  | 'itemInstances'
  | 'enhanceStones'
  | 'gemCounts'
  | 'stageProgress'
>;

function persist(state: PersistableState): void {
  writeSave({
    version: SAVE_SCHEMA_VERSION,
    level: state.level,
    trigger: state.trigger,
    job: state.job,
    equipment: state.equipment,
    bodyType: state.bodyType,
    skills: state.skills,
    gender: state.gender,
    coins: state.coins,
    unlockedItemIds: state.unlockedItemIds,
    companions: state.companions,
    secondaryJob: state.secondaryJob,
    itemInstances: state.itemInstances,
    enhanceStones: state.enhanceStones,
    gemCounts: state.gemCounts,
    stageProgress: state.stageProgress,
    lastActiveAt: Date.now(),
  });
}

export const useGameState = create<GameState>((set, get) => ({
  isLoaded: false,
  level: createInitialLevelState(),
  trigger: createInitialTriggerState(),
  job: DEFAULT_JOB,
  equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
  bodyType: DEFAULT_BODY_TYPE,
  skills: createInitialSkillLevels(),
  gender: DEFAULT_GENDER,
  coins: 0,
  unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
  companions: createEmptyCompanionState(),
  secondaryJob: null,
  itemInstances: createEmptyItemInstances(),
  enhanceStones: 0,
  gemCounts: createEmptyGemCounts(),
  stageProgress: createInitialStageProgress(),
  lastEnhanceOutcome: null,
  lastOfflineGain: 0,
  lastOfflineKills: 0,
  lastOfflineCoins: 0,
  currentEncounter: null,
  fightStartedAt: null,
  fightElapsedMs: 0,
  heroClicksThisFight: 0,
  killCount: 0,
  lastEvent: null,
  lastCompanionDropId: null,
  lastEquipmentDropId: null,
  lastCoinWindfall: null,
  skillTimerStartedAt: Date.now(),
  secondarySkillTimerStartedAt: Date.now(),
  lastSkillTriggerAt: null,
  lastSecondarySkillTriggerAt: null,
  forceInstantNextFight: false,

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    const baseGain = calcOfflineExp(save.level.level, elapsedMs);

    // 補齊舊存檔(v11 以前)已經擁有的裝備(含免費起始款,免費款不會出現在 unlockedItemIds 裡)
    // 的隨機/隱藏素質,不用等玩家重新裝備一次才生效。
    const ownedItemIds = [...save.unlockedItemIds, ...Object.values(save.equipment).filter((id): id is string => !!id)];
    const itemInstances = backfillItemInstances(ownedItemIds, save.itemInstances);

    const { expMultiplier, coinMultiplier, speedMultiplier } = computeRewardMultipliers(
      save.job,
      save.level.level,
      save.equipment,
      save.companions,
      save.secondaryJob,
      itemInstances
    );
    const gainedExp = Math.floor(baseGain * expMultiplier);
    const level = accumulateExp(save.level, gainedExp);

    // 背景/關閉期間沒有畫面可以真的打怪,離線期間用平均戰鬥時長反推大概擊敗幾隻、賺多少金幣
    // (風味數字,經驗值仍然是上面 calcOfflineExp 那套沒變的公式在算),跟前景同一套裝備/寵物加成。
    const offlineBattle = estimateOfflineBattleResult(elapsedMs, speedMultiplier, coinMultiplier);
    const coins = save.coins + offlineBattle.coins;

    set({
      level,
      trigger: save.trigger,
      job: save.job,
      equipment: save.equipment,
      bodyType: save.bodyType,
      skills: save.skills,
      gender: save.gender,
      coins,
      unlockedItemIds: save.unlockedItemIds,
      companions: save.companions,
      secondaryJob: save.secondaryJob,
      itemInstances,
      enhanceStones: save.enhanceStones,
      gemCounts: save.gemCounts,
      stageProgress: save.stageProgress,
      isLoaded: true,
      lastOfflineGain: gainedExp,
      lastOfflineKills: offlineBattle.kills,
      lastOfflineCoins: offlineBattle.coins,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
    });
    persist(get());
  },

  levelUp: (times) => {
    const { level } = get();
    const result = applyLevelUp(level, times);

    set({ level: result.state });
    persist(get());
    if (result.state.level > level.level) playLevelUp();
  },

  // 前景時每隔一小段時間呼叫一次(見 hooks/useBattleLoop.ts):沒有怪就生成一隻,
  // 有怪就檢查時間到了沒,到了就發獎勵、換下一隻。
  tickBattle: () => {
    const state = get();
    if (!state.isLoaded) return;

    if (!state.currentEncounter || state.fightStartedAt === null) {
      const { speedMultiplier } = computeRewardMultipliers(
        state.job,
        state.level.level,
        state.equipment,
        state.companions,
        state.secondaryJob,
        state.itemInstances
      );
      const isBoss = isBossSubStage(state.stageProgress.subStage);
      const isFinalBoss = isFinalBossStage(state.stageProgress.stage, state.stageProgress.subStage);
      const difficultyMultiplier = getStageDifficultyMultiplier(state.stageProgress);
      const encounter = generateEncounter(state.trigger, speedMultiplier, Math.random, isBoss, isFinalBoss, difficultyMultiplier);
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
      state.secondaryJob,
      state.itemInstances
    );
    // 關卡難度倍率:跟這隻怪生成當下用的是同一份 stageProgress(這次擊殺才會讓它晉級,
    // 所以算獎勵的當下它還沒變),疊加在等級/裝備既有的獎勵倍率之上,是完全獨立的另一條軸線。
    const difficultyMultiplier = getStageDifficultyMultiplier(state.stageProgress);
    const reward = calcKillReward(state.currentEncounter.rarity, state.level.level, expMultiplier, coinMultiplier, difficultyMultiplier);
    const event = getRandomEvent(state.currentEncounter.rarity);
    const nextStageProgress = advanceStageProgress(state.stageProgress);

    // 主動技能:改成真正的秒數倒數觸發(等級越高秒數越短),不再靠擊殺次數累計——
    // 倒數滿了才會在下一次擊殺結算時套用效果,依目前職業的 subtype 決定效果:
    // 近戰=下一場戰鬥秒殺、遠程=這次擊殺獎勵翻倍、輔助=直接發一筆額外金幣。
    const now = Date.now();
    const currentSkillLevel = state.skills[state.job.archetype];
    const skillIntervalMs = skillTriggerIntervalSeconds(currentSkillLevel) * 1000;
    const skillTriggered = now - state.skillTimerStartedAt >= skillIntervalMs;
    const nextSkillTimerStartedAt = skillTriggered ? now : state.skillTimerStartedAt;

    let exp = reward.exp;
    let coins = reward.coins;
    let forceInstantNextFight = state.forceInstantNextFight;
    let lastSkillTriggerAt = state.lastSkillTriggerAt;
    if (skillTriggered) {
      const effect = getSkillEffectKind(state.job.archetype);
      if (effect === 'doubleReward') {
        exp *= 2;
        coins *= 2;
      } else if (effect === 'bonusCoins') {
        coins += getBonusCoinsAmount();
      } else if (effect === 'instantFinish') {
        forceInstantNextFight = true;
      }
      lastSkillTriggerAt = now;
    }

    // 副職的技能也會觸發,間隔是本職的兩倍,跟主職技能各自獨立計時、可以同一擊同時觸發。
    let nextSecondarySkillTimerStartedAt = state.secondarySkillTimerStartedAt;
    let lastSecondarySkillTriggerAt = state.lastSecondarySkillTriggerAt;
    if (state.secondaryJob) {
      const secondarySkillLevel = state.skills[state.secondaryJob];
      const secondaryIntervalMs = secondarySkillTriggerIntervalSeconds(secondarySkillLevel) * 1000;
      const secondaryTriggered = now - state.secondarySkillTimerStartedAt >= secondaryIntervalMs;
      nextSecondarySkillTimerStartedAt = secondaryTriggered ? now : state.secondarySkillTimerStartedAt;
      if (secondaryTriggered) {
        const secondaryEffect = getSkillEffectKind(state.secondaryJob);
        if (secondaryEffect === 'doubleReward') {
          exp *= 2;
          coins *= 2;
        } else if (secondaryEffect === 'bonusCoins') {
          coins += getBonusCoinsAmount();
        } else if (secondaryEffect === 'instantFinish') {
          forceInstantNextFight = true;
        }
        lastSecondarySkillTriggerAt = now;
      }
    }

    // 裝備隨機/隱藏素質的爆擊率:獨立於技能觸發之外的機率,額外翻倍這次擊殺獎勵。
    const substatTotals = getSubstatTotals(state.equipment, state.itemInstances);
    if (Math.random() < substatTotals.critRate) {
      exp *= 2;
      coins *= 2;
    }

    // 寵物/坐騎額外掉落:跟主要稀有度事件的保底機制完全獨立判定,多數時候不會掉落。
    const companionDrop = rollCompanionDrop();
    let nextCompanions = state.companions;
    let lastCompanionDropId: string | null = null;
    if (companionDrop && !isCompanionUnlocked(nextCompanions, companionDrop.id)) {
      nextCompanions = unlockCompanion(nextCompanions, companionDrop.id);
      lastCompanionDropId = companionDrop.id;
    }

    // 強化石/寶石掉落:各自獨立判定,互不干擾、跟寵物掉落同一套邏輯。
    const nextEnhanceStones = state.enhanceStones + (rollEnhanceStoneDrop() ? 1 : 0);
    const gemDrop = rollGemDrop();
    const nextGemCounts = gemDrop ? { ...state.gemCounts, [gemDrop]: state.gemCounts[gemDrop] + 1 } : state.gemCounts;

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

    // 金幣意外之財:獨立判定,中了直接加一筆這次擊殺基礎金幣的倍數。
    const coinWindfall = rollCoinWindfall(coins);
    const lastCoinWindfall = coinWindfall > 0 ? coinWindfall : null;

    const nextLevel = accumulateExp(state.level, exp);
    const nextCoins = state.coins + coins + coinWindfall;

    set({
      level: nextLevel,
      coins: nextCoins,
      companions: nextCompanions,
      enhanceStones: nextEnhanceStones,
      gemCounts: nextGemCounts,
      unlockedItemIds: nextUnlockedItemIds,
      itemInstances: nextItemInstances,
      stageProgress: nextStageProgress,
      killCount: state.killCount + 1,
      lastEvent: event,
      lastCompanionDropId,
      lastEquipmentDropId,
      lastCoinWindfall,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
      skillTimerStartedAt: nextSkillTimerStartedAt,
      secondarySkillTimerStartedAt: nextSecondarySkillTimerStartedAt,
      lastSkillTriggerAt,
      lastSecondarySkillTriggerAt,
      forceInstantNextFight,
    });
    persist(get());
    playEvent(state.currentEncounter.rarity);
  },

  // 點擊勇者可以搶快一點打完當前這隻怪(縮短剩餘時間);同時每次點擊都算一次「觸發點擊」,
  // 推進保底計數器,提高下一次判定落到稀有以上的機率(當前這隻怪的稀有度已經生成好了,
  // 點擊影響的是下一隻)。每場戰鬥點擊能貢獻的保底次數設上限,避免瘋狂連點直接洗出保底。
  boostCurrentFight: () => {
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

  // 主職換成跟目前副職一樣的話,副職自動清空(不能兩職都選同一個);
  // 身上原本裝的職業鎖裝如果不符新主職,直接卸下(不限職業的款式不受影響)。
  setJob: (archetype, branch) => {
    const { secondaryJob, equipment } = get();
    const nextSecondaryJob = secondaryJob === archetype ? null : secondaryJob;
    set({
      job: { archetype, branch },
      secondaryJob: nextSecondaryJob,
      equipment: filterLoadoutForArchetype(equipment, archetype),
    });
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
    const { coins, itemInstances } = get();
    const item = getItemById(itemId);
    const instance = itemInstances[itemId];
    if (!item || !instance || instance.identified) return;
    const cost = getIdentifyCost(item);
    if (coins < cost) return;

    set({
      coins: coins - cost,
      itemInstances: { ...itemInstances, [itemId]: { ...instance, identified: true } },
    });
    persist(get());
  },

  // 花金幣+強化石嘗試 +1;Lv1~5 失敗只浪費資源,Lv6~10 失敗可能降級或直接損毀(從裝備欄跟
  // 已解鎖清單一併移除)。resistance 素質(裝備自己的,不是全身加總)拉低失敗率。
  enhanceItem: (itemId) => {
    const { coins, enhanceStones, itemInstances, equipment, unlockedItemIds } = get();
    const item = getItemById(itemId);
    const instance = itemInstances[itemId];
    if (!item || !instance) return;
    if (instance.enhanceLevel >= ENHANCE_MAX_LEVEL) return;

    const coinCost = getEnhanceCoinCost(item, instance.enhanceLevel);
    const stoneCost = getEnhanceStoneCost(instance.enhanceLevel);
    if (coins < coinCost || enhanceStones < stoneCost) return;

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
      enhanceStones: enhanceStones - stoneCost,
      itemInstances: nextInstances,
      equipment: nextEquipment,
      unlockedItemIds: nextUnlockedItemIds,
      lastEnhanceOutcome: message,
    });
    persist(get());
  },

  purchaseEnhanceStone: () => {
    const { coins, enhanceStones } = get();
    if (coins < ENHANCE_STONE_PRICE) return;
    set({ coins: coins - ENHANCE_STONE_PRICE, enhanceStones: enhanceStones + 1 });
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

  upgradeSkill: (archetype) => {
    const { level, skills, coins } = get();
    const currentSkillLevel = skills[archetype];
    if (!canUpgradeSkill(currentSkillLevel, level.bankedExp, coins)) return;

    const expCost = skillUpgradeCost(currentSkillLevel);
    const coinCost = skillUpgradeCoinCost(currentSkillLevel);
    const nextLevel: LevelState = { level: level.level, bankedExp: level.bankedExp - expCost };
    const nextSkills: SkillLevels = { ...skills, [archetype]: nextSkillLevel(currentSkillLevel) };

    set({ level: nextLevel, skills: nextSkills, coins: coins - coinCost });
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
    persist(get());
  },

  unequipCompanionSlot: (kind) => {
    const { companions } = get();
    set({ companions: unequipCompanion(companions, kind) });
    persist(get());
  },
}));
