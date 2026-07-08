import AsyncStorage from '@react-native-async-storage/async-storage';

import { createInitialLevelState, LevelState } from '../game/leveling';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { STORAGE_KEY } from './constants';

const SCHEMA_VERSION = 2;

export interface SaveData {
  version: number;
  level: LevelState;
  trigger: TriggerState;
  lastActiveAt: number;
}

export function createInitialSaveData(): SaveData {
  return {
    version: SCHEMA_VERSION,
    level: createInitialLevelState(),
    trigger: createInitialTriggerState(),
    lastActiveAt: Date.now(),
  };
}

function isLevelState(value: unknown): value is LevelState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.level === 'number' && typeof record.bankedExp === 'number';
}

function isTriggerState(value: unknown): value is TriggerState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.pityCounter === 'number';
}

interface SaveDataV1 {
  version: 1;
  level: LevelState;
  lastActiveAt: number;
}

function isSaveDataV1(value: unknown): value is SaveDataV1 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.version === 1 && typeof record.lastActiveAt === 'number' && isLevelState(record.level);
}

function isSaveDataV2(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 2 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger)
  );
}

// v1 存檔沒有 trigger 欄位,補上初始保底狀態,等級/經驗原樣保留。
function migrate(value: unknown): SaveData {
  if (isSaveDataV2(value)) return value;
  if (isSaveDataV1(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: createInitialTriggerState(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  return createInitialSaveData();
}

export async function loadSave(): Promise<SaveData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return createInitialSaveData();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return createInitialSaveData();
  }

  return migrate(parsed);
}

export async function writeSave(data: SaveData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
