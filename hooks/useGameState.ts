import { create } from 'zustand';

import { Archetype, calcCombatMultiplier, getCurrentTier, JobBranch } from '../game/combat';
import { createEmptyLoadout, equipItem, EquipmentLoadout, unequipSlot, EquipmentSlot } from '../game/equipment';
import { getRandomEvent, GameEvent } from '../game/events';
import { accumulateExp, calcOfflineExp, createInitialLevelState, LevelState, levelUp as applyLevelUp } from '../game/leveling';
import { createInitialTriggerState, rollTrigger, TriggerState } from '../game/trigger';
import { JobSelection, loadSave, writeSave } from '../lib/storage';

const DEFAULT_JOB: JobSelection = { archetype: 'physicalMelee', branch: 'A' };

interface GameState {
  isLoaded: boolean;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  lastOfflineGain: number;
  load: () => Promise<void>;
  levelUp: (times: 1 | 5 | 10) => void;
  click: () => GameEvent;
  setJob: (archetype: Archetype, branch: JobBranch) => void;
  equip: (itemId: string) => void;
  unequip: (slot: EquipmentSlot) => void;
}

function persist(
  level: LevelState,
  trigger: TriggerState,
  job: JobSelection,
  equipment: EquipmentLoadout
): void {
  writeSave({ version: 4, level, trigger, job, equipment, lastActiveAt: Date.now() });
}

export const useGameState = create<GameState>((set, get) => ({
  isLoaded: false,
  level: createInitialLevelState(),
  trigger: createInitialTriggerState(),
  job: DEFAULT_JOB,
  equipment: createEmptyLoadout(),
  lastOfflineGain: 0,

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    const baseGain = calcOfflineExp(save.level.level, elapsedMs);
    const tier = getCurrentTier(save.level.level);
    const multiplier = calcCombatMultiplier(save.job.archetype, tier);
    const gainedExp = Math.floor(baseGain * multiplier);
    const level = accumulateExp(save.level, gainedExp);

    set({ level, trigger: save.trigger, job: save.job, equipment: save.equipment, isLoaded: true, lastOfflineGain: gainedExp });
    persist(level, save.trigger, save.job, save.equipment);
  },

  levelUp: (times) => {
    const { level, trigger, job, equipment } = get();
    const result = applyLevelUp(level, times);

    set({ level: result.state });
    persist(result.state, trigger, job, equipment);
  },

  click: () => {
    const { level, trigger, job, equipment } = get();
    const roll = rollTrigger(trigger);
    const event = getRandomEvent(roll.rarity);

    set({ trigger: roll.state });
    persist(level, roll.state, job, equipment);
    return event;
  },

  setJob: (archetype, branch) => {
    const { level, trigger, equipment } = get();
    const job: JobSelection = { archetype, branch };
    set({ job });
    persist(level, trigger, job, equipment);
  },

  equip: (itemId) => {
    const { level, trigger, job, equipment } = get();
    const next = equipItem(equipment, itemId);
    set({ equipment: next });
    persist(level, trigger, job, next);
  },

  unequip: (slot) => {
    const { level, trigger, job, equipment } = get();
    const next = unequipSlot(equipment, slot);
    set({ equipment: next });
    persist(level, trigger, job, next);
  },
}));
