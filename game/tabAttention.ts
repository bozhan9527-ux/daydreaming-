import { Archetype, DUAL_CLASS_UNLOCK_LEVEL, JobTier, TIER_UNLOCK_LEVELS } from './combat';
import { canUpgradeCompanionGearSlot, CompanionGearState } from './companions';
import { DUNGEON_TABS, DungeonState, remainingDungeonChallenges } from './dungeon';
import { EquipmentLoadout, GemCounts, SLOT_Z_ORDER } from './equipment';
import { currentMaterialTier, sumTieredMaterialCounts, TieredMaterialCounts } from './materials';
import { canUpgradeSkillSlot, SkillSlotId, SKILL_SLOT_IDS } from './skillTree';
import { canUpgradeStudentSkillSlot } from './studentSkillTree';

// 跨分頁提醒角標:每個頂層分頁圖示要不要顯示「有事可做」的小紅點,判準統一收在這裡——
// 純函式、不碰 React,方便獨立測試,也讓 TabBar/app/index.tsx 不用各自重複判斷邏輯。
// 故意只做「便宜、大致正確」的檢查(例如裝備分頁只看有沒有閒置強化石/寶石,不逐一模擬
// 每件裝備能不能強化成功),避免角標本身的計算成本比它要提醒的操作還貴。
export interface TabAttentionInput {
  hasChosenJob: boolean;
  level: number;
  coins: number;
  transferProofs: Partial<Record<Archetype, number>>;
  equipment: EquipmentLoadout;
  // 分階制(見 game/materials.ts):badge只在意「目前職業階級對應那一階夠不夠用」,
  // 不是總量夠不夠——內部會用 hasChosenJob/jobTier 自己解析要看哪一階。
  enhanceStones: TieredMaterialCounts;
  gemCounts: GemCounts;
  jobTier: JobTier;
  // 呼叫端先決定好要吃 skillTree[job.archetype] 還是 studentSkillTree(取決於 hasChosenJob),
  // 這裡只認一份已經選好的槽位等級,不重複判斷一次。
  activeSkillLevels: Record<SkillSlotId, number>;
  // 技能升級改吃技能書(見 game/skillTree.ts),不再吃 bankedExp;v35 起分階制,道理跟
  // enhanceStones 一樣。
  skillBooks: TieredMaterialCounts;
  companionGear: CompanionGearState;
  dungeon: DungeonState;
}

export interface TabAttentionFlags {
  job: boolean;
  // 這個旗標其實是「工坊」(強化石/寶石有得用)的提醒——欄位名稱維持 workshop 對齊
  // panelTabs.tsx 的 tab id,修正舊版命名(equipment)跟實際 tab id 對不起來、導致
  // 工坊分頁紅點從來沒真的顯示過的問題。
  workshop: boolean;
  inventory: boolean;
  skill: boolean;
  companion: boolean;
  dungeon: boolean;
}

function hasAnyEmptySlot(equipment: EquipmentLoadout): boolean {
  return SLOT_Z_ORDER.some((slot) => equipment[slot] === undefined);
}

function hasAnySkillUpgrade(
  hasChosenJob: boolean,
  tier: JobTier,
  levels: Record<SkillSlotId, number>,
  skillBooks: TieredMaterialCounts
): boolean {
  const availableBooks = skillBooks[currentMaterialTier(hasChosenJob, tier)];
  return SKILL_SLOT_IDS.some((slot) => {
    const level = levels[slot];
    return hasChosenJob
      ? canUpgradeSkillSlot(level, tier, availableBooks)
      : canUpgradeStudentSkillSlot(level, availableBooks);
  });
}

function hasAnyCompanionGearUpgrade(gear: CompanionGearState, level: number, coins: number): boolean {
  const kinds: (keyof CompanionGearState)[] = ['pet', 'mount'];
  return kinds.some((kind) =>
    (Object.keys(gear[kind]) as (keyof (typeof gear)['pet'])[]).some((slot) =>
      canUpgradeCompanionGearSlot(gear[kind][slot], level, coins)
    )
  );
}

export function computeTabAttentionFlags(input: TabAttentionInput): TabAttentionFlags {
  const canGraduate = !input.hasChosenJob && input.level >= TIER_UNLOCK_LEVELS[1];
  const hasUsableTransferProof = Object.values(input.transferProofs).some((count) => (count ?? 0) >= 1);
  const canDualClass = input.hasChosenJob && input.level >= DUAL_CLASS_UNLOCK_LEVEL;

  const availableEnhanceStones = input.enhanceStones[currentMaterialTier(input.hasChosenJob, input.jobTier)];

  return {
    job: canGraduate || (canDualClass && hasUsableTransferProof),
    workshop: availableEnhanceStones > 0 || Object.values(input.gemCounts).some((counts) => sumTieredMaterialCounts(counts) > 0),
    inventory: hasAnyEmptySlot(input.equipment),
    skill: hasAnySkillUpgrade(input.hasChosenJob, input.jobTier, input.activeSkillLevels, input.skillBooks),
    companion: hasAnyCompanionGearUpgrade(input.companionGear, input.level, input.coins),
    dungeon: DUNGEON_TABS.some((tab) => remainingDungeonChallenges(input.dungeon, tab) > 0),
  };
}
