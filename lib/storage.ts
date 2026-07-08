import AsyncStorage from '@react-native-async-storage/async-storage';

import { Archetype, JobBranch } from '../game/combat';
import { createEmptyLoadout, EquipmentLoadout } from '../game/equipment';
import { createInitialLevelState, LevelState } from '../game/leveling';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { STORAGE_KEY } from './constants';

const SCHEMA_VERSION = 4;

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
  equipment: EquipmentLoadout;
  lastActiveAt: number;
}

export function createInitialSaveData(): SaveData {
  return {
    version: SCHEMA_VERSION,
    level: createInitialLevelState(),
    trigger: createInitialTriggerState(),
    job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
    equipment: createEmptyLoadout(),
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

function isEquipmentLoadout(value: unknown): value is EquipmentLoadout {
  return typeof value === 'object' && value !== null;
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

interface SaveDataV3 {
  version: 3;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
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

function isSaveDataV3(value: unknown): value is SaveDataV3 {
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

function isSaveDataV4(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 4 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment)
  );
}

// v1 沒有 trigger,補保底狀態;v2 沒有 job,補預設職業;v3 沒有 equipment,補空裝備欄。
// 等級/經驗/保底/職業一律原樣保留。
function migrate(value: unknown): SaveData {
  if (isSaveDataV4(value)) return value;
  if (isSaveDataV3(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: createEmptyLoadout(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV2(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      equipment: createEmptyLoadout(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV1(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: createInitialTriggerState(),
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      equipment: createEmptyLoadout(),
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
