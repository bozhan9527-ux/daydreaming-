import AsyncStorage from '@react-native-async-storage/async-storage';

import { Archetype, JobBranch } from '../game/combat';
import {
  CompanionGearState,
  CompanionState,
  createEmptyCompanionGearState,
  createEmptyCompanionState,
} from '../game/companions';
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
import { createInitialDungeonState, DungeonState } from '../game/dungeon';
import { createInitialLevelState, LevelState } from '../game/leveling';
import { SkillLevels, SKILL_IDS } from '../game/skills';
import {
  createInitialSkillTreeLevels,
  SKILL_LEVEL_CAP,
  SKILL_SLOT_IDS,
  SkillSlotId,
  SkillTreeLevels,
} from '../game/skillTree';
import { BodyType } from '../game/sprites/heroSilhouette';
import { createInitialStageProgress, StageProgress } from '../game/stages';
import { createInitialStudentSkillTreeLevels, STUDENT_SKILL_LEVEL_CAP } from '../game/studentSkillTree';
import { createInitialTriggerState, TriggerState } from '../game/trigger';
import { STORAGE_KEY } from './constants';

export const SCHEMA_VERSION = 26;

// 存檔遷移到 v25 之前的技能等級是舊制(連續等級,職業樹封頂 tier*60、學生樹封頂60),
// v25 改成「累積技能書」制(職業樹封頂 tier*2、學生樹封頂2)——縮放係數 30 剛好同時對應
// 「職業樹300→10」與「學生樹60→2」兩條換算,四捨五入後不超過新制上限,不能讓玩家原本
// 投資的等級數字直接歸零,也不能讓數字看起來一樣但意義已經不同。
const LEGACY_SKILL_LEVEL_TO_NEW_RATIO = 30;

function migrateSkillLevel(oldLevel: number, newCap: number, oldToNewRatio: number): number {
  return Math.min(newCap, Math.round(oldLevel / oldToNewRatio));
}

function migrateSkillTreeLevels(skillTree: SkillTreeLevels): SkillTreeLevels {
  const result = {} as SkillTreeLevels;
  (Object.keys(skillTree) as Archetype[]).forEach((archetype) => {
    const slots = skillTree[archetype];
    const convertedSlots = {} as Record<SkillSlotId, number>;
    SKILL_SLOT_IDS.forEach((slotId) => {
      convertedSlots[slotId] = migrateSkillLevel(slots[slotId], SKILL_LEVEL_CAP, LEGACY_SKILL_LEVEL_TO_NEW_RATIO);
    });
    result[archetype] = convertedSlots;
  });
  return result;
}

function migrateStudentSkillTreeLevels(studentSkillTree: Record<SkillSlotId, number>): Record<SkillSlotId, number> {
  const result = {} as Record<SkillSlotId, number>;
  SKILL_SLOT_IDS.forEach((slotId) => {
    result[slotId] = migrateSkillLevel(studentSkillTree[slotId], STUDENT_SKILL_LEVEL_CAP, LEGACY_SKILL_LEVEL_TO_NEW_RATIO);
  });
  return result;
}

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
  // 技能書(見 game/skillTree.ts):v25 起技能升級改吃的獨立資源,不再跟角色升等搶銀行經驗值。
  skillBooks: number;
  stageProgress: StageProgress;
  // 每日內容:上次重置的日期字串(''=從沒重置過,下次load()一定會觸發),今日已擊敗隻數,
  // 今日任務是否已領過獎勵——三個欄位一起在跨日時歸零(見 hooks/useGameState.ts 的 load())。
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  // 轉職碎片/證明(見 game/transfer.ts):缺少的 key 一律視為 0,不需要在存檔裡預先塞滿 6 個key。
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  // 「學生」身份(見 game/leveling.ts 的練等曲線註解):false=Lv1-29學生期,尚未真正選定
  // 主職,職業樹只能瀏覽/預覽,不套用任何職業戰鬥加成;true=已在Lv30畢業選定主職。
  // 這個功能上線前建立的存檔一律視為 true(老玩家本來就已經有主職,直接視為畢業)。
  hasChosenJob: boolean;
  // 成就系統(見 game/achievements.ts):unlockedAchievementIds 是「條件已達成」成就 id 的持久化
  // 清單,全量重新計算後跟這份清單做 diff 找出新達成項目。v26 起改成手動領取制,獎勵不再隨條件
  // 達成自動發放,claimedAchievementIds 是「已經按過領取按鈕、拿到獎勵」的 id 清單——
  // unlockedAchievementIds 減去 claimedAchievementIds 就是「待領取」清單。
  // hasEverAssembledTransferProof/hasEverSwitchedJob 是專門給轉職相關成就用的「曾經發生過」旗標,
  // 因為底層資源(transferProofs 會被 setJob 消耗)事後看不出「有沒有發生過」,只能事件當下記
  // 一次性旗標,設為 true 後永不重置。
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  // 累計擊殺數(不是 dailyKillCount 那個跨日歸零的每日任務計數,這個終生累加)——
  // 補在這裡是因為它原本只活在記憶體裡沒存檔,每次重整就歸零,導致成就系統(game/achievements.ts)
  // 的擊殺數里程碑(kills_1~kills_10000)在真的玩很多天的玩家身上幾乎不可能解鎖到後面幾個。
  killCount: number;
  // 勇者血量/戰敗風險系統(見 game/heroHealth.ts):heroHp 是目前血量(這場戰鬥開始「前」的血量),
  // defeatRecoveryUntil 是戰敗倒地恢復到什麼時間戳(null = 沒有在恢復中,正常繼續戰鬥)。
  heroHp: number;
  defeatRecoveryUntil: number | null;
  // 「學生」期專屬技能樹(見 game/studentSkillTree.ts):6 格各自的等級,獨立於 skillTree
  // (職業技能樹)之外——學生還沒選職業,不能借用那套 Record<Archetype, ...> 的形狀。
  studentSkillTree: Record<SkillSlotId, number>;
  // 寵物/坐騎專屬裝備(見 game/companions.ts 的「升級格子」模式):裝備綁在 pet/mount 這兩個
  // 身分上,不是綁在某一隻特定寵物身上,5 槽位(top/bottom/helmet/shoes/weapon)各自 0-10 級。
  companionGear: CompanionGearState;
  // 轉職試煉副本(見 game/dungeon.ts):tickets/lastTicketRegenAt 是入場券張數與回補計時基準,
  // 6 個職業各自的副本共用同一份入場券池,不分職業各自計次。
  dungeon: DungeonState;
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
    skillBooks: 0,
    stageProgress: createInitialStageProgress(),
    lastDailyResetAt: '',
    dailyKillCount: 0,
    dailyQuestClaimed: false,
    transferFragments: {},
    transferProofs: {},
    hasChosenJob: false,
    unlockedAchievementIds: [],
    claimedAchievementIds: [],
    hasEverAssembledTransferProof: false,
    hasEverSwitchedJob: false,
    killCount: 0,
    heroHp: 50 + createInitialLevelState().level * 2,
    defeatRecoveryUntil: null,
    studentSkillTree: createInitialStudentSkillTreeLevels(),
    companionGear: createEmptyCompanionGearState(),
    dungeon: createInitialDungeonState(),
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

// 學生技能樹只有「一套」6 格(不像 skillTree 要先展開 6 個職業 key),直接檢查 6 個欄位皆為數字。
function isStudentSkillTreeLevels(value: unknown): value is Record<SkillSlotId, number> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return SKILL_SLOT_IDS.every((slotId) => typeof record[slotId] === 'number');
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

const COMPANION_GEAR_SLOT_IDS = ['top', 'bottom', 'helmet', 'shoes', 'weapon'] as const;

function isCompanionGearLevels(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return COMPANION_GEAR_SLOT_IDS.every((slot) => typeof record[slot] === 'number');
}

function isCompanionGearState(value: unknown): value is CompanionGearState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return isCompanionGearLevels(record.pet) && isCompanionGearLevels(record.mount);
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

// 現行(v13起,強化/鑲嵌上線後)判定要接受「歷史上出現過的所有副素質種類」,不能沿用
// isSubstat——isSubstat 是刻意凍結給 v12 那個時間點用的(v12 存檔本來就只可能有
// critRate/resistance),但後來 isItemInstanceDataV13 直接疊在 isItemInstanceDataV12 之上,
// 導致每次擴充 SubstatType(見 game/equipment.ts)新增的種類都不在這個名單裡——玩家身上只要
// 有一件裝備擲到新種類的副素質,這裡就會判定失敗,現行版本的存檔守衛全部連鎖失敗,一路
// 掉到 migrate() 最底的 createInitialSaveData(),直接把存檔洗成全新角色。這裡因此不重用
// isItemInstanceDataV12/isSubstat,改成獨立維護一份完整清單。
const CURRENT_SUBSTAT_TYPES = [
  'critRate',
  'resistance',
  'physicalResistance',
  'magicResistance',
  'physicalCritRate',
  'physicalCritDamage',
  'magicCritRate',
  'magicCritDamage',
  'physicalAttack',
  'magicAttack',
];

function isCurrentSubstat(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return CURRENT_SUBSTAT_TYPES.includes(record.type as string) && typeof record.value === 'number';
}

function isItemInstanceDataV13(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isCurrentSubstat(record.randomSubstat) &&
    isCurrentSubstat(record.hiddenSubstat) &&
    typeof record.identified === 'boolean' &&
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

interface SaveDataV16 {
  version: 16;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  lastActiveAt: number;
}

function isSaveDataV16(value: unknown): value is SaveDataV16 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 16 &&
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

function isTransferCounts(value: unknown): value is Partial<Record<Archetype, number>> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === 'number');
}

interface SaveDataV17 {
  version: 17;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  lastActiveAt: number;
}

function isSaveDataV17(value: unknown): value is SaveDataV17 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 17 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs)
  );
}

interface SaveDataV18 {
  version: 18;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  lastActiveAt: number;
}

function isSaveDataV18(value: unknown): value is SaveDataV18 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 18 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean'
  );
}

function isUnlockedAchievementIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

interface SaveDataV19 {
  version: 19;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  lastActiveAt: number;
}

function isSaveDataV19(value: unknown): value is SaveDataV19 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 19 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean'
  );
}

interface SaveDataV20 {
  version: 20;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  lastActiveAt: number;
}

function isSaveDataV20(value: unknown): value is SaveDataV20 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 20 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number'
  );
}

interface SaveDataV21 {
  version: 21;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  heroHp: number;
  defeatRecoveryUntil: number | null;
  lastActiveAt: number;
}

function isSaveDataV21(value: unknown): value is SaveDataV21 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 21 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number' &&
    typeof record.heroHp === 'number' &&
    (record.defeatRecoveryUntil === null || typeof record.defeatRecoveryUntil === 'number')
  );
}

interface SaveDataV22 {
  version: 22;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  heroHp: number;
  defeatRecoveryUntil: number | null;
  studentSkillTree: Record<SkillSlotId, number>;
  lastActiveAt: number;
}

function isSaveDataV22(value: unknown): value is SaveDataV22 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 22 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number' &&
    typeof record.heroHp === 'number' &&
    (record.defeatRecoveryUntil === null || typeof record.defeatRecoveryUntil === 'number') &&
    isStudentSkillTreeLevels(record.studentSkillTree)
  );
}

function isDungeonState(value: unknown): value is DungeonState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.tickets === 'number' && typeof record.lastTicketRegenAt === 'number';
}

interface SaveDataV23 {
  version: 23;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  heroHp: number;
  defeatRecoveryUntil: number | null;
  studentSkillTree: Record<SkillSlotId, number>;
  companionGear: CompanionGearState;
  lastActiveAt: number;
}

function isSaveDataV23(value: unknown): value is SaveDataV23 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 23 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number' &&
    typeof record.heroHp === 'number' &&
    (record.defeatRecoveryUntil === null || typeof record.defeatRecoveryUntil === 'number') &&
    isStudentSkillTreeLevels(record.studentSkillTree) &&
    isCompanionGearState(record.companionGear)
  );
}

// v24(破壞性數值轉換遷移前的最後一版):skillTree/studentSkillTree 還是舊制連續等級
// (0~tier*60 / 0~60),沒有 skillBooks。v25 把這兩套等級數字整套換算成新制(見 migrateSkillLevel),
// 不能直接當 SaveData(缺 skillBooks 欄位)使用,所以獨立留一份舊形狀的 interface。
interface SaveDataV24 {
  version: 24;
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
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  heroHp: number;
  defeatRecoveryUntil: number | null;
  studentSkillTree: Record<SkillSlotId, number>;
  companionGear: CompanionGearState;
  dungeon: DungeonState;
  lastActiveAt: number;
}

function isSaveDataV24(value: unknown): value is SaveDataV24 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 24 &&
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
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number' &&
    typeof record.heroHp === 'number' &&
    (record.defeatRecoveryUntil === null || typeof record.defeatRecoveryUntil === 'number') &&
    isStudentSkillTreeLevels(record.studentSkillTree) &&
    isCompanionGearState(record.companionGear) &&
    isDungeonState(record.dungeon)
  );
}

// v25(成就手動領取制上線前的最後一版):有 unlockedAchievementIds,但沒有 claimedAchievementIds
// ——那個年代的成就是條件達成就自動發獎,所以「已解鎖」跟「已領獎」是同一份清單,不能直接當
// SaveData(缺 claimedAchievementIds 欄位)使用,獨立留一份舊形狀的 interface。
interface SaveDataV25 {
  version: 25;
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
  skillBooks: number;
  stageProgress: StageProgress;
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  heroHp: number;
  defeatRecoveryUntil: number | null;
  studentSkillTree: Record<SkillSlotId, number>;
  companionGear: CompanionGearState;
  dungeon: DungeonState;
  lastActiveAt: number;
}

function isSaveDataV25(value: unknown): value is SaveDataV25 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 25 &&
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
    typeof record.skillBooks === 'number' &&
    isStageProgress(record.stageProgress) &&
    typeof record.lastDailyResetAt === 'string' &&
    typeof record.dailyKillCount === 'number' &&
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number' &&
    typeof record.heroHp === 'number' &&
    (record.defeatRecoveryUntil === null || typeof record.defeatRecoveryUntil === 'number') &&
    isStudentSkillTreeLevels(record.studentSkillTree) &&
    isCompanionGearState(record.companionGear) &&
    isDungeonState(record.dungeon)
  );
}

function isSaveDataV26(value: unknown): value is SaveData {
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
    typeof record.skillBooks === 'number' &&
    isStageProgress(record.stageProgress) &&
    typeof record.lastDailyResetAt === 'string' &&
    typeof record.dailyKillCount === 'number' &&
    typeof record.dailyQuestClaimed === 'boolean' &&
    isTransferCounts(record.transferFragments) &&
    isTransferCounts(record.transferProofs) &&
    typeof record.hasChosenJob === 'boolean' &&
    isUnlockedAchievementIds(record.unlockedAchievementIds) &&
    isUnlockedAchievementIds(record.claimedAchievementIds) &&
    typeof record.hasEverAssembledTransferProof === 'boolean' &&
    typeof record.hasEverSwitchedJob === 'boolean' &&
    typeof record.killCount === 'number' &&
    typeof record.heroHp === 'number' &&
    (record.defeatRecoveryUntil === null || typeof record.defeatRecoveryUntil === 'number') &&
    isStudentSkillTreeLevels(record.studentSkillTree) &&
    isCompanionGearState(record.companionGear) &&
    isDungeonState(record.dungeon)
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
// v15 沒有每日內容欄位,補空字串日期(下次 load() 會自然觸發第一次每日重置+登入獎勵);
// v16 沒有轉職碎片/證明欄位,補空物件(缺 key 一律視為 0,舊玩家從零開始蒐集,不影響既有進度);
// v17 沒有 hasChosenJob,補 true(這個功能上線前的存檔本來就已經有主職,直接視為已畢業,
// 不會平白把老玩家打回「學生」狀態鎖技能分頁)。
// v18 沒有成就系統欄位,補空的已解鎖成就清單 + 兩個 false 的「曾經發生過」旗標——
// 這個功能上線前的存檔不會被誤判成「已經達成過轉職相關成就」,但下一次 load() 的
// 全量重新計算(見 hooks/useGameState.ts 的 checkAndUnlockAchievements)會立刻幫舊存檔
// 追溯性標記所有已經達標的成就為「可領取」(例如已經 Lv400 的老存檔會馬上補到
// level_30~level_200 可領,實際入帳仍要玩家自己去成就分頁按領取)。
// v19 沒有 killCount(累計擊殺數,先前只活在記憶體裡沒存檔,重整就歸零),補 0——
// 舊玩家的歷史擊殺數已經無法追回,只能從這次更新後重新累加,不影響其他任何進度。
// v20 沒有勇者血量/戰敗風險系統欄位(見 game/heroHealth.ts),補 heroHp = 50 + 目前等級*2
// (呼應 heroMaxHp 公式,滿血站起來,不會平白把老玩家一登入就變殘血)、defeatRecoveryUntil = null
// (沒有在恢復中)。
// v21 沒有 studentSkillTree(見 game/studentSkillTree.ts),補全 0 的空技能樹物件——舊存檔
// (不論還在學生期還是早就畢業)一律從零開始點學生技能,不影響其餘任何既有進度。
// v22 沒有 companionGear(見 game/companions.ts 的寵物/坐騎專屬裝備「升級格子」),補全 0 級的
// 空裝備狀態——舊玩家的寵物/坐騎加成不變,只是還沒點裝備格子而已。
// v23 沒有 dungeon(見 game/dungeon.ts 的轉職試煉副本入場券),補滿張的初始入場券狀態——
// 呼應「解鎖當下就能馬上用」的既有設計慣例,舊玩家一登入副本分頁就有 5 張票可以打。
// v25→v26 沒有 claimedAchievementIds(見成就系統改成手動領取制):相容性關鍵是,v25 以前的
// 成就是條件達成就自動發獎,所以任何已經在舊版 unlockedAchievementIds 裡的成就,獎勵早就已經
// 發過了——claimedAchievementIds 必須直接設成跟舊的 unlockedAchievementIds 一樣的內容(不是
// 空陣列!),不然老玩家一登入會看到一堆「未領取」但其實金幣早就已經拿過的成就,點領取就會
// 重複發獎勵。v24 以前的版本本來就沒有成就系統(unlockedAchievementIds 補空陣列),
// claimedAchievementIds 同步補空陣列即可。
// 等級/經驗/保底/職業/裝備/體型/性別/貨幣/裝備解鎖清單一律原樣保留。
function migrate(value: unknown): SaveData {
  if (isSaveDataV26(value)) return value;
  if (isSaveDataV25(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV24(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      skillTree: migrateSkillTreeLevels(value.skillTree),
      studentSkillTree: migrateStudentSkillTreeLevels(value.studentSkillTree),
      skillBooks: 0,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV23(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      studentSkillTree: migrateStudentSkillTreeLevels(value.studentSkillTree),
      skillBooks: 0,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV22(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      studentSkillTree: migrateStudentSkillTreeLevels(value.studentSkillTree),
      skillBooks: 0,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV21(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      skillBooks: 0,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV20(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      skillBooks: 0,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV19(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      skillBooks: 0,
      claimedAchievementIds: [...value.unlockedAchievementIds],
    };
  }
  if (isSaveDataV18(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      skillBooks: 0,
    };
  }
  if (isSaveDataV17(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: migrateSkillTreeLevels(value.skillTree),
      skillBooks: 0,
    };
  }
  if (isSaveDataV16(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: migrateSkillTreeLevels(value.skillTree),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: value.itemInstances,
      enhanceStones: value.enhanceStones,
      gemCounts: value.gemCounts,
      skillBooks: 0,
      stageProgress: value.stageProgress,
      lastDailyResetAt: value.lastDailyResetAt,
      dailyKillCount: value.dailyKillCount,
      dailyQuestClaimed: value.dailyQuestClaimed,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV15(value)) {
    return {
      version: SCHEMA_VERSION,
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: migrateSkillTreeLevels(value.skillTree),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: value.itemInstances,
      enhanceStones: value.enhanceStones,
      gemCounts: value.gemCounts,
      skillBooks: 0,
      stageProgress: value.stageProgress,
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: value.stageProgress,
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
      skillBooks: 0,
      stageProgress: createInitialStageProgress(),
      lastDailyResetAt: '',
      dailyKillCount: 0,
      dailyQuestClaimed: false,
      transferFragments: {},
      transferProofs: {},
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: createInitialStudentSkillTreeLevels(),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
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
