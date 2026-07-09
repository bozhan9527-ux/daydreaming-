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
  createEmptyItemInstances,
  createEmptyLoadout,
  createEmptyUnlockedItems,
  equipItem,
  EquipmentLoadout,
  filterLoadoutForArchetype,
  Gender,
  getEquipmentBonusTotals,
  getGenderUnlockItems,
  getIdentifyCost,
  getItemById,
  getSubstatTotals,
  isItemUnlocked,
  ItemInstances,
  rollItemInstance,
  unequipSlot,
  unlockItem,
  EquipmentSlot,
  UnlockedItemIds,
} from '../game/equipment';
import { getRandomEvent, GameEvent } from '../game/events';
import { accumulateExp, calcOfflineExp, createInitialLevelState, LevelState, levelUp as applyLevelUp } from '../game/leveling';
import {
  canUpgradeSkill,
  createInitialSkillLevels,
  getBonusCoinsAmount,
  getSkillEffectKind,
  secondarySkillTriggerInterval,
  SkillLevels,
  skillTriggerInterval,
  skillUpgradeCoinCost,
  skillUpgradeCost,
  upgradeSkill as nextSkillLevel,
} from '../game/skills';
import { BodyType } from '../game/sprites/heroSilhouette';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { JobSelection, loadSave, writeSave } from '../lib/storage';
import { playEvent, playLevelUp, playSkillUpgrade } from '../lib/sounds';

const SAVE_SCHEMA_VERSION = 12;

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

// 職業倍率只影響經驗;裝備跟寵物/坐騎的 exp/coins/speed 加成疊加在職業倍率之上。
function computeRewardMultipliers(
  job: JobSelection,
  level: number,
  equipment: EquipmentLoadout,
  companions: CompanionState,
  secondaryJob: Archetype | null
): RewardMultipliers {
  const jobMultiplier = currentJobMultiplier(job, level, secondaryJob);
  const equipmentBonus = getEquipmentBonusTotals(equipment);
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
  lastOfflineGain: number;
  lastOfflineKills: number;
  lastOfflineCoins: number;
  currentEncounter: Encounter | null;
  fightStartedAt: number | null;
  fightElapsedMs: number;
  killCount: number;
  lastEvent: GameEvent | null;
  lastCompanionDropId: string | null;
  skillKillsSinceTrigger: number;
  secondarySkillKillsSinceTrigger: number;
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
  lastOfflineGain: 0,
  lastOfflineKills: 0,
  lastOfflineCoins: 0,
  currentEncounter: null,
  fightStartedAt: null,
  fightElapsedMs: 0,
  killCount: 0,
  lastEvent: null,
  lastCompanionDropId: null,
  skillKillsSinceTrigger: 0,
  secondarySkillKillsSinceTrigger: 0,
  forceInstantNextFight: false,

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    const baseGain = calcOfflineExp(save.level.level, elapsedMs);
    const { expMultiplier, coinMultiplier, speedMultiplier } = computeRewardMultipliers(
      save.job,
      save.level.level,
      save.equipment,
      save.companions,
      save.secondaryJob
    );
    const gainedExp = Math.floor(baseGain * expMultiplier);
    const level = accumulateExp(save.level, gainedExp);

    // 背景/關閉期間沒有畫面可以真的打怪,離線期間用平均戰鬥時長反推大概擊敗幾隻、賺多少金幣
    // (風味數字,經驗值仍然是上面 calcOfflineExp 那套沒變的公式在算),跟前景同一套裝備/寵物加成。
    const offlineBattle = estimateOfflineBattleResult(elapsedMs, speedMultiplier, coinMultiplier);
    const coins = save.coins + offlineBattle.coins;

    // 補齊舊存檔(v11 以前)已經擁有的裝備(含免費起始款,免費款不會出現在 unlockedItemIds 裡)
    // 的隨機/隱藏素質,不用等玩家重新裝備一次才生效。
    const ownedItemIds = [...save.unlockedItemIds, ...Object.values(save.equipment).filter((id): id is string => !!id)];
    const itemInstances = backfillItemInstances(ownedItemIds, save.itemInstances);

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
        state.secondaryJob
      );
      const encounter = generateEncounter(state.trigger, speedMultiplier);
      if (state.forceInstantNextFight) {
        encounter.fightDurationMs = 0;
      }
      set({
        currentEncounter: encounter,
        trigger: encounter.triggerState,
        fightStartedAt: Date.now(),
        fightElapsedMs: 0,
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
      state.secondaryJob
    );
    const reward = calcKillReward(state.currentEncounter.rarity, state.level.level, expMultiplier, coinMultiplier);
    const event = getRandomEvent(state.currentEncounter.rarity);

    // 主動技能:每打倒幾隻怪觸發一次(等級越高間隔越短),依目前職業的 subtype 決定效果——
    // 近戰=下一場戰鬥秒殺、遠程=這次擊殺獎勵翻倍、輔助=直接發一筆額外金幣。
    const currentSkillLevel = state.skills[state.job.archetype];
    const killsSinceTrigger = state.skillKillsSinceTrigger + 1;
    const interval = skillTriggerInterval(currentSkillLevel);
    const skillTriggered = killsSinceTrigger >= interval;
    const nextKillsSinceTrigger = skillTriggered ? 0 : killsSinceTrigger;

    let exp = reward.exp;
    let coins = reward.coins;
    let forceInstantNextFight = state.forceInstantNextFight;
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
    }

    // 副職的技能也會觸發,間隔是本職的兩倍,跟主職技能各自獨立計數、可以同一擊同時觸發。
    let nextSecondaryKillsSinceTrigger = state.secondarySkillKillsSinceTrigger;
    if (state.secondaryJob) {
      const secondarySkillLevel = state.skills[state.secondaryJob];
      const secondaryKillsSinceTrigger = state.secondarySkillKillsSinceTrigger + 1;
      const secondaryInterval = secondarySkillTriggerInterval(secondarySkillLevel);
      const secondaryTriggered = secondaryKillsSinceTrigger >= secondaryInterval;
      nextSecondaryKillsSinceTrigger = secondaryTriggered ? 0 : secondaryKillsSinceTrigger;
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

    const nextLevel = accumulateExp(state.level, exp);
    const nextCoins = state.coins + coins;

    set({
      level: nextLevel,
      coins: nextCoins,
      companions: nextCompanions,
      killCount: state.killCount + 1,
      lastEvent: event,
      lastCompanionDropId,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
      skillKillsSinceTrigger: nextKillsSinceTrigger,
      secondarySkillKillsSinceTrigger: nextSecondaryKillsSinceTrigger,
      forceInstantNextFight,
    });
    persist(get());
    playEvent(state.currentEncounter.rarity);
  },

  // 點擊勇者可以搶快一點打完當前這隻怪(縮短剩餘時間),不是回到舊版的點擊觸發機制。
  boostCurrentFight: () => {
    const { currentEncounter, fightStartedAt } = get();
    if (!currentEncounter || fightStartedAt === null) return;
    const BOOST_MS = 400;
    set({ fightStartedAt: fightStartedAt - BOOST_MS });
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
    set({ secondaryJob: archetype, secondarySkillKillsSinceTrigger: 0 });
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
