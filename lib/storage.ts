import AsyncStorage from '@react-native-async-storage/async-storage';

import { Archetype, JobBranch } from '../game/combat';
import { CompanionState, createEmptyCompanionState } from '../game/companions';
import {
  applyGenderDefault,
  createEmptyGemCounts,
  createEmptyItemInstances,
  createEmptyLoadout,
  createEmptyUnlockedItems,
  EquipmentLoadout,
  Gender,
  GemCounts,
  getGenderUnlockItems,
  ItemInstances,
  UnlockedItemIds,
  unlockItem,
  upgradeItemInstancesToV13,
} from '../game/equipment';
import { createInitialLevelState, LevelState } from '../game/leveling';
import { SkillLevels, SKILL_IDS } from '../game/skills';
import { createInitialSkillTreeLevels, SKILL_SLOT_IDS, SkillTreeLevels } from '../game/skillTree';
import { BodyType } from '../game/sprites/heroSilhouette';
import { createInitialStageProgress, StageProgress } from '../game/stages';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { STORAGE_KEY } from './constants';

export const SCHEMA_VERSION = 16;

const DEFAULT_ARCHETYPE: Archetype = 'physicalMelee';
const DEFAULT_BRANCH: JobBranch = 'A';
const DEFAULT_BODY_TYPE: BodyType = 'normal';
const DEFAULT_GENDER: Gender = 'female';
const DEFAULT_COINS = 0;

function unlockedItemsForGender(gender: Gender): UnlockedItemIds {
  return getGenderUnlockItems(gender).reduce(
    (unlocked, itemId) => unlockItem(unlocked, itemId),
    createEmptyUnlockedItems()
  );
}

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
  skillTree: SkillTreeLevels;
  gender: Gender;
  coins: number;
  unlockedItemIds: UnlockedItemIds;
  companions: CompanionState;
  secondaryJob: Archetype | null;
  itemInstances: ItemInstances;
  enhanceStones: number;
  gemCounts: GemCounts;
  stageProgress: StageProgress;
  // 每日內容:上次重置的日期字串(''=從沒重置過,下次load()一定會觸發),今日已擊敗隻數,
  // 今日任務是否已領過獎勵——三個欄位一起在跨日時歸零(見 hooks/useGameState.ts 的 load())。
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
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
    skillTree: createInitialSkillTreeLevels(),
    gender: DEFAULT_GENDER,
    coins: DEFAULT_COINS,
    unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
    companions: createEmptyCompanionState(),
    secondaryJob: null,
    itemInstances: createEmptyItemInstances(),
    enhanceStones: 0,
    gemCounts: createEmptyGemCounts(),
    stageProgress: createInitialStageProgress(),
    lastDailyResetAt: '',
    dailyKillCount: 0,
    dailyQuestClaimed: false,
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

function isSkillTreeLevels(value: unknown): value is SkillTreeLevels {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return SKILL_IDS.every((archetypeId) => {
    const slots = record[archetypeId];
    if (typeof slots !== 'object' || slots === null) return false;
    const slotRecord = slots as Record<string, unknown>;
    return SKILL_SLOT_IDS.every((slotId) => typeof slotRecord[slotId] === 'number');
  });
}

// v8 以前的 skills 是完全不同的形狀(5 個通用技能 id,不是 6 職業 id),
// 只做寬鬆的物件檢查,實際值在遷移時一律丟棄改用 createInitialSkillTreeLevels()。
function isLegacySkillLevels(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

function isGender(value: unknown): value is Gender {
  return value === 'male' || value === 'female';
}

function isUnlockedItemIds(value: unknown): value is UnlockedItemIds {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

function isArchetypeOrNull(value: unknown): value is Archetype | null {
  return value === null || typeof value === 'string';
}

function isCompanionState(value: unknown): value is CompanionState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.unlockedIds) &&
    record.unlockedIds.every((id) => typeof id === 'string') &&
    (record.equippedPetId === null || typeof record.equippedPetId === 'string') &&
    (record.equippedMountId === null || typeof record.equippedMountId === 'string')
  );
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
  skills: Record<string, number>;
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
    isLegacySkillLevels(record.skills)
  );
}

interface SaveDataV7 {
  version: 7;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skills: Record<string, number>;
  gender: Gender;
  lastActiveAt: number;
}

function isSaveDataV7(value: unknown): value is SaveDataV7 {
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
    isLegacySkillLevels(record.skills) &&
    isGender(record.gender)
  );
}

interface SaveDataV8 {
  version: 8;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skills: Record<string, number>;
  gender: Gender;
  coins: number;
  unlockedItemIds: UnlockedItemIds;
  lastActiveAt: number;
}

function isSaveDataV8(value: unknown): value is SaveDataV8 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 8 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isLegacySkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds)
  );
}

interface SaveDataV9 {
  version: 9;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skills: SkillLevels;
  gender: Gender;
  coins: number;
  unlockedItemIds: UnlockedItemIds;
  lastActiveAt: number;
}

function isSaveDataV9(value: unknown): value is SaveDataV9 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 9 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds)
  );
}

interface SaveDataV10 {
  version: 10;
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
  lastActiveAt: number;
}

function isSaveDataV10(value: unknown): value is SaveDataV10 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 10 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions)
  );
}

interface SaveDataV11 {
  version: 11;
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
  lastActiveAt: number;
}

function isSaveDataV11(value: unknown): value is SaveDataV11 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 11 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions) &&
    isArchetypeOrNull(record.secondaryJob)
  );
}

function isSubstat(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (record.type === 'critRate' || record.type === 'resistance') && typeof record.value === 'number';
}

function isItemInstanceDataV12(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return isSubstat(record.randomSubstat) && isSubstat(record.hiddenSubstat) && typeof record.identified === 'boolean';
}

function isItemInstancesV12(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(isItemInstanceDataV12);
}

interface SaveDataV12 {
  version: 12;
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
  itemInstances: Record<string, { randomSubstat: { type: 'critRate' | 'resistance'; value: number }; hiddenSubstat: { type: 'critRate' | 'resistance'; value: number }; identified: boolean }>;
  lastActiveAt: number;
}

function isSaveDataV12(value: unknown): value is SaveDataV12 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 12 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions) &&
    isArchetypeOrNull(record.secondaryJob) &&
    isItemInstancesV12(record.itemInstances)
  );
}

function isGemType(value: unknown): boolean {
  return value === 'expGem' || value === 'coinGem' || value === 'speedGem';
}

function isItemInstanceDataV13(value: unknown): boolean {
  if (!isItemInstanceDataV12(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.enhanceLevel === 'number' &&
    Array.isArray(record.socketedGems) &&
    record.socketedGems.every((g) => g === null || isGemType(g))
  );
}

function isItemInstances(value: unknown): value is ItemInstances {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(isItemInstanceDataV13);
}

function isGemCounts(value: unknown): value is GemCounts {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.expGem === 'number' && typeof record.coinGem === 'number' && typeof record.speedGem === 'number';
}

interface SaveDataV13 {
  version: 13;
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
  enhanceStones: number;
  gemCounts: GemCounts;
  lastActiveAt: number;
}

function isSaveDataV13(value: unknown): value is SaveDataV13 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 13 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions) &&
    isArchetypeOrNull(record.secondaryJob) &&
    isItemInstances(record.itemInstances) &&
    typeof record.enhanceStones === 'number' &&
    isGemCounts(record.gemCounts)
  );
}

function isStageProgress(value: unknown): value is StageProgress {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.stage === 'number' && typeof record.subStage === 'number' && typeof record.killsInSubStage === 'number';
}

interface SaveDataV14 {
  version: 14;
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
  enhanceStones: number;
  gemCounts: GemCounts;
  stageProgress: StageProgress;
  lastActiveAt: number;
}

function isSaveDataV14(value: unknown): value is SaveDataV14 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 14 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillLevels(record.skills) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions) &&
    isArchetypeOrNull(record.secondaryJob) &&
    isItemInstances(record.itemInstances) &&
    typeof record.enhanceStones === 'number' &&
    isGemCounts(record.gemCounts) &&
    isStageProgress(record.stageProgress)
  );
}

interface SaveDataV15 {
  version: 15;
  level: LevelState;
  trigger: TriggerState;
  job: JobSelection;
  equipment: EquipmentLoadout;
  bodyType: BodyType;
  skillTree: SkillTreeLevels;
  gender: Gender;
  coins: number;
  unlockedItemIds: UnlockedItemIds;
  companions: CompanionState;
  secondaryJob: Archetype | null;
  itemInstances: ItemInstances;
  enhanceStones: number;
  gemCounts: GemCounts;
  stageProgress: StageProgress;
  lastActiveAt: number;
}

function isSaveDataV15(value: unknown): value is SaveDataV15 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 15 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillTreeLevels(record.skillTree) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions) &&
    isArchetypeOrNull(record.secondaryJob) &&
    isItemInstances(record.itemInstances) &&
    typeof record.enhanceStones === 'number' &&
    isGemCounts(record.gemCounts) &&
    isStageProgress(record.stageProgress)
  );
}

function isSaveDataV16(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === SCHEMA_VERSION &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isSkillTreeLevels(record.skillTree) &&
    isGender(record.gender) &&
    typeof record.coins === 'number' &&
    isUnlockedItemIds(record.unlockedItemIds) &&
    isCompanionState(record.companions) &&
    isArchetypeOrNull(record.secondaryJob) &&
    isItemInstances(record.itemInstances) &&
    typeof record.enhanceStones === 'number' &&
    isGemCounts(record.gemCounts) &&
    isStageProgress(record.stageProgress) &&
    typeof record.lastDailyResetAt === 'string' &&
    typeof record.dailyKillCount === 'number' &&
    typeof record.dailyQuestClaimed === 'boolean'
  );
}

// v1 沒有 trigger,補保底狀態;v2 沒有 job,補預設職業;v3 沒有 equipment,補空裝備欄;
// v4 沒有 bodyType,補標準體型;v5 沒有 skills,補全部技能 Lv1;v6 沒有 gender,補預設性別;
// v7 沒有 coins/unlockedItemIds,補 0 貨幣與該存檔性別對應的免費解鎖項目;
// v8 的 skills 是舊版 5 通用技能形狀,跟新版 6 職業主動技能對不上,一律重置成 createInitialSkillLevels();
// v9 沒有 companions,補空的審物/坐騎狀態(沒解鎖、沒裝備);
// v10 沒有 secondaryJob,補 null(尚未解鎖雙職兼修前這本來就是唯一合法值);
// v11 沒有 itemInstances,補空物件(舊裝備要等玩家重新裝備一次才會補上隨機/隱藏素質);
// v12 的 itemInstances 沒有 enhanceLevel/socketedGems,補強化 0 級 + 依裝備規則清空插槽,
// 另外補 enhanceStones=0、gemCounts=0(強化/鑲嵌系統還沒出生);
// v13 沒有 stageProgress,補第 1 關第 1 小關(關卡系統還沒出生前這本來就是唯一合法起始值);
// v14 的 skills 是「每職業一個等級」的舊形狀,跟新版「每職業 6 個技能欄位(2被動+4主動)」對不上,
// 一律重置成 createInitialSkillTreeLevels()(技能點數重來,職業/裝備/等級等其餘進度不受影響);
// v15 沒有每日內容欄位,補空字串日期(下次 load() 會自然觸發第一次每日重置+登入獎勵)。
// 等級/經驗/保底/職業/裝備/體型/性別/貨幣/裝備解鎖清單一律原樣保留。
function migrate(value: unknown): SaveData {
  if (isSaveDataV16(value)) return value;
  if (isSaveDataV15(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: value.skillTree,
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: value.itemInstances,
      enhanceStones: value.enhanceStones,
      gemCounts: value.gemCounts,
      stageProgress: value.stageProgress,
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV14(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: value.itemInstances,
      enhanceStones: value.enhanceStones,
      gemCounts: value.gemCounts,
      stageProgress: value.stageProgress,
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV13(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: value.itemInstances,
      enhanceStones: value.enhanceStones,
      gemCounts: value.gemCounts,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV12(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: upgradeItemInstancesToV13(value.itemInstances),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV11(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV10(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV9(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV8(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV7(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: value.gender,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(value.gender),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV6(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: createInitialSkillTreeLevels(),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
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
      skillTree: createInitialSkillTreeLevels(),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
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
      skillTree: createInitialSkillTreeLevels(),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
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
      skillTree: createInitialSkillTreeLevels(),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
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
      skillTree: createInitialSkillTreeLevels(),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
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
      skillTree: createInitialSkillTreeLevels(),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: 0,
      gemCounts: createEmptyGemCounts(),
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
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
