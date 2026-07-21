import AsyncStorage from '@react-native-async-storage/async-storage';

import { AscensionUpgradeId } from '../game/ascension';
import { Archetype, getCurrentTier, JobBranch, JobTier } from '../game/combat';
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
  EquipmentSlot,
  Gender,
  GemCounts,
  GEM_TYPES,
  GemType,
  getGenderUnlockItems,
  getItemById,
  ItemInstanceData,
  ItemInstances,
  Substat,
  UnlockedItemIds,
  unlockItem,
  upgradeItemInstancesToV13,
} from '../game/equipment';
import { DailyTaskId } from '../game/daily';
import { createInitialDungeonState, DungeonState } from '../game/dungeon';
import { createInitialLevelState, LevelState } from '../game/leveling';
import { createEmptyTieredMaterialCounts, MaterialTier, migrateFlatMaterialToTiered, TieredMaterialCounts } from '../game/materials';
import { SkillLevels, SKILL_IDS } from '../game/skills';
import {
  ACTIVE_SLOT_IDS,
  ActiveSkillLoadout,
  createInitialActiveSkillLoadout,
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
import { weekIndex, WeeklyStatKey } from '../game/weeklyChallenge';
import { STORAGE_KEY } from './constants';

export const SCHEMA_VERSION = 38;

// 存檔遷移到 v25 之前的技能等級是舊制(連續等級,職業樹封頂 tier*60、學生樹封頂60),
// v25 改成「累積技能書」制(職業樹封頂 tier*2、學生樹封頂2)——縮放係數 30 剛好同時對應
// 「職業樹300→10」與「學生樹60→2」兩條換算,四捨五入後不超過新制上限,不能讓玩家原本
// 投資的等級數字直接歸零,也不能讓數字看起來一樣但意義已經不同。
const LEGACY_SKILL_LEVEL_TO_NEW_RATIO = 30;

function migrateSkillLevel(oldLevel: number, newCap: number, oldToNewRatio: number): number {
  return Math.min(newCap, Math.round(oldLevel / oldToNewRatio));
}

// slots[slotId] ?? 0:SKILL_SLOT_IDS 是「現在」的欄位清單(v27起含 passive3),但呼叫這兩個函式
// 的舊存檔(v20~v24 那個年代)壓根不知道 passive3 存在,slots['passive3'] 會是 undefined——
// 沒有這個防呆,migrateSkillLevel(undefined, ...) 會算出 NaN,把整份技能樹污染成 NaN。
// 用 ?? 0 讓「這格在舊存檔裡根本不存在」等同「這格是0級」,新格 passive3 换算完自然落在0級,
// 不會是 NaN 也不會意外繼承到別格的數值。
function migrateSkillTreeLevels(skillTree: SkillTreeLevels): SkillTreeLevels {
  const result = {} as SkillTreeLevels;
  (Object.keys(skillTree) as Archetype[]).forEach((archetype) => {
    const slots = skillTree[archetype];
    const convertedSlots = {} as Record<SkillSlotId, number>;
    SKILL_SLOT_IDS.forEach((slotId) => {
      convertedSlots[slotId] = migrateSkillLevel(slots[slotId] ?? 0, SKILL_LEVEL_CAP, LEGACY_SKILL_LEVEL_TO_NEW_RATIO);
    });
    result[archetype] = convertedSlots;
  });
  return result;
}

function migrateStudentSkillTreeLevels(studentSkillTree: Record<SkillSlotId, number>): Record<SkillSlotId, number> {
  const result = {} as Record<SkillSlotId, number>;
  SKILL_SLOT_IDS.forEach((slotId) => {
    result[slotId] = migrateSkillLevel(studentSkillTree[slotId] ?? 0, STUDENT_SKILL_LEVEL_CAP, LEGACY_SKILL_LEVEL_TO_NEW_RATIO);
  });
  return result;
}

// passive3(吸血/回血)上線前(v15~v26)skillTree/studentSkillTree 每個職業/欄位只有6格
// (passive1/passive2/active1-4),沒有 passive3。這裡刻意凍結一份固定清單,不能跟著
// game/skillTree.ts 現在(v27起)已經變成7格的 SKILL_SLOT_IDS 走——不然舊存檔本來合法的形狀
// 會因為缺這個新欄位被 isSkillTreeLevels/isStudentSkillTreeLevels 誤判成「格式不對」,
// migrate() 整條 cascade 找不到吻合的版本一路 fallthrough 到 createInitialSaveData(),
// 這是比 NaN 更嚴重的靜默資料遺失——舊玩家的等級/裝備/金幣全部歸零。
const LEGACY_SKILL_SLOT_IDS_PRE_PASSIVE3: SkillSlotId[] = ['passive1', 'passive2', 'active1', 'active2', 'active3', 'active4'];

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
  // 強化石(見 game/equipment.ts 的裝備強化):v35 起改成分階制(見 game/materials.ts 的
  // TieredMaterialCounts),初階+一階~五階共6階,呼應職業轉職階級。
  enhanceStones: TieredMaterialCounts;
  // 鑲嵌石(見 game/equipment.ts 的鑲嵌系統):v37 起寶石種類擴充到13種(加成類3種+素質類10種)
  // 且改成分階制,每種寶石各自初階~五階,道理跟 enhanceStones/skillBooks 完全一樣。
  gemCounts: GemCounts;
  // 技能書(見 game/skillTree.ts):v25 起技能升級改吃的獨立資源,不再跟角色升等搶銀行經驗值;
  // v35 起改成分階制,道理跟 enhanceStones 完全一樣。
  skillBooks: TieredMaterialCounts;
  stageProgress: StageProgress;
  // 每日內容:上次重置的日期字串(''=從沒重置過,下次load()一定會觸發),今日已擊敗隻數,
  // 今日任務是否已領過獎勵——三個欄位一起在跨日時歸零(見 hooks/useGameState.ts 的 load())。
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  // v29 起任務池另外 4 項每日任務(見 game/daily.ts 的 DAILY_TASKS):dailyTaskProgress 是
  // 「今日各項任務目前進度」,缺少的 key 一律視為 0;dailyTaskClaimedIds 是今日已領過獎勵的
  // 任務 id 清單。兩者都跟上面 dailyKillCount/dailyQuestClaimed 一樣在跨日時歸零。
  dailyTaskProgress: Partial<Record<DailyTaskId, number>>;
  dailyTaskClaimedIds: DailyTaskId[];
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
  // 回血(hpRegen,見 game/heroHealth.ts 的 applyHpRegenTick):時間制被動回血機制上次「往前推進」
  // 的計時基準時間戳,跟 heroHp 一樣要存檔——不存檔的話每次重開 App 都會被當成新的起算點,
  // 離線期間本來該累積的回血 tick 會不見。
  lastHpRegenTickAt: number;
  // 這輩子累計清完的大關數(見 game/stages.ts):v28 起 STAGE_COUNT 拉到300(3000關里程碑),
  // 破完一輪會繞回第1關第1小關,靠這個永不歸零的欄位判定「關卡里程碑」成就(見
  // game/achievements.ts 的 'stage' 分類),不能直接看 stageProgress.stage。
  totalStagesCleared: number;
  // 輪迴/轉生系統(見 game/ascension.ts):破完一整輪 3000 關(第300大關的大魔王)發放的
  // 可花費點數,跟金幣是兩條獨立的經濟軸線。ascensionUpgrades 是永久加成樹各節點目前等級,
  // 缺少的 key 一律視為 0 級。輪次數(第幾輪)不存檔,直接用 totalStagesCleared 算,見
  // game/ascension.ts 的 getCycleCount。
  ascensionPoints: number;
  ascensionUpgrades: Partial<Record<AscensionUpgradeId, number>>;
  // 週期成就輪替(見 game/weeklyChallenge.ts):weeklyChallengeWeekIndex 是上次重置對應的週序號,
  // 跟 lastDailyResetAt 一樣「跨週才重置」的判定基準,但這裡存數字序號不存日期字串(見
  // weekIndex 的註解)。weeklyChallengeProgress/weeklyChallengeClaimedIds 跟
  // dailyTaskProgress/dailyTaskClaimedIds 同一套模式,只是週期換成一週而不是一天。
  weeklyChallengeWeekIndex: number;
  weeklyChallengeProgress: Partial<Record<WeeklyStatKey, number>>;
  weeklyChallengeClaimedIds: string[];
  lastActiveAt: number;
  // 設定(見 components/SettingsModal.tsx):soundMuted 是音效總開關,false=正常播放。
  // hasSeenWelcome 是新手歡迎彈窗是否已經看過/關閉——這個功能上線前建立的存檔一律視為
  // true(老玩家顯然早就玩過,不用平白補跳一次歡迎畫面打斷正在進行的遊戲),只有真的
  // 全新存檔(createInitialSaveData)才是 false。
  soundMuted: boolean;
  hasSeenWelcome: boolean;
  // 背景音樂總開關(見 lib/sounds.ts 的 startMusic/setMusicMuted),獨立於上面的音效開關——
  // 兩者是玩家常見的不同偏好組合(要音效不要一直循環的BGM,或反過來),分開存放。
  musicMuted: boolean;
  // 主動技能欄自選配置(見 game/skillTree.ts 的 ActiveSkillLoadout):v34 起,首頁4個主動技能欄
  // 位不再固定綁死「目前職業自己的active1-4」,玩家可以把任何已經投資過等級的職業技能塞進來。
  activeSkillLoadout: ActiveSkillLoadout;
  // 職業階級(見 game/combat.ts 的 JobTier):v36 起不再是「等級到門檻就自動晉升」的純粹
  // 等級推算值,改成玩家自己觸發晉升(見 hooks/useGameState.ts 的 promoteJobTier)才會真的
  // 提升——等級到門檻只代表「有資格挑戰晉升試煉」,不代表已經晉升。舊存檔遷移時用
  // getCurrentTier(level.level)回填(見 migrate() 的 v35→v36 分支),不倒退老玩家已經
  // 練到的等級對應階級,只有這次更新之後的晉升才需要走新的試煉+材料流程。
  jobTier: JobTier;
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
    enhanceStones: createEmptyTieredMaterialCounts(),
    gemCounts: createEmptyGemCounts(),
    skillBooks: createEmptyTieredMaterialCounts(),
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
    totalStagesCleared: 0,
    dailyTaskProgress: {},
    dailyTaskClaimedIds: [],
    ascensionPoints: 0,
    ascensionUpgrades: {},
    weeklyChallengeWeekIndex: weekIndex(),
    weeklyChallengeProgress: {},
    weeklyChallengeClaimedIds: [],
    lastHpRegenTickAt: Date.now(),
    lastActiveAt: Date.now(),
    soundMuted: false,
    hasSeenWelcome: false,
    musicMuted: false,
    activeSkillLoadout: createInitialActiveSkillLoadout(DEFAULT_ARCHETYPE),
    // 全新存檔一律從階級1開始——TIER_UNLOCK_LEVELS[1]=30剛好對齊畢業門檻,階級1不用晉升
    // 試煉,自動視為「畢業就有」的起點,只有2階以後才需要玩家主動晉升。
    jobTier: 1,
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

// 給 v15~v26(passive3 上線前)的舊存檔驗證用:刻意吃 LEGACY_SKILL_SLOT_IDS_PRE_PASSIVE3
// (固定6格)而不是現在的 SKILL_SLOT_IDS(7格),理由見上面該常數的註解。
function isSkillTreeLevels(value: unknown): value is SkillTreeLevels {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return SKILL_IDS.every((archetypeId) => {
    const slots = record[archetypeId];
    if (typeof slots !== 'object' || slots === null) return false;
    const slotRecord = slots as Record<string, unknown>;
    return LEGACY_SKILL_SLOT_IDS_PRE_PASSIVE3.every((slotId) => typeof slotRecord[slotId] === 'number');
  });
}

// 學生技能樹只有「一套」6 格(不像 skillTree 要先展開 6 個職業 key),直接檢查舊制6個欄位皆為數字。
function isStudentSkillTreeLevels(value: unknown): value is Record<SkillSlotId, number> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return LEGACY_SKILL_SLOT_IDS_PRE_PASSIVE3.every((slotId) => typeof record[slotId] === 'number');
}

// v27(passive3/吸血/回血上線後)的現制驗證:吃現在的 SKILL_SLOT_IDS(7格,含 passive3),
// 只給 isSaveDataV27 這個新的 passthrough 檢查用。
function isCurrentSkillTreeLevels(value: unknown): value is SkillTreeLevels {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return SKILL_IDS.every((archetypeId) => {
    const slots = record[archetypeId];
    if (typeof slots !== 'object' || slots === null) return false;
    const slotRecord = slots as Record<string, unknown>;
    return SKILL_SLOT_IDS.every((slotId) => typeof slotRecord[slotId] === 'number');
  });
}

function isCurrentStudentSkillTreeLevels(value: unknown): value is Record<SkillSlotId, number> {
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
  'lifesteal',
  'hpRegen',
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

function isGemCounts(value: unknown): value is LegacyGemCounts {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.expGem === 'number' && typeof record.coinGem === 'number' && typeof record.speedGem === 'number';
}

// v37 之前(鑲嵌石加入素質類+分階制之前)的鑲嵌/寶石舊形狀凍結:寶石只有3種、持有量是單一
// 數字(不分階級),鑲入插槽是純字串(不記階級)。所有 v13~v36 的存檔一律是這個形狀。
type LegacyGemType = 'expGem' | 'coinGem' | 'speedGem';
type LegacyGemCounts = Record<LegacyGemType, number>;
interface LegacyItemInstanceData {
  randomSubstat: Substat;
  hiddenSubstat: Substat;
  identified: boolean;
  enhanceLevel: number;
  socketedGems: (LegacyGemType | null)[];
}
type LegacyItemInstances = Record<string, LegacyItemInstanceData>;

// 轉換成新形狀:舊種類的量全部歸進初階(tier 0),新增的10種素質類寶石一律從0開始;
// 舊字串型態的鑲入寶石一律視為初階(tier 0)——不倒退玩家原本已經鑲上的加成,只是換一種
// 形狀記錄同一件事,新種類/階級靠之後正常掉落/合成累積。
function migrateGemCountsToTiered(old: LegacyGemCounts): GemCounts {
  const next = createEmptyGemCounts();
  (['expGem', 'coinGem', 'speedGem'] as LegacyGemType[]).forEach((gemType) => {
    next[gemType] = { ...next[gemType], 0: old[gemType] };
  });
  return next;
}

function migrateItemInstanceSocketsToTiered(old: LegacyItemInstances): ItemInstances {
  const next: ItemInstances = {};
  for (const [id, instance] of Object.entries(old)) {
    next[id] = {
      ...instance,
      socketedGems: instance.socketedGems.map((gemType) => (gemType ? { type: gemType as GemType, tier: 0 as MaterialTier } : null)),
    };
  }
  return next;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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

const DAILY_TASK_IDS: DailyTaskId[] = ['identify', 'dungeon', 'enhance', 'companionGear'];

function isDailyTaskProgress(value: unknown): value is Partial<Record<DailyTaskId, number>> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return Object.entries(record).every(
    ([key, count]) => DAILY_TASK_IDS.includes(key as DailyTaskId) && typeof count === 'number'
  );
}

function isDailyTaskClaimedIds(value: unknown): value is DailyTaskId[] {
  return Array.isArray(value) && value.every((id) => DAILY_TASK_IDS.includes(id));
}

const ASCENSION_UPGRADE_IDS: AscensionUpgradeId[] = ['exp', 'coins', 'speed', 'offlineCap'];

function isAscensionUpgrades(value: unknown): value is Partial<Record<AscensionUpgradeId, number>> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return Object.entries(record).every(
    ([key, level]) => ASCENSION_UPGRADE_IDS.includes(key as AscensionUpgradeId) && typeof level === 'number'
  );
}

const WEEKLY_STAT_KEYS: WeeklyStatKey[] = ['kills', 'identify', 'dungeon', 'enhance', 'companionGear'];

function isWeeklyChallengeProgress(value: unknown): value is Partial<Record<WeeklyStatKey, number>> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return Object.entries(record).every(
    ([key, count]) => WEEKLY_STAT_KEYS.includes(key as WeeklyStatKey) && typeof count === 'number'
  );
}

function isWeeklyChallengeClaimedIds(value: unknown): value is string[] {
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
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

// v26(passive3/吸血/回血上線前的最後一版):skillTree/studentSkillTree 每個職業/欄位只有6格
// (passive1/passive2/active1-4),沒有 passive3;沒有 lastHpRegenTickAt。凍結成明確獨立的
// interface+literal版本號檢查(不再動態比對 SCHEMA_VERSION,SCHEMA_VERSION 現在已經是27),
// 呼應這個檔案「每個舊版本都是固定形狀」的既有慣例——同時避免不小心要求舊版存檔也要有
// 新欄位(passive3/lastHpRegenTickAt)。
interface SaveDataV26 {
  version: 26;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
  skillBooks: number;
  stageProgress: StageProgress;
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
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

function isSaveDataV26(value: unknown): value is SaveDataV26 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 26 &&
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

// v27(passive3/吸血/回血上線,3000關/關卡里程碑成就上線前的最後一版):skillTree/
// studentSkillTree 每個職業/欄位7格(含 passive3),有 lastHpRegenTickAt,但沒有
// totalStagesCleared。凍結成明確獨立的 interface+literal版本號檢查,呼應這個檔案
// 「每個舊版本都是固定形狀」的既有慣例。
interface SaveDataV27 {
  version: 27;
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
  itemInstances: LegacyItemInstances;
  enhanceStones: number;
  gemCounts: LegacyGemCounts;
  skillBooks: number;
  stageProgress: StageProgress;
  lastDailyResetAt: string;
  dailyKillCount: number;
  dailyQuestClaimed: boolean;
  transferFragments: Partial<Record<Archetype, number>>;
  transferProofs: Partial<Record<Archetype, number>>;
  hasChosenJob: boolean;
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  hasEverAssembledTransferProof: boolean;
  hasEverSwitchedJob: boolean;
  killCount: number;
  heroHp: number;
  defeatRecoveryUntil: number | null;
  studentSkillTree: Record<SkillSlotId, number>;
  companionGear: CompanionGearState;
  dungeon: DungeonState;
  lastHpRegenTickAt: number;
  lastActiveAt: number;
}

function isSaveDataV27(value: unknown): value is SaveDataV27 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 27 &&
    typeof record.lastActiveAt === 'number' &&
    isLevelState(record.level) &&
    isTriggerState(record.trigger) &&
    isJobSelection(record.job) &&
    isEquipmentLoadout(record.equipment) &&
    isBodyType(record.bodyType) &&
    isCurrentSkillTreeLevels(record.skillTree) &&
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
    isCurrentStudentSkillTreeLevels(record.studentSkillTree) &&
    isCompanionGearState(record.companionGear) &&
    isDungeonState(record.dungeon) &&
    typeof record.lastHpRegenTickAt === 'number'
  );
}

// v28(3000關/關卡里程碑成就上線,任務池上線前的最後一版):比 v27 多了 totalStagesCleared,
// 沒有 dailyTaskProgress/dailyTaskClaimedIds。凍結成明確獨立的 interface+literal版本號檢查。
// 形狀直接繼承 SaveDataV27(只換 version 字面量、疊加新欄位),不重複列出全部欄位。
interface SaveDataV28 extends Omit<SaveDataV27, 'version'> {
  version: 28;
  totalStagesCleared: number;
}

function isSaveDataV28(value: unknown): value is SaveDataV28 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 28 &&
    isSaveDataV27({ ...record, version: 27 }) &&
    typeof record.totalStagesCleared === 'number'
  );
}

// v29(任務池上線,輪迴系統上線前的最後一版):比 v28 多了 dailyTaskProgress/
// dailyTaskClaimedIds,沒有 ascensionPoints/ascensionUpgrades。凍結成明確獨立的
// interface+literal版本號檢查,形狀直接繼承 SaveDataV28(只換 version 字面量、疊加新欄位)。
interface SaveDataV29 extends Omit<SaveDataV28, 'version'> {
  version: 29;
  dailyTaskProgress: Partial<Record<DailyTaskId, number>>;
  dailyTaskClaimedIds: DailyTaskId[];
}

function isSaveDataV29(value: unknown): value is SaveDataV29 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 29 &&
    isSaveDataV28({ ...record, version: 28 }) &&
    isDailyTaskProgress(record.dailyTaskProgress) &&
    isDailyTaskClaimedIds(record.dailyTaskClaimedIds)
  );
}

// v30(輪迴系統上線,週期成就輪替上線前的最後一版):比 v29 多了 ascensionPoints/
// ascensionUpgrades,沒有 weeklyChallengeWeekIndex/weeklyChallengeProgress/
// weeklyChallengeClaimedIds。凍結成明確獨立的 interface+literal版本號檢查,形狀直接繼承
// SaveDataV29(只換 version 字面量、疊加新欄位)。
interface SaveDataV30 extends Omit<SaveDataV29, 'version'> {
  version: 30;
  ascensionPoints: number;
  ascensionUpgrades: Partial<Record<AscensionUpgradeId, number>>;
}

function isSaveDataV30(value: unknown): value is SaveDataV30 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 30 &&
    isSaveDataV29({ ...record, version: 29 }) &&
    typeof record.ascensionPoints === 'number' &&
    isAscensionUpgrades(record.ascensionUpgrades)
  );
}

// v31(週期成就輪替上線,設定系統上線前的最後一版):比 v30 多了 weeklyChallengeWeekIndex/
// weeklyChallengeProgress/weeklyChallengeClaimedIds,沒有 soundMuted/hasSeenWelcome。
// 凍結成明確獨立的 interface+literal版本號檢查,形狀直接繼承 SaveDataV30(只換 version
// 字面量、疊加新欄位)。
interface SaveDataV31 extends Omit<SaveDataV30, 'version'> {
  version: 31;
  weeklyChallengeWeekIndex: number;
  weeklyChallengeProgress: Partial<Record<WeeklyStatKey, number>>;
  weeklyChallengeClaimedIds: string[];
}

function isSaveDataV31(value: unknown): value is SaveDataV31 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 31 &&
    isSaveDataV30({ ...record, version: 30 }) &&
    typeof record.weeklyChallengeWeekIndex === 'number' &&
    isWeeklyChallengeProgress(record.weeklyChallengeProgress) &&
    isWeeklyChallengeClaimedIds(record.weeklyChallengeClaimedIds)
  );
}

// v32(設定系統上線,BGM上線前的最後一版):比 v31 多了 soundMuted/hasSeenWelcome,
// 沒有 musicMuted。凍結成明確獨立的 interface+literal版本號檢查,形狀直接繼承
// SaveDataV31(只換 version 字面量、疊加新欄位)。
interface SaveDataV32 extends Omit<SaveDataV31, 'version'> {
  version: 32;
  soundMuted: boolean;
  hasSeenWelcome: boolean;
}

function isSaveDataV32(value: unknown): value is SaveDataV32 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 32 &&
    isSaveDataV31({ ...record, version: 31 }) &&
    typeof record.soundMuted === 'boolean' &&
    typeof record.hasSeenWelcome === 'boolean'
  );
}

// v33(背景音樂上線,技能欄自選上線前的最後一版):比 v32 多了 musicMuted,沒有
// activeSkillLoadout。凍結成明確獨立的 interface+literal版本號檢查,形狀直接繼承
// SaveDataV32(只換 version 字面量、疊加新欄位)。
interface SaveDataV33 extends Omit<SaveDataV32, 'version'> {
  version: 33;
  musicMuted: boolean;
}

function isSaveDataV33(value: unknown): value is SaveDataV33 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 33 &&
    isSaveDataV32({ ...record, version: 32 }) &&
    typeof record.musicMuted === 'boolean'
  );
}

function isActiveSkillLoadout(value: unknown): value is ActiveSkillLoadout {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return ACTIVE_SLOT_IDS.every((slot) => {
    const ref = record[slot];
    if (ref === null) return true;
    if (typeof ref !== 'object') return false;
    const refRecord = ref as Record<string, unknown>;
    return typeof refRecord.archetype === 'string' && typeof refRecord.sourceSlot === 'string';
  });
}

// v34(主動技能欄自選上線,技能書/強化石分階經濟上線前的最後一版):比 v33 多了
// activeSkillLoadout,skillBooks/enhanceStones 還是舊制單一數量。凍結成明確獨立的
// interface+literal版本號檢查,形狀直接繼承 SaveDataV33(只換 version 字面量、疊加新欄位、
// 覆寫 skillBooks/enhanceStones 型別)。
interface SaveDataV34 extends Omit<SaveDataV33, 'version' | 'skillBooks' | 'enhanceStones'> {
  version: 34;
  skillBooks: number;
  enhanceStones: number;
  activeSkillLoadout: ActiveSkillLoadout;
}

function isSaveDataV34(value: unknown): value is SaveDataV34 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 34 &&
    isSaveDataV33({ ...record, version: 33 }) &&
    isActiveSkillLoadout(record.activeSkillLoadout) &&
    typeof record.skillBooks === 'number' &&
    typeof record.enhanceStones === 'number'
  );
}

function isTieredMaterialCounts(value: unknown): value is TieredMaterialCounts {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return ([0, 1, 2, 3, 4, 5] as const).every((tier) => typeof record[tier] === 'number');
}

// v35(技能書/強化石分階經濟上線,職業階級晉升機制上線前的最後一版):比 v34 多了分階的
// skillBooks/enhanceStones(見 game/materials.ts 的 TieredMaterialCounts)。凍結成明確獨立的
// interface+literal版本號檢查,形狀直接繼承 SaveDataV34(只換 version 字面量、覆寫
// skillBooks/enhanceStones 型別)。
interface SaveDataV35 extends Omit<SaveDataV34, 'version' | 'skillBooks' | 'enhanceStones'> {
  version: 35;
  skillBooks: TieredMaterialCounts;
  enhanceStones: TieredMaterialCounts;
}

function isSaveDataV35(value: unknown): value is SaveDataV35 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  // isSaveDataV34 要求 skillBooks/enhanceStones 是 number(v34 的舊形狀),但這裡驗證的是已經
  // 分階的真正形狀——用 0(合法的 number)蓋掉這兩個欄位餵給 isSaveDataV34,只借用它對「其餘
  // 欄位」的檢查,分階形狀本身另外用 isTieredMaterialCounts 獨立驗證,不能直接把 record 原樣
  // 降版本傳進去(那樣兩個物件形狀的欄位一定會卡在 typeof !== 'number' 上,永遠驗證失敗)。
  return (
    record.version === 35 &&
    isSaveDataV34({ ...record, version: 34, skillBooks: 0, enhanceStones: 0 }) &&
    isTieredMaterialCounts(record.skillBooks) &&
    isTieredMaterialCounts(record.enhanceStones)
  );
}

// v36(職業階級晉升機制上線):比 v35 多了 jobTier(見 game/combat.ts 的 JobTier)。凍結成
// 明確獨立的 interface+literal版本號檢查,itemInstances/gemCounts 沿用鑲嵌石加素質類+分階制
// 上線前的舊形狀(LegacyItemInstances/LegacyGemCounts)——這是這兩個欄位最後一個舊形狀版本。
interface SaveDataV36 extends Omit<SaveData, 'version' | 'itemInstances' | 'gemCounts'> {
  version: 36;
  itemInstances: LegacyItemInstances;
  gemCounts: LegacyGemCounts;
}

function isSaveDataV36(value: unknown): value is SaveDataV36 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  // isSaveDataV35 要求 version===35,這裡驗證的是已經是 v36 的真正形狀——用 35 蓋掉 version
  // 欄位餵給 isSaveDataV35,只借用它對「其餘欄位」的檢查,jobTier 本身另外獨立驗證。
  return (
    record.version === 36 &&
    isSaveDataV35({ ...record, version: 35 }) &&
    (record.jobTier === 1 || record.jobTier === 2 || record.jobTier === 3 || record.jobTier === 4 || record.jobTier === 5)
  );
}

function isMaterialTierValue(value: unknown): value is MaterialTier {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isGemTypeV2(value: unknown): value is GemType {
  return typeof value === 'string' && (GEM_TYPES as string[]).includes(value);
}

function isSocketedGemV2(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return isGemTypeV2(record.type) && isMaterialTierValue(record.tier);
}

function isItemInstanceDataV2(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isCurrentSubstat(record.randomSubstat) &&
    isCurrentSubstat(record.hiddenSubstat) &&
    typeof record.identified === 'boolean' &&
    typeof record.enhanceLevel === 'number' &&
    Array.isArray(record.socketedGems) &&
    record.socketedGems.every((g) => g === null || isSocketedGemV2(g))
  );
}

function isItemInstancesV2(value: unknown): value is ItemInstances {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(isItemInstanceDataV2);
}

function isGemCountsV2(value: unknown): value is GemCounts {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return GEM_TYPES.every((gemType) => isTieredMaterialCounts(record[gemType]));
}

// v37(鑲嵌石加入素質類+分階制):比 v36 多了鑲嵌石種類(13種)+分階(見 game/equipment.ts
// 的鑲嵌系統),itemInstances.socketedGems/gemCounts 兩個欄位形狀跟著改變。
// v38 幫裝備加入分支維度後,version 字面數字往前推一位——這裡改成比對字面 37(不再是
// SCHEMA_VERSION,現在 SCHEMA_VERSION 已經是38),跟 isSaveDataV36 當初凍結的做法一樣。
function isSaveDataV37(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  // isSaveDataV36 要求 itemInstances/gemCounts 是舊形狀,這裡驗證的是已經分階的真正形狀——
  // 用空物件/舊形狀的合法佔位值蓋掉這兩個欄位餵給 isSaveDataV36,只借用它對「其餘欄位」的
  // 檢查,新形狀本身另外用 isItemInstancesV2/isGemCountsV2 獨立驗證。
  return (
    record.version === 37 &&
    isSaveDataV36({ ...record, version: 36, itemInstances: {}, gemCounts: { expGem: 0, coinGem: 0, speedGem: 0 } }) &&
    isItemInstancesV2(record.itemInstances) &&
    isGemCountsV2(record.gemCounts)
  );
}

// v38(裝備加入分支 A/B 維度,見 game/equipment.ts 的 JOB_TITLES tier2 起分支各自專屬裝備):
// 沒有新增/改變任何欄位形狀,單純是 equipment/unlockedItemIds/itemInstances 三個欄位裡的
// tier2-5 裝備 id 字串內容從舊格式(無 branch 區段)換成新格式(含 branch 區段)——這種「同
// 形狀、只是內容字串換格式」的變更沒辦法靠結構驗證分辨新舊,只能單純比對 version 字面數字。
// 這是 migrate() 的第一道 passthrough 檢查——已經跑過分支 id 轉換的存檔直接原樣回傳。
function isSaveDataV38(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.version === SCHEMA_VERSION && isSaveDataV37({ ...record, version: 37 });
}

// passive3(見 game/skillTree.ts 的 passive3/lifeMastery)是 v27 新增的第3個被動欄位,v27之前
// 全部存檔的 skillTree/studentSkillTree 都沒有這個 key。下面兩個 helper 給 migrate() 的每一條
// 分支(不論是舊版本各自建構出全新 SaveData 形狀、還是走 migrateSkillTreeLevels 縮放過的)統一
// 補上 passive3:0,不用在 ~20 條分支裡各自手動改 object literal(容易漏改)。
function withPassive3(skillTree: Record<Archetype, Record<SkillSlotId, number>>): SkillTreeLevels {
  const result = {} as SkillTreeLevels;
  (Object.keys(skillTree) as Archetype[]).forEach((archetype) => {
    result[archetype] = { ...skillTree[archetype], passive3: skillTree[archetype].passive3 ?? 0 };
  });
  return result;
}
function withStudentPassive3(studentSkillTree: Record<SkillSlotId, number>): Record<SkillSlotId, number> {
  return { ...studentSkillTree, passive3: studentSkillTree.passive3 ?? 0 };
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
// level_30~level_200 可領,實際入帳仍要玩家自己去成就圖示按領取)。
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
// v26→v27 沒有 passive3(見 game/skillTree.ts 的吸血/回血合一被動)、沒有 lastHpRegenTickAt
// (見 game/heroHealth.ts 的時間制回血):skillTree 每個職業、studentSkillTree 都補
// passive3=0(玩家還沒投資這格,就是0級,不是什麼特殊值),lastHpRegenTickAt 補 Date.now()
// (呼應 hpRegenTotal<=0 時 applyHpRegenTick 也是直接推進到 now 的既有慣例,不會讓完全沒有
// hpRegen 投資的老玩家一登入就補一段「追溯回血」)。
// v27→v28 沒有 totalStagesCleared(見 game/stages.ts 的 3000 關擴充+關卡里程碑成就):
// 補 0——這個功能上線前的存檔一律視為「還沒清過任何一個大關」,不會因為玩家過去已經打到
// 第幾關(stageProgress.stage)就平白預先解鎖後面的里程碑成就,只能重新累積(呼應 killCount
// 當初上線時同樣選擇補 0、不試圖從其他欄位反推歷史值的既有慣例)。
// v28→v29 沒有 dailyTaskProgress/dailyTaskClaimedIds(見 game/daily.ts 的任務池):都補空
// (物件/陣列),等同「今天還沒做任何一項新任務」——跨日重置(見 hooks/useGameState.ts 的
// load())本來就會把這兩個欄位歸零,所以舊存檔不管是不是剛好在當天載入都不會有異常狀態。
// v29→v30 沒有 ascensionPoints/ascensionUpgrades(見 game/ascension.ts 的輪迴/轉生系統):
// 補 0/空物件——這個功能上線前的存檔沒有「輪迴過」這個概念,一律視為還沒轉生過,只能重新
// 累積(呼應 totalStagesCleared 當初上線時同樣選擇補 0 的既有慣例)。
// v30→v31 沒有 weeklyChallengeWeekIndex/weeklyChallengeProgress/weeklyChallengeClaimedIds
// (見 game/weeklyChallenge.ts 的週期成就輪替):weekIndex 補「現在」對應的週序號(不是 0),
// 不然舊存檔一登入會被判定成「上次重置是第0週」,如果玩家剛好活在第0週以後很久,isNewWeek()
// 反而不會馬上觸發重置,progress/claimedIds 卻已經補成空的——直接補現在的 weekIndex() 才能保證
// migrate 完的狀態一定跟「剛剛才重置過」一致,progress/claimedIds 補空互相對應。
// v31→v32 沒有 soundMuted/hasSeenWelcome(見設定/新手引導系統):soundMuted 補 false(舊存檔
// 一直以來都是有聲音的,維持原樣)、hasSeenWelcome 補 true(這個功能上線前的存檔顯然早就
// 玩過了,不用平白補跳一次歡迎畫面打斷正在進行的遊戲)。
// v32→v33 沒有 musicMuted(見背景音樂系統):補 false——背景音樂是新功能,舊存檔沒有
// 「選擇過關掉BGM」這件事,一律視為預設開啟,呼應 soundMuted 當初上線時同樣選擇「維持
// 原樣、不平白幫玩家關掉」的既有慣例。
// v33→v34 沒有 activeSkillLoadout(見 game/skillTree.ts 的主動技能欄自選機制):補「目前職業
// 自己的active1-4」預設配置(createInitialActiveSkillLoadout(value.job.archetype)),行為
// 跟這個機制上線前完全一致,玩家不特地去改配置的話畫面不會有任何變化。
// v34→v35 的 skillBooks/enhanceStones 從單一數量改成分階制(見 game/materials.ts 的
// TieredMaterialCounts):舊的數量全部併入「初階」,不折算、不重新分配——玩家已經囤的量
// 不會平白消失,只是換了個容器裝,之後要升到更高階要透過新的合成機制(兩本前一階換一本
// 下一階)。
// 等級/經驗/保底/職業/裝備/體型/性別/貨幣/裝備解鎖清單一律原樣保留。
function migrateShape(value: unknown): SaveData {
  if (isSaveDataV37(value)) return { ...value, version: SCHEMA_VERSION };
  // 舊存檔遷移到鑲嵌石加素質類+分階制:itemInstances.socketedGems/gemCounts 兩個欄位從舊形狀
  // (寶石只有3種、鑲入插槽是純字串、持有量不分階級)轉成新形狀,不倒退玩家原本已經鑲上的
  // 加成(視為初階),新種類/更高階只能靠之後正常掉落/合成累積(見 migrateGemCountsToTiered/
  // migrateItemInstanceSocketsToTiered 的說明)。
  if (isSaveDataV36(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
    };
  }
  // 舊存檔遷移到新的職業階級晉升機制:用 getCurrentTier(level.level) 回填 jobTier,
  // grandfather 老玩家在目前等級「原本就會有」的階級,不會平白倒退——只有這次更新之後
  // 的晉升才需要走新的晉升試煉+材料流程(見 SaveData.jobTier 的欄位註解)。
  if (isSaveDataV35(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
    };
  }
  if (isSaveDataV34(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
    };
  }
  if (isSaveDataV33(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
    };
  }
  if (isSaveDataV32(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
    };
  }
  if (isSaveDataV31(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
    };
  }
  if (isSaveDataV30(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
    };
  }
  if (isSaveDataV29(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
    };
  }
  if (isSaveDataV28(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
    };
  }
  if (isSaveDataV27(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
    };
  }
  if (isSaveDataV26(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
      skillTree: withPassive3(value.skillTree),
      studentSkillTree: withStudentPassive3(value.studentSkillTree),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV25(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillBooks: migrateFlatMaterialToTiered(value.skillBooks),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      skillTree: withPassive3(value.skillTree),
      studentSkillTree: withStudentPassive3(value.studentSkillTree),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV24(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      studentSkillTree: withStudentPassive3(migrateStudentSkillTreeLevels(value.studentSkillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV23(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      studentSkillTree: withStudentPassive3(migrateStudentSkillTreeLevels(value.studentSkillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV22(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      studentSkillTree: withStudentPassive3(migrateStudentSkillTreeLevels(value.studentSkillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV21(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV20(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV19(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      claimedAchievementIds: [...value.unlockedAchievementIds],
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV18(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV17(value)) {
    return {
      ...value,
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      hasChosenJob: true,
      unlockedAchievementIds: [],
      claimedAchievementIds: [],
      hasEverAssembledTransferProof: false,
      hasEverSwitchedJob: false,
      killCount: 0,
      heroHp: 50 + value.level.level * 2,
      defeatRecoveryUntil: null,
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      skillBooks: createEmptyTieredMaterialCounts(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
    };
  }
  if (isSaveDataV16(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV15(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(migrateSkillTreeLevels(value.skillTree)),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV14(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV13(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: migrateItemInstanceSocketsToTiered(value.itemInstances),
      enhanceStones: migrateFlatMaterialToTiered(value.enhanceStones),
      gemCounts: migrateGemCountsToTiered(value.gemCounts),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV12(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: upgradeItemInstancesToV13(value.itemInstances),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV11(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: value.secondaryJob,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV10(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: value.companions,
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV9(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV8(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: value.coins,
      unlockedItemIds: value.unlockedItemIds,
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV7(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: value.gender,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(value.gender),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV6(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV5(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: value.bodyType,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV4(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: value.equipment,
      bodyType: DEFAULT_BODY_TYPE,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV3(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(value.job.archetype),
      level: value.level,
      trigger: value.trigger,
      job: value.job,
      equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
      bodyType: DEFAULT_BODY_TYPE,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV2(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(DEFAULT_ARCHETYPE),
      level: value.level,
      trigger: value.trigger,
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
      bodyType: DEFAULT_BODY_TYPE,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  if (isSaveDataV1(value)) {
    return {
      version: SCHEMA_VERSION,
      jobTier: getCurrentTier(value.level.level),
      soundMuted: false,
      hasSeenWelcome: true,
      musicMuted: false,
      activeSkillLoadout: createInitialActiveSkillLoadout(DEFAULT_ARCHETYPE),
      level: value.level,
      trigger: createInitialTriggerState(),
      job: { archetype: DEFAULT_ARCHETYPE, branch: DEFAULT_BRANCH },
      equipment: applyGenderDefault(createEmptyLoadout(), DEFAULT_GENDER),
      bodyType: DEFAULT_BODY_TYPE,
      skillTree: withPassive3(createInitialSkillTreeLevels()),
      gender: DEFAULT_GENDER,
      coins: DEFAULT_COINS,
      unlockedItemIds: unlockedItemsForGender(DEFAULT_GENDER),
      companions: createEmptyCompanionState(),
      secondaryJob: null,
      itemInstances: createEmptyItemInstances(),
      enhanceStones: createEmptyTieredMaterialCounts(),
      gemCounts: createEmptyGemCounts(),
      skillBooks: createEmptyTieredMaterialCounts(),
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
      studentSkillTree: withStudentPassive3(createInitialStudentSkillTreeLevels()),
      companionGear: createEmptyCompanionGearState(),
      dungeon: createInitialDungeonState(),
      totalStagesCleared: 0,
      dailyTaskProgress: {},
      dailyTaskClaimedIds: [],
      ascensionPoints: 0,
      ascensionUpgrades: {},
      weeklyChallengeWeekIndex: weekIndex(),
      weeklyChallengeProgress: {},
      weeklyChallengeClaimedIds: [],
      lastHpRegenTickAt: Date.now(),
      lastActiveAt: value.lastActiveAt,
    };
  }
  return createInitialSaveData();
}

// 舊格式(無 branch 區段)的 tier2-5 生成式裝備 id,例如 top-physicalMelee-20、
// mainhand-1h-physicalMelee-20。tier1 brackets(兩分支尚未分岔,id 本來就沒有 branch 區段)、
// 起始/學生款(-01/-02/-student2 等)都不吻合這個格式,不受影響。
const LEGACY_REGULAR_ITEM_ID = /^([a-z]+)-([a-zA-Z]+)-(\d+)$/;
const LEGACY_MAINHAND_ITEM_ID = /^mainhand-(1h|2h)-([a-zA-Z]+)-(\d+)$/;

// 裝備加分支維度前,3000+ 款生成式裝備一律沒有 branch 區段;既有玩家身上/背包裡的這些舊 id
// 在新目錄裡已經查不到(見 game/equipment.ts 的 id 生成規則),一律補上「分支 A」——這正是
// 玩家原本實際擁有的那個版本(唯一存在過的資料表就是現在的分支 A),名稱/顏色/加成完全不變,
// 只是 id 多了一段。用 getItemById 判斷「這個 id 還查得到嗎」而不是自己重算 tier,可以讓
// tier1 id、或這個函式重複套用過的新格式 id 直接原樣通過(冪等,不會誤傷)。
function remapLegacyEquipmentItemId(id: string): string {
  if (getItemById(id)) return id;
  const mainhandMatch = id.match(LEGACY_MAINHAND_ITEM_ID);
  if (mainhandMatch) {
    const [, hand, archetype, bracket] = mainhandMatch;
    return `mainhand-${hand}-${archetype}-A-${bracket}`;
  }
  const regularMatch = id.match(LEGACY_REGULAR_ITEM_ID);
  if (regularMatch) {
    const [, slot, archetype, bracket] = regularMatch;
    return `${slot}-${archetype}-A-${bracket}`;
  }
  // 認不得的格式(理論上不會發生):原樣放回去,不讓遷移拋錯連累其他欄位。
  return id;
}

// 套用到 equipment(已裝備)/unlockedItemIds(已解鎖)/itemInstances(隨機素質等實例資料,
// key 就是 id)三個會存到裝備 id 字串的欄位——不管存檔原本停在 migrateShape 的哪一個分支,
// 這一步統一在最後跑一次,冪等、對已經是新格式的存檔完全不影響。
function remapLegacyEquipmentBranchIds(save: SaveData): SaveData {
  const equipment: EquipmentLoadout = {};
  for (const slot of Object.keys(save.equipment) as EquipmentSlot[]) {
    const id = save.equipment[slot];
    if (id) equipment[slot] = remapLegacyEquipmentItemId(id);
  }
  const unlockedItemIds: UnlockedItemIds = save.unlockedItemIds.map(remapLegacyEquipmentItemId);
  const itemInstances: ItemInstances = {};
  for (const [id, instance] of Object.entries(save.itemInstances) as [string, ItemInstanceData][]) {
    itemInstances[remapLegacyEquipmentItemId(id)] = instance;
  }
  return { ...save, version: SCHEMA_VERSION, equipment, unlockedItemIds, itemInstances };
}

// v38:裝備分支 id 轉換獨立成最後一道統一步驟(見上面兩個 helper 的說明),不用像先前每個
// schema 版本那樣在 migrateShape 的每一條分支裡各自插入轉換呼叫。
function migrate(value: unknown): SaveData {
  if (isSaveDataV38(value)) return value;
  return remapLegacyEquipmentBranchIds(migrateShape(value));
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

// 設定分頁的「重置存檔」用:清掉底層儲存,下一次 loadSave() 就會拿到全新的 createInitialSaveData()。
export async function clearSave(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
