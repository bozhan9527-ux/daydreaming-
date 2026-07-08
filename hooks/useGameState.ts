import { create } from 'zustand';

import { Archetype, calcCombatMultiplier, getCurrentTier, JobBranch } from '../game/combat';
import { coinsForRarity } from '../game/currency';
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
  SkillId,
  SkillLevels,
  skillUpgradeCoinCost,
  skillUpgradeCost,
  totalSkillBonus,
  upgradeSkill as nextSkillLevel,
} from '../game/skills';
import { BodyType } from '../game/sprites/heroSilhouette';
import { createInitialTriggerState, rollTrigger, TriggerState } from '../game/trigger';
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
  load: () => Promise<void>;
  levelUp: (times: 1 | 5 | 10) => void;
  click: () => GameEvent;
  setJob: (archetype: Archetype, branch: JobBranch) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
  purchaseItem: (itemId: string) => void;
  setBodyType: (bodyType: BodyType) => void;
  upgradeSkill: (skillId: SkillId) => void;
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
    version: 8,
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

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    const baseGain = calcOfflineExp(save.level.level, elapsedMs);
    const tier = getCurrentTier(save.level.level);
    const jobMultiplier = calcCombatMultiplier(save.job.archetype, tier);
    const skillMultiplier = 1 + totalSkillBonus(save.skills);
    const gainedExp = Math.floor(baseGain * jobMultiplier * skillMultiplier);
    const level = accumulateExp(save.level, gainedExp);

    set({
      level,
      trigger: save.trigger,
      job: save.job,
      equipment: save.equipment,
      bodyType: save.bodyType,
      skills: save.skills,
      gender: save.gender,
      coins: save.coins,
      unlockedItemIds: save.unlockedItemIds,
      isLoaded: true,
      lastOfflineGain: gainedExp,
    });
    persist(
      level,
      save.trigger,
      save.job,
      save.equipment,
      save.bodyType,
      save.skills,
      save.gender,
      save.coins,
      save.unlockedItemIds
    );
  },

  levelUp: (times) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const result = applyLevelUp(level, times);

    set({ level: result.state });
    persist(result.state, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds);
    if (result.state.level > level.level) playLevelUp();
  },

  click: () => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const roll = rollTrigger(trigger);
    const event = getRandomEvent(roll.rarity);
    const nextCoins = coins + coinsForRarity(roll.rarity);

    set({ trigger: roll.state, coins: nextCoins });
    persist(level, roll.state, job, equipment, bodyType, skills, gender, nextCoins, unlockedItemIds);
    playEvent(roll.rarity);
    return event;
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

  upgradeSkill: (skillId) => {
    const { level, trigger, job, equipment, bodyType, skills, gender, coins, unlockedItemIds } = get();
    const currentSkillLevel = skills[skillId];
    if (!canUpgradeSkill(currentSkillLevel, level.bankedExp, coins)) return;

    const expCost = skillUpgradeCost(currentSkillLevel);
    const coinCost = skillUpgradeCoinCost(currentSkillLevel);
    const nextLevel: LevelState = { level: level.level, bankedExp: level.bankedExp - expCost };
    const nextCoins = coins - coinCost;
    const nextSkills: SkillLevels = { ...skills, [skillId]: nextSkillLevel(currentSkillLevel) };

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
