import AsyncStorage from '@react-native-async-storage/async-storage';

import { Archetype, JobBranch } from '../game/combat';
import { applyGenderDefault, createEmptyLoadout, EquipmentLoadout, Gender } from '../game/equipment';
import { createInitialLevelState, LevelState } from '../game/leveling';
import { createInitialSkillLevels, SkillLevels, SKILL_IDS } from '../game/skills';
import { BodyType } from '../game/sprites/heroSilhouette';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { STORAGE_KEY } from './constants';

const SCHEMA_VERSION = 7;

const DEFAULT_ARCHETYPE: Archetype = 'physicalMelee';
const DEFAULT_BRANCH: JobBranch = 'A';
const DEFAULT_BODY_TYPE: BodyType = 'normal';
const DEFAULT_GENDER: Gender = 'female';

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
  bodyType: BodyType;
  skills: SkillLevels;
  gender: Gender;
  lastActiveAt: number;
}

export function createInitialSaveData(): SaveData {
  return {
    version: SCHEMA_VERSION,
    level: createInitialLevelState(),
    trigger: createInitialTriggerState(),
    job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
    equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
    bodyType: DEFAULT_BODY_TYPE,
    skills: createInitialSkillLevels(),
    gender: DEFAULT_GENDER,
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

function isBodyType(value: unknown): value is BodyType {
  return value === 'thin' || value === 'normal' || value === 'fat';
}

function isSkillLevels(value: unknown): value is SkillLevels {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return SKILL_IDS.every((id) => typeof record[id] === 'number');
}

function isGender(value: unknown): value is Gender {
  return value === 'male' || value === 'female';
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

interface SaveDataV4 {
  version: 4;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  lastActiveAt: number;
}

interface SaveDataV5 {
  version: 5;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  lastActiveAt: number;
}

interface SaveDataV6 {
  version: 6;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skills: SkillLevels;
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

function isSaveDataV4(value: unknown): value is SaveDataV4 {
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

function isSaveDataV5(value: unknown): value is SaveDataV5 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 5 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType)
  );
}

function isSaveDataV6(value: unknown): value is SaveDataV6 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 6 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills)
  );
}

function isSaveDataV7(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 7 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender)
  );
}

// v1 沒有 trigger,補保底狀態;v2 沒有 job,補預設職業;v3 沒有 equipment,補空裝備欄;
// v4 沒有 bodyType,補標準體型;v5 沒有 skills,補全部技能 Lv1;v6 沒有 gender,補預設性別。
// 等級/經驗/保底/職業/裝備/體型/技能一律原樣保留。
function migrate(value: unknown): SaveData {
  if (isSaveDataV7(value)) return value;
  if (isSaveDataV6(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skills: value.skills,
      gender: DEFAULT_GENDER,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV5(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skills: createInitialSkillLevels(),
      gender: DEFAULT_GENDER,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV4(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: DEFAULT_BODY_TYPE,
      skills: createInitialSkillLevels(),
      gender: DEFAULT_GENDER,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV3(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
      bodyType: DEFAULT_BODY_TYPE,
      skills: createInitialSkillLevels(),
      gender: DEFAULT_GENDER,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV2(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
      bodyType: DEFAULT_BODY_TYPE,
      skills: createInitialSkillLevels(),
      gender: DEFAULT_GENDER,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV1(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: createInitialTriggerState(),
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
      bodyType: DEFAULT_BODY_TYPE,
      skills: createInitialSkillLevels(),
      gender: DEFAULT_GENDER,
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
