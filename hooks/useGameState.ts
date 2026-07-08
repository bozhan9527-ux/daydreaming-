import { create } from 'zustand';

import { getRandomEvent, GameEvent } from '../game/events';
import { accumulateExp, calcOfflineExp, createInitialLevelState, LevelState, levelUp as applyLevelUp } from '../game/leveling';
import { createInitialTriggerState, rollTrigger, TriggerState } from '../game/trigger';
import { loadSave, writeSave } from '../lib/storage';

interface GameState {
  isLoaded: boolean;
  level: LevelState;
  trigger: TriggerState;
  lastOfflineGain: number;
  load: () => Promise<void>;
  levelUp: (times: 1 | 5 | 10) => void;
  click: () => GameEvent;
}

function persist(level: LevelState, trigger: TriggerState): void {
  writeSave({ version: 2, level, trigger, lastActiveAt: Date.now() });
}

export const useGameState = create<GameState>((set, get) => ({
  isLoaded: false,
  level: createInitialLevelState(),
  trigger: createInitialTriggerState(),
  lastOfflineGain: 0,

  load: async () => {
    const save = await loadSave();
    const elapsedMs = Date.now() - save.lastActiveAt;
    const gainedExp = calcOfflineExp(save.level.level, elapsedMs);
    const level = accumulateExp(save.level, gainedExp);

    set({ level, trigger: save.trigger, isLoaded: true, lastOfflineGain: gainedExp });
    persist(level, save.trigger);
  },

  levelUp: (times) => {
    const { level, trigger } = get();
    const result = applyLevelUp(level, times);

    set({ level: result.state });
    persist(result.state, trigger);
  },

  click: () => {
    const { level, trigger } = get();
    const roll = rollTrigger(trigger);
    const event = getRandomEvent(roll.rarity);

    set({ trigger: roll.state });
    persist(level, roll.state);
    return event;
  },
}));
