import { create } from 'zustand';

import {
  calcKillReward,
  Encounter,
  estimateOfflineBattleResult,
  generateEncounter,
} from '../game/battle';
import { Archetype, calcCombatMultiplier, getCurrentTier, JobBranch } from '../game/combat';
import {
  applyGenderDefault,
  createEmptyLoadout,
  createEmptyUnlockedItems,
  equipItem,
  EquipmentLoadout,
  Gender,
  getGenderUnlockItems,
  getItemById,
  isItemUnlocked,
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

const DEFAULT_JOB: JobSelection = { archetype: 'physicalMelee', branch: 'A' };
const DEFAULT_BODY_TYPE: BodyType = 'normal';
const DEFAULT_GENDER: Gender = 'female';

function unlockedItemsForGender(gender: Gender): UnlockedItemIds {
  return getGenderUnlockItems(gender).reduce(
    (unlocked, itemId) => unlockItem(unlocked, itemId),
    createEmptyUnlockedItems()
  );
}

function currentJobMultiplier(job: JobSelection, level: number): number {
  const tier = getCurrentTier(level);
  return calcCombatMultiplier(job.archetype, tier);
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
  lastOfflineGain: number;
  lastOfflineKills: number;
  lastOfflineCoins: number;
  currentEncounter: Encounter | null;
  fightStartedAt: number | null;
  fightElapsedMs: number;
  killCount: number;
  lastEvent: GameEvent | null;
  skillKillsSinceTrigger: number;
  forceInstantNextFight: boolean;
  load: () => Promise<void>;
  levelUp: (times: 1 | 5 | 10) => void;
  tickBattle: () => void;
  boostCurrentFight: () => void;
  setJob: (archetype: Archetype, branch: JobBranch) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
  purchaseItem: (itemId: string) => void;
  setBodyType: (bodyType: BodyType) => void;
  upgradeSkill: (archetype: Archetype) => void;
  setGender: (gender: Gender) => void;
}

function persist(
  level: LevelState,
  trigger: TriggerState,
  job: JobSelection,
  equipment: EquipmentLoadout,
  bodyType: BodyType,
  skills: SkillLevels,
  gender: Gender,
  coins: number,
  unlockedItemIds: UnlockedItemIds
): void {
  writeSave({
    version: 9,
    level,
    trigger,
    job,
    equipment,
    bodyType,
    skills,
    gender,
    coins,
    unlockedItemIds,
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
  lastOfflineGain: 0,
  lastOfflineKills: 0,
  lastOfflineCoins: 0,
  currentEncounter: null,
  fightStartedAt: null,
  fightElapsedMs: 0,
  killCount: 0,
  lastEvent: null,
  skillKillsSinceTrigger: 0,
  forceInstantNextFight: false,

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    const baseGain = calcOfflineExp(save.level.level, elapsedMs);
    const jobMultiplier = currentJobMultiplier(save.job, save.level.level);
    const gainedExp = Math.floor(baseGain * jobMultiplier);
    const level = accumulateExp(save.level, gainedExp);

    // 背景/關閉期間沒有畫面可以真的打怪,離線期間用平均戰鬥時長反推大概擊敗幾隻、賺多少金幣
    // (風味數字,經驗值仍然是上面 calcOfflineExp 那套沒變的公式在算)。
    const offlineBattle = estimateOfflineBattleResult(elapsedMs, jobMultiplier);
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
      isLoaded: true,
      lastOfflineGain: gainedExp,
      lastOfflineKills: offlineBattle.kills,
      lastOfflineCoins: offlineBattle.coins,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
    });
    persist(level, save.trigger, save.job, save.equipment, save.bodyType, save.skills, save.gender, coins, save.unlockedItemIds);
  },

  levelUp: (times) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const result = applyLevelUp(level, times);

    set({ level: result.state });
    persist(result.state, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds);
    if (result.state.level > level.level) playLevelUp();
  },

  // 前景時每隔一小段時間呼叫一次(見 hooks/useBattleLoop.ts):沒有怪就生成一隻,
  // 有怪就檢查時間到了沒,到了就發獎勵、換下一隻。
  tickBattle: () => {
    const state = get();
    if (!state.isLoaded) return;

    if (!state.currentEncounter || state.fightStartedAt === null) {
      const encounter = generateEncounter(state.trigger);
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
      persist(
        state.level,
        encounter.triggerState,
        state.job,
        state.equipment,
        state.bodyType,
        state.skills,
        state.gender,
        state.coins,
        state.unlockedItemIds
      );
      return;
    }

    const elapsed = Date.now() - state.fightStartedAt;
    if (elapsed < state.currentEncounter.fightDurationMs) {
      set({ fightElapsedMs: elapsed });
      return;
    }

    const jobMultiplier = currentJobMultiplier(state.job, state.level.level);
    const reward = calcKillReward(state.currentEncounter.rarity, state.level.level, jobMultiplier);
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

    const nextLevel = accumulateExp(state.level, exp);
    const nextCoins = state.coins + coins;

    set({
      level: nextLevel,
      coins: nextCoins,
      killCount: state.killCount + 1,
      lastEvent: event,
      currentEncounter: null,
      fightStartedAt: null,
      fightElapsedMs: 0,
      skillKillsSinceTrigger: nextKillsSinceTrigger,
      forceInstantNextFight,
    });
    persist(
      nextLevel,
      state.trigger,
      state.job,
      state.equipment,
      state.bodyType,
      state.skills,
      state.gender,
      nextCoins,
      state.unlockedItemIds
    );
    playEvent(state.currentEncounter.rarity);
  },

  // 點擊勇者可以搶快一點打完當前這隻怪(縮短剩餘時間),不是回到舊版的點擊觸發機制。
  boostCurrentFight: () => {
    const { currentEncounter, fightStartedAt } = get();
    if (!currentEncounter || fightStartedAt === null) return;
    const BOOST_MS = 400;
    set({ fightStartedAt: fightStartedAt - BOOST_MS });
  },

  setJob: (archetype, branch) => {
    const { level, trigger, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const job: JobSelection = { archetype, branch };
    set({ job });
    persist(level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds);
  },

  equip: (itemId) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    if (!isItemUnlocked(unlockedItemIds, itemId)) return;
    const next = equipItem(equipment, itemId);
    set({ equipment: next });
    persist(level, trigger, job, next, bodyType, skills, gender, coins, unlockedItemIds);
  },

  unequip: (slot) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const next = unequipSlot(equipment, slot);
    set({ equipment: next });
    persist(level, trigger, job, next, bodyType, skills, gender, coins, unlockedItemIds);
  },

  // 未解鎖的裝備第一次點擊會先扣貨幣解鎖並直接穿上;貨幣不夠就靜默不做事(跟技能升級一致)。
  purchaseItem: (itemId) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const item = getItemById(itemId);
    if (!item) return;

    if (isItemUnlocked(unlockedItemIds, itemId)) {
      const next = equipItem(equipment, itemId);
      set({ equipment: next });
      persist(level, trigger, job, next, bodyType, skills, gender, coins, unlockedItemIds);
      return;
    }

    if (coins < item.price) return;

    const nextCoins = coins - item.price;
    const nextUnlocked = unlockItem(unlockedItemIds, itemId);
    const nextEquipment = equipItem(equipment, itemId);
    set({ coins: nextCoins, unlockedItemIds: nextUnlocked, equipment: nextEquipment });
    persist(level, trigger, job, nextEquipment, bodyType, skills, gender, nextCoins, nextUnlocked);
  },

  setBodyType: (bodyType) => {
    const { level, trigger, job, equipment, skills, gender, coins, unlockedItemIds } = get();
    set({ bodyType });
    persist(level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds);
  },

  upgradeSkill: (archetype) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const currentSkillLevel = skills[archetype];
    if (!canUpgradeSkill(currentSkillLevel, level.bankedExp, coins)) return;

    const expCost = skillUpgradeCost(currentSkillLevel);
    const coinCost = skillUpgradeCoinCost(currentSkillLevel);
    const nextLevel: LevelState = { level: level.level, bankedExp: level.bankedExp - expCost };
    const nextCoins = coins - coinCost;
    const nextSkills: SkillLevels = { ...skills, [archetype]: nextSkillLevel(currentSkillLevel) };

    set({ level: nextLevel, skills: nextSkills, coins: nextCoins });
    persist(nextLevel, trigger, job, equipment, bodyType, nextSkills, gender, nextCoins, unlockedItemIds);
    playSkillUpgrade();
  },

  setGender: (gender) => {
    const { level, trigger, job, equipment, bodyType, skills, coins, unlockedItemIds } = get();
    const nextEquipment = applyGenderDefault(equipment, gender);
    const nextUnlocked = getGenderUnlockItems(gender).reduce(
      (unlocked, itemId) => unlockItem(unlocked, itemId),
      unlockedItemIds
    );
    set({ gender, equipment: nextEquipment, unlockedItemIds: nextUnlocked });
    persist(level, trigger, job, nextEquipment, bodyType, skills, gender, coins, nextUnlocked);
  },
}));
