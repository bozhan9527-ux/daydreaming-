import { create } from 'zustand';

import { Archetype, calcCombatMultiplier, getCurrentTier, JobBranch } from '../game/combat';
import {
  applyGenderDefault,
  createEmptyLoadout,
  equipItem,
  EquipmentLoadout,
  Gender,
  unequipSlot,
  EquipmentSlot,
} from '../game/equipment';
import { getRandomEvent, GameEvent } from '../game/events';
import { accumulateExp, calcOfflineExp, createInitialLevelState, LevelState, levelUp as applyLevelUp } from '../game/leveling';
import {
  canUpgradeSkill,
  createInitialSkillLevels,
  SkillId,
  SkillLevels,
  skillUpgradeCost,
  totalSkillBonus,
  upgradeSkill as nextSkillLevel,
} from '../game/skills';
import { BodyType } from '../game/sprites/heroSilhouette';
import { createInitialTriggerState, rollTrigger, TriggerState } from '../game/trigger';
import { JobSelection, loadSave, writeSave } from '../lib/storage';

const DEFAULT_JOB: JobSelection = { archetype: 'physicalMelee', branch: 'A' };
const DEFAULT_BODY_TYPE: BodyType = 'normal';
const DEFAULT_GENDER: Gender = 'female';

interface GameState {
  isLoaded: boolean;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skills: SkillLevels;
  gender: Gender;
  lastOfflineGain: number;
  load: () => Promise<void>;
  levelUp: (times: 1 | 5 | 10) => void;
  click: () => GameEvent;
  setJob: (archetype: Archetype, branch: JobBranch) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
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
  gender: Gender
): void {
  writeSave({ version: 7, level, trigger, job, equipment, bodyType, skills, gender, lastActiveAt: Date.now() });
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
      isLoaded: true,
      lastOfflineGain: gainedExp,
    });
    persist(level, save.trigger, save.job, save.equipment, save.bodyType, save.skills, save.gender);
  },

  levelUp: (times) => {
    const { level, trigger, job, equipment, bodyType, skills, gender } = get();
    const result = applyLevelUp(level, times);

    set({ level: result.state });
    persist(result.state, trigger, job, equipment, bodyType, skills, gender);
  },

  click: () => {
    const { level, trigger, job, equipment, bodyType, skills, gender } = get();
    const roll = rollTrigger(trigger);
    const event = getRandomEvent(roll.rarity);

    set({ trigger: roll.state });
    persist(level, roll.state, job, equipment, bodyType, skills, gender);
    return event;
  },

  setJob: (archetype, branch) => {
    const { level, trigger, equipment, bodyType, skills, gender } = get();
    const job: JobSelection = { archetype, branch };
    set({ job });
    persist(level, trigger, job, equipment, bodyType, skills, gender);
  },

  equip: (itemId) => {
    const { level, trigger, job, equipment, bodyType, skills, gender } = get();
    const next = equipItem(equipment, itemId);
    set({ equipment: next });
    persist(level, trigger, job, next, bodyType, skills, gender);
  },

  unequip: (slot) => {
    const { level, trigger, job, equipment, bodyType, skills, gender } = get();
    const next = unequipSlot(equipment, slot);
    set({ equipment: next });
    persist(level, trigger, job, next, bodyType, skills, gender);
  },

  setBodyType: (bodyType) => {
    const { level, trigger, job, equipment, skills, gender } = get();
    set({ bodyType });
    persist(level, trigger, job, equipment, bodyType, skills, gender);
  },

  upgradeSkill: (skillId) => {
    const { level, trigger, job, equipment, bodyType, skills, gender } = get();
    const currentSkillLevel = skills[skillId];
    if (!canUpgradeSkill(currentSkillLevel, level.bankedExp)) return;

    const cost = skillUpgradeCost(currentSkillLevel);
    const nextLevel: LevelState = { level: level.level, bankedExp: level.bankedExp - cost };
    const nextSkills: SkillLevels = { ...skills, [skillId]: nextSkillLevel(currentSkillLevel) };

    set({ level: nextLevel, skills: nextSkills });
    persist(nextLevel, trigger, job, equipment, bodyType, nextSkills, gender);
  },

  setGender: (gender) => {
    const { level, trigger, job, equipment, bodyType, skills } = get();
    const nextEquipment = applyGenderDefault(equipment, gender);
    set({ gender, equipment: nextEquipment });
    persist(level, trigger, job, nextEquipment, bodyType, skills, gender);
  },
}));
