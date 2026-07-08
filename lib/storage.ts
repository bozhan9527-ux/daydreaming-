import AsyncStorage from '@react-native-async-storage/async-storage';

import { Archetype, JobBranch } from '../game/combat';
import { createInitialLevelState, LevelState } from '../game/leveling';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { STORAGE_KEY } from './constants';

const SCHEMA_VERSION = 3;

const DEFAULT_ARCHETYPE: Archetype = 'physicalMelee';
const DEFAULT_BRANCH: JobBranch = 'A';

export interface JobSelection {
  archetype: Archetype;
  branch: JobBranch;
}

export interface SaveData {
  version: number;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  lastActiveAt: number;
}

export function createInitialSaveData(): SaveData {
  return {
    version: SCHEMA_VERSION,
    level: createInitialLevelState(),
    trigger: createInitialTriggerState(),
    job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
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

function isJobSelection(value: unknown): value is JobSelection {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.archetype === 'string' && (record.branch === 'A' || record.branch === 'B');
}

interface SaveDataV1 {
  version: 1;
  level: LevelState;
  lastActiveAt: number;
}

interface SaveDataV2 {
  version: 2;
  level: LevelState;
  trigger: TriggerState;
  lastActiveAt: number;
}

function isSaveDataV1(value: unknown): value is SaveDataV1 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.version === 1 && typeof record.lastActiveAt === 'number' && isLevelState(record.level);
}

function isSaveDataV2(value: unknown): value is SaveDataV2 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 2 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger)
  );
}

function isSaveDataV3(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 3 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job)
  );
}

// v1 存檔沒有 trigger 欄位,補上初始保底狀態;v2 存檔沒有 job 欄位,補上預設職業走向。
// 等級/經驗/保底狀態一律原樣保留。
function migrate(value: unknown): SaveData {
  if (isSaveDataV3(value)) return value;
  if (isSaveDataV2(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV1(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: createInitialTriggerState(),
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
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
