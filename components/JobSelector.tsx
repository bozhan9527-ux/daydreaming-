import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Archetype,
  calcCombatMultiplier,
  canUnlockDualClass,
  DUAL_CLASS_UNLOCK_LEVEL,
  getJobTitle,
  JobBranch,
  JobTier,
  TIER_UNLOCK_LEVELS,
} from '../game/combat';
import { isTabUnlocked, tabUnlockLevel } from '../game/onboarding';
import { currentMaterialTier, MATERIAL_TIER_LABELS } from '../game/materials';
import {
  ACTIVE_SLOT_IDS,
  canUpgradeSkillSlot,
  getSkillSlotBonusDescription,
  isPassiveSlot,
  PASSIVE_SLOT_IDS,
  SKILL_SLOT_DESCRIPTIONS,
  SKILL_SLOT_NAMES,
  skillSlotLevelCap,
  skillSlotUpgradeBookCost,
  SkillSlotId,
  SkillTreeLevels,
} from '../game/skillTree';
import { getTierSkillFlavor } from '../game/skillTreeFlavor';
import { getSkillIcon, getStudentIcon } from '../game/sprites/skillIcons';
import { TRANSFER_FRAGMENT_NAMES, TRANSFER_FRAGMENTS_PER_PROOF, TRANSFER_PROOF_NAMES } from '../game/transfer';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { JobPromotionCard } from './JobPromotionCard';
import { PixelSprite } from './PixelSprite';
import { SkillLoadoutEditor } from './SkillLoadoutEditor';
import { StudentSkillPanel } from './StudentSkillPanel';

const PREVIEW_TILE_SIZE = 48;
const ARCHETYPE_ICON_SIZE = 44;

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

export const ARCHETYPES: Archetype[] = [
  'physicalMelee',
  'physicalRanged',
  'physicalSupport',
  'magicMelee',
  'magicRanged',
  'magicSupport',
];

const TIERS: JobTier[] = [1, 2, 3, 4, 5];
const BRANCHES: JobBranch[] = ['A', 'B'];

// 依 tier 拿該格的名稱/敘述:tier1 沿用 game/skillTree.ts 既有內容(職業樹最初階本來就是這套),
// tier2~5 是新增的「職業樹分支」內容(game/skillTreeFlavor.ts),兩邊資料來源不同但介面統一,
// 呼叫端(SkillDetailPanel)不用管背後是哪個檔案在供應資料。
export function getSlotFlavor(archetype: Archetype, branch: JobBranch, tier: JobTier, slot: SkillSlotId): { name: string; description: string } {
  if (tier === 1) {
    return { name: SKILL_SLOT_NAMES[archetype][slot], description: SKILL_SLOT_DESCRIPTIONS[archetype][slot] };
  }
  return getTierSkillFlavor(archetype, branch, tier, slot);
}

// 第一層:6個職業各自一個icon,不再用「物理/魔法 x 近戰/遠程/輔助」的文字分組樹狀圖——
// 一眼就能看到6個職業,點哪個都直接進到那個職業的階級分支畫面。額外補一格「學生」放在最
// 左側(第一格,呼應「先是學生,才轉職」的時間順序),學生技能樹從這裡單獨進去投資,
// 不再混在任何一個職業的畫面裡(見 StudentSkillPanel.tsx)。
function ArchetypeGrid({
  job,
  secondaryJob,
  hasChosenJob,
  onSelect,
  onSelectStudent,
}: {
  job: Archetype;
  secondaryJob: Archetype | null;
  hasChosenJob: boolean;
  onSelect: (archetype: Archetype) => void;
  onSelectStudent: () => void;
}) {
  const studentIcon = getStudentIcon();
  return (
    <View style={styles.archetypeGrid}>
      <Pressable style={[styles.archetypeTile, styles.studentTile]} onPress={onSelectStudent}>
        <View style={[styles.archetypeIconWrap, styles.studentIconWrap]}>
          <PixelSprite frame={studentIcon.frame} palette={studentIcon.palette} pixelSize={2.5} />
        </View>
        <Text style={styles.archetypeTileLabel} numberOfLines={1}>
          學生
        </Text>
      </Pressable>
      {ARCHETYPES.map((archetype) => {
        const icon = getSkillIcon(archetype, 'active1', 1);
        const isPrimary = hasChosenJob && job === archetype;
        const isSecondary = hasChosenJob && secondaryJob === archetype;
        return (
          <Pressable key={archetype} style={styles.archetypeTile} onPress={() => onSelect(archetype)}>
            <View style={[styles.archetypeIconWrap, isPrimary && styles.archetypeIconWrapPrimary]}>
              <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2.5} />
            </View>
            <Text style={styles.archetypeTileLabel} numberOfLines={1}>
              {ARCHETYPE_LABELS[archetype]}
            </Text>
            {isPrimary && (
              <View style={styles.archetypeTileTagWrap}>
                <Text style={styles.archetypeTileTag}>主</Text>
              </View>
            )}
            {isSecondary && (
              <View style={styles.archetypeTileTagWrap}>
                <Text style={styles.archetypeTileTag}>副</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

interface TierListProps {
  archetype: Archetype;
  isPrimary: boolean;
  isSecondary: boolean;
  branch: JobBranch;
  currentTier: JobTier;
  hasChosenJob: boolean;
  graduateLevel: number;
  currentLevel: number;
  dualClassUnlocked: boolean;
  transferFragmentCount: number;
  transferProofCount: number;
  onBack: () => void;
  onSetPrimary: () => void;
  onSetBranch: (branch: JobBranch) => void;
  onToggleSecondary: () => void;
  onSelectTier: (tier: JobTier) => void;
  onSwitchArchetype: (archetype: Archetype) => void;
}

// 第二層:這個職業的身分/主副職操作(原本 JobDetailCard 的操作區塊搬過來),外加5個階級按鈕——
// 階級沒解鎖到(currentLevel < TIER_UNLOCK_LEVELS[tier])一樣可以點進去預覽,只是標個鎖頭提示。
// 「挑戰晉升試煉」(見 JobPromotionCard.tsx)只在瀏覽自己目前主職(isPrimary)時顯示——
// 那是玩家目前正在生效的職業階級,才有「晉升下一階」這個動作的意義,瀏覽別的職業純粹是預覽。
function TierList({
  archetype,
  isPrimary,
  isSecondary,
  branch,
  currentTier,
  hasChosenJob,
  graduateLevel,
  currentLevel,
  dualClassUnlocked,
  transferFragmentCount,
  transferProofCount,
  onBack,
  onSetPrimary,
  onSetBranch,
  onToggleSecondary,
  onSelectTier,
  onSwitchArchetype,
}: TierListProps) {
  const icon = getSkillIcon(archetype, 'active1', 1);
  const combatBonusPct = Math.round((calcCombatMultiplier(archetype, currentTier) - 1) * 100);
  const canGraduate = currentLevel >= graduateLevel;
  // 分支選擇器一律顯示,不管畢業前後、也不管瀏覽的是不是目前主職——修正舊版「畢業後轉職到
  // 別的職業時,分支選擇器會被藏起來、送出轉職時還錯誤帶入舊職業目前分支」的問題。branch prop
  // 語意:瀏覽自己目前主職(isPrimary)時是真正生效中的分支,其餘情況(畢業前的預選/畢業後
  // 準備轉去的新職業)都是「還沒套用、按下對應按鈕才生效」的暫存選擇。

  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHeaderRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonLabel}>‹ 職業</Text>
        </Pressable>
      </View>

      {/* 職業快切列:留在第二層就能跳看其他5個職業,不用先按「‹ 職業」退回第一層 grid。 */}
      <View style={styles.archetypeSwitchRow}>
        {ARCHETYPES.map((switchArchetype) => {
          const switchIcon = getSkillIcon(switchArchetype, 'active1', 1);
          const isActive = switchArchetype === archetype;
          return (
            <Pressable
              key={switchArchetype}
              style={styles.archetypeSwitchTile}
              onPress={() => onSwitchArchetype(switchArchetype)}
            >
              <View style={[styles.archetypeSwitchIconWrap, isActive && styles.archetypeSwitchIconWrapActive]}>
                <PixelSprite frame={switchIcon.frame} palette={switchIcon.palette} pixelSize={1.5} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.detailHeader}>
        <View style={styles.detailIconWrap}>
          <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={3} />
        </View>
        <View style={styles.detailHeaderText}>
          <Text style={styles.detailName}>{ARCHETYPE_LABELS[archetype]}</Text>
        </View>
        {isPrimary && (
          <View style={styles.detailTag}>
            <Text style={styles.detailTagText}>主職</Text>
          </View>
        )}
        {isSecondary && (
          <View style={styles.detailTag}>
            <Text style={styles.detailTagText}>副職</Text>
          </View>
        )}
      </View>

      <Text style={styles.detailCombatBonus}>
        職業戰鬥加成:+{combatBonusPct}%{!hasChosenJob && '(畢業後生效)'}
      </Text>
      <View style={styles.previewBadgeRow}>
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>預覽</Text>
        </View>
        <Text style={styles.previewBadgeDesc}>點下面的階級可以看那一階的技能敘述,不管解鎖了沒都能先看。</Text>
      </View>

      <View style={styles.tierRow}>
        {TIERS.map((tier) => {
          const unlocked = currentLevel >= TIER_UNLOCK_LEVELS[tier];
          const tierTitle = getJobTitle(archetype, branch, tier);
          return (
            <Pressable key={tier} style={[styles.tierButton, !unlocked && styles.tierButtonLocked]} onPress={() => onSelectTier(tier)}>
              <Text style={styles.tierButtonLabel}>{tier}階</Text>
              <Text style={styles.tierButtonTitle} numberOfLines={1} ellipsizeMode="tail">
                {tierTitle}
              </Text>
              {!unlocked && <Text style={styles.tierButtonLockHint}>Lv{TIER_UNLOCK_LEVELS[tier]}</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.branchRow}>
        {BRANCHES.map((b) => (
          <Pressable
            key={b}
            style={[styles.branchButton, branch === b && styles.branchButtonActive]}
            onPress={() => onSetBranch(b)}
          >
            <Text style={styles.branchLabel}>分支 {b}</Text>
          </Pressable>
        ))}
      </View>

      {!hasChosenJob ? (
        <View style={styles.detailActions}>
          <Pressable style={[styles.actionButton, !canGraduate && styles.actionButtonDisabled]} onPress={onSetPrimary}>
            <Text style={styles.actionLabel}>設為主職(畢業)</Text>
          </Pressable>
          {!canGraduate && <Text style={styles.secondaryLocked}>Lv{graduateLevel} 畢業後才能選定主職</Text>}
        </View>
      ) : isPrimary ? (
        <JobPromotionCard />
      ) : (
        <>
          <Text style={styles.transferProgress}>
            {TRANSFER_PROOF_NAMES[archetype]} x{transferProofCount}｜{TRANSFER_FRAGMENT_NAMES[archetype]} {transferFragmentCount}/
            {TRANSFER_FRAGMENTS_PER_PROOF}
          </Text>
          <View style={styles.detailActions}>
            <Pressable
              style={[styles.actionButton, transferProofCount < 1 && styles.actionButtonDisabled]}
              onPress={onSetPrimary}
            >
              <Text style={styles.actionLabel}>設為主職</Text>
            </Pressable>
            {dualClassUnlocked ? (
              <Pressable style={styles.actionButton} onPress={onToggleSecondary}>
                <Text style={styles.actionLabel}>{isSecondary ? '取消副職' : '設為副職'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.secondaryLocked}>Lv{DUAL_CLASS_UNLOCK_LEVEL} 解鎖雙職兼修</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// 第三層:選定階級後看那一階6個技能格的名稱/敘述——等級數字沿用同一條連續累加的軌道
// (不分階,見 game/skillTree.ts 的 SkillTreeLevels),階級只決定「這格現在用哪套包裝文字」。
// investable(=瀏覽自己目前主職 && Lv5解鎖技能)時這裡直接是可投資的完整畫面(技能書升級
// 按鈕),不是另外開一張獨立的投資頁——其餘情況(預覽別的職業、或還沒解鎖技能)維持唯讀預覽。
function SkillDetailPanel({
  archetype,
  tier,
  branch,
  actualTier,
  skillLevels,
  investable,
  skillBooks,
  onUpgrade,
  onUpgradeMax,
  onBack,
}: {
  archetype: Archetype;
  tier: JobTier;
  branch: JobBranch;
  actualTier: JobTier;
  skillLevels: SkillTreeLevels[Archetype];
  investable: boolean;
  skillBooks: Record<number, number>;
  onUpgrade: (tier: JobTier, slot: SkillSlotId) => void;
  onUpgradeMax: (tier: JobTier, slot: SkillSlotId) => void;
  onBack: () => void;
}) {
  const [previewSlot, setPreviewSlot] = useState<SkillSlotId>('active1');
  const previewLevel = skillLevels[tier][previewSlot];
  const flavor = getSlotFlavor(archetype, branch, tier, previewSlot);
  const tierTitle = getJobTitle(archetype, branch, tier);

  const cap = skillSlotLevelCap(tier);
  const materialTier = currentMaterialTier(true, tier);
  const availableBooks = skillBooks[materialTier];
  const bookCost = skillSlotUpgradeBookCost(previewLevel);
  const isUnlockedTier = tier <= actualTier;
  const canUpgrade = investable && isUnlockedTier && canUpgradeSkillSlot(previewLevel, tier, availableBooks);
  const atCap = previewLevel >= cap;

  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHeaderRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonLabel}>‹ {ARCHETYPE_LABELS[archetype]}</Text>
        </Pressable>
        <Text style={styles.tierHeaderLabel}>
          {tier}階 · {tierTitle}
        </Text>
      </View>

      <View style={styles.previewGrid}>
        {[...PASSIVE_SLOT_IDS, ...ACTIVE_SLOT_IDS].map((slot) => {
          const slotLevel = skillLevels[tier][slot];
          const icon = getSkillIcon(archetype, slot, tier);
          const isSelected = slot === previewSlot;
          return (
            <Pressable
              key={slot}
              style={[styles.previewTile, isSelected && styles.previewTileSelected]}
              onPress={() => setPreviewSlot(slot)}
            >
              <View style={styles.previewIconWrap}>
                <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2.5} />
              </View>
              <View style={styles.previewKindTag}>
                <Text style={styles.previewKindTagText}>{isPassiveSlot(slot) ? '被動' : '主動'}</Text>
              </View>
              {investable && (
                <View style={styles.previewLevelBadge}>
                  <Text style={styles.previewLevelBadgeText}>
                    {slotLevel}/{cap}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.previewDetail}>
        <Text style={styles.previewDetailName}>
          {flavor.name} Lv.{previewLevel}
          {investable && atCap ? '(已達本階上限)' : ''}
        </Text>
        <Text style={styles.previewDetailDesc}>{flavor.description}</Text>
        <Text style={styles.previewDetailBonus}>{getSkillSlotBonusDescription(archetype, previewSlot, previewLevel)}</Text>

        {investable && (
          <>
            <Text style={styles.previewDetailCap}>{tier}階上限:{cap} 級</Text>
            {!isUnlockedTier ? (
              <Text style={styles.lockedHint}>尚未晉升到{tier}階,晉升後才能投資這一階</Text>
            ) : (
              <View style={styles.upgradeButtonRow}>
                <Pressable
                  style={[styles.upgradeButton, !canUpgrade && styles.upgradeButtonDisabled]}
                  onPress={() => onUpgrade(tier, previewSlot)}
                  disabled={!canUpgrade}
                >
                  <Text style={styles.upgradeLabel}>
                    {atCap
                      ? '已達上限'
                      : `升級 (${bookCost} 本${MATERIAL_TIER_LABELS[materialTier]}技能書,持有 ${availableBooks} 本)`}
                  </Text>
                </Pressable>
                {!atCap && (
                  <Pressable
                    style={[styles.upgradeButtonMax, !canUpgrade && styles.upgradeButtonDisabled]}
                    onPress={() => onUpgradeMax(tier, previewSlot)}
                    disabled={!canUpgrade}
                  >
                    <Text style={styles.upgradeLabel}>衝到底</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

type DrillView = 'archetypes' | 'tiers' | 'skills' | 'student' | 'loadout';

export function JobSelector() {
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const currentTier = useGameState((state) => state.jobTier);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skillTree = useGameState((state) => state.skillTree);
  const skillBooks = useGameState((state) => state.skillBooks);
  const transferFragments = useGameState((state) => state.transferFragments);
  const transferProofs = useGameState((state) => state.transferProofs);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const setJob = useGameState((state) => state.setJob);
  const setSecondaryJob = useGameState((state) => state.setSecondaryJob);
  const upgradeSkillSlot = useGameState((state) => state.upgradeSkillSlot);
  const upgradeSkillSlotMax = useGameState((state) => state.upgradeSkillSlotMax);
  const showToast = useToast((state) => state.show);

  const [view, setView] = useState<DrillView>('archetypes');
  const [viewingArchetype, setViewingArchetype] = useState<Archetype>(job.archetype);
  const [viewingTier, setViewingTier] = useState<JobTier>(1);
  // 畢業前(!hasChosenJob)先讓玩家自己選好分支,按「設為主職(畢業)」時職業+分支一起套用——
  // 不用等畢業後才能選,呼應「Lv30 轉職就能選分支A/B」。
  const [selectedBranch, setSelectedBranch] = useState<JobBranch>('A');

  // 技能相關的實際投資動作(職業技能投資、學生技能、技能欄自選)沿用原本「技能」子分頁的
  // Lv5 門檻——職業/階級瀏覽本身維持 Lv1 就能看,只有真的要花書投資/配置技能欄才卡在這裡。
  const skillUnlocked = isTabUnlocked('skill', level.level, hasChosenJob);
  const skillUnlockLevel = tabUnlockLevel('skill');

  function guardSkillUnlocked(next: () => void) {
    if (!skillUnlocked) {
      showToast(`Lv${skillUnlockLevel} 解鎖「技能」`);
      return;
    }
    next();
  }

  // 學生期(!hasChosenJob)稱號固定顯示「學生」,job.archetype 目前存的只是畢業前的佔位值,
  // 不是玩家真的選過的職業,不能拿去查真正的職業稱號。
  const title = hasChosenJob ? getJobTitle(job.archetype, job.branch, currentTier) : '學生';
  const dualClassUnlocked = canUnlockDualClass(level.level) && hasChosenJob;
  const isViewingPrimary = hasChosenJob && viewingArchetype === job.archetype;
  const isViewingSecondary = hasChosenJob && viewingArchetype === secondaryJob;

  return (
    <View style={styles.container}>
      <Text style={styles.currentTitle}>{title}</Text>

      {view === 'archetypes' && (
        <>
          <ArchetypeGrid
            job={job.archetype}
            secondaryJob={secondaryJob}
            hasChosenJob={hasChosenJob}
            onSelect={(archetype) => {
              setViewingArchetype(archetype);
              setView('tiers');
            }}
            onSelectStudent={() => guardSkillUnlocked(() => setView('student'))}
          />
          <Pressable style={styles.loadoutButton} onPress={() => guardSkillUnlocked(() => setView('loadout'))}>
            <Text style={styles.loadoutButtonLabel}>
              技能選擇{!skillUnlocked ? `(Lv${skillUnlockLevel})` : ''}
            </Text>
          </Pressable>
        </>
      )}

      {view === 'tiers' && (
        <TierList
          archetype={viewingArchetype}
          isPrimary={isViewingPrimary}
          isSecondary={isViewingSecondary}
          branch={isViewingPrimary ? job.branch : selectedBranch}
          currentTier={currentTier}
          hasChosenJob={hasChosenJob}
          graduateLevel={TIER_UNLOCK_LEVELS[1]}
          currentLevel={level.level}
          dualClassUnlocked={dualClassUnlocked}
          transferFragmentCount={transferFragments[viewingArchetype] ?? 0}
          transferProofCount={transferProofs[viewingArchetype] ?? 0}
          onBack={() => setView('archetypes')}
          onSetPrimary={() => setJob(viewingArchetype, isViewingPrimary ? job.branch : selectedBranch)}
          onSetBranch={(b) => (isViewingPrimary ? setJob(job.archetype, b) : setSelectedBranch(b))}
          onToggleSecondary={() => setSecondaryJob(isViewingSecondary ? null : viewingArchetype)}
          onSelectTier={(tier) => {
            setViewingTier(tier);
            setView('skills');
          }}
          onSwitchArchetype={(archetype) => {
            setViewingArchetype(archetype);
            setViewingTier(1);
          }}
        />
      )}

      {view === 'skills' && (
        <SkillDetailPanel
          archetype={viewingArchetype}
          tier={viewingTier}
          branch={isViewingPrimary ? job.branch : selectedBranch}
          actualTier={currentTier}
          skillLevels={skillTree[viewingArchetype]}
          investable={isViewingPrimary && skillUnlocked}
          skillBooks={skillBooks}
          onUpgrade={(tier, slot) => upgradeSkillSlot(viewingArchetype, tier, slot)}
          onUpgradeMax={(tier, slot) => upgradeSkillSlotMax(viewingArchetype, tier, slot)}
          onBack={() => setView('tiers')}
        />
      )}

      {view === 'student' && <StudentSkillPanel onBack={() => setView('archetypes')} />}

      {view === 'loadout' && (
        <View style={styles.panelCard}>
          <View style={styles.panelHeaderRow}>
            <Pressable style={styles.backButton} onPress={() => setView('archetypes')}>
              <Text style={styles.backButtonLabel}>‹ 職業</Text>
            </Pressable>
            <Text style={styles.tierHeaderLabel}>技能選擇</Text>
          </View>
          <SkillLoadoutEditor archetype={job.archetype} branch={job.branch} tier={currentTier} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    gap: 10,
  },
  currentTitle: {
    color: '#c9a94f',
    fontSize: 14,
    fontWeight: '600',
  },
  archetypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  // 固定寬高:原本只有寬度固定,高度隨「主/副」標籤有沒有出現而增減一行,6張卡片參差不齊。
  // 標籤改成絕對定位疊在卡片右上角(見 archetypeTileTagWrap),不再佔用版面高度。
  archetypeTile: {
    width: 82,
    height: 78,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  // 學生格子跟6個職業格子同尺寸,但用藍色(互動/選取訊號色)外框區分開,呼應它不是
  // 「第7個職業」而是獨立的另一套技能樹。
  studentTile: {
    borderColor: '#6ab0e0',
  },
  archetypeIconWrap: {
    width: ARCHETYPE_ICON_SIZE,
    height: ARCHETYPE_ICON_SIZE,
    borderRadius: ARCHETYPE_ICON_SIZE / 2,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archetypeIconWrapPrimary: {
    backgroundColor: '#4a4456',
    borderWidth: 2,
    borderColor: '#c9a94f',
  },
  studentIconWrap: {
    backgroundColor: '#274357',
  },
  archetypeTileLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  archetypeTileTagWrap: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  archetypeTileTag: {
    color: '#c9a94f',
    fontSize: 11,
    fontWeight: '700',
  },
  loadoutButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#6ab0e0',
    alignItems: 'center',
  },
  loadoutButtonLabel: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  panelCard: {
    width: '100%',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonLabel: {
    color: '#8fbfe0',
    fontSize: 12,
    fontWeight: '600',
  },
  tierHeaderLabel: {
    color: '#c9a94f',
    fontSize: 12,
    fontWeight: '600',
  },
  archetypeSwitchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
    marginTop: 2,
    marginBottom: 2,
  },
  archetypeSwitchTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  archetypeSwitchIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 選取中狀態統一用藍色(#6ab0e0)當訊號色,金色專門留給裝飾性外框。
  archetypeSwitchIconWrapActive: {
    backgroundColor: '#4a4456',
    borderWidth: 2,
    borderColor: '#6ab0e0',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    marginBottom: 2,
  },
  tierButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
  },
  tierButtonLocked: {
    opacity: 0.5,
  },
  tierButtonLabel: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
  tierButtonTitle: {
    color: '#c9a94f',
    fontSize: 7,
    maxWidth: 48,
  },
  tierButtonLockHint: {
    color: '#8a8a95',
    fontSize: 11,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  previewTile: {
    width: PREVIEW_TILE_SIZE,
    height: PREVIEW_TILE_SIZE,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
    borderWidth: 2,
    borderColor: '#59462b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewTileSelected: {
    borderColor: '#c9a94f',
    backgroundColor: '#4a4456',
  },
  previewIconWrap: {
    width: PREVIEW_TILE_SIZE,
    height: PREVIEW_TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewKindTag: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  previewKindTagText: {
    color: '#c9a94f',
    fontSize: 7,
    fontWeight: '600',
  },
  previewLevelBadge: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  previewLevelBadgeText: {
    color: '#f2f2f2',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  previewDetail: {
    gap: 3,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#17171f',
  },
  previewDetailName: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
  previewDetailDesc: {
    color: '#c8c8d0',
    fontSize: 11,
    lineHeight: 15,
  },
  previewDetailBonus: {
    color: '#8fd4a8',
    fontSize: 11,
  },
  previewDetailCap: {
    color: '#6a6a75',
    fontSize: 11,
  },
  lockedHint: {
    marginTop: 4,
    color: '#e0a040',
    fontSize: 11,
    textAlign: 'center',
  },
  upgradeButtonRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 6,
  },
  upgradeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
  },
  upgradeButtonMax: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#274357',
    borderWidth: 1,
    borderColor: '#6ab0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonDisabled: {
    opacity: 0.4,
  },
  upgradeLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderText: {
    flex: 1,
  },
  detailName: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  detailTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(201, 169, 79, 0.2)',
  },
  detailTagText: {
    color: '#c9a94f',
    fontSize: 11,
    fontWeight: '700',
  },
  detailDesc: {
    color: '#c8c8d0',
    fontSize: 12,
    lineHeight: 17,
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  previewBadgeDesc: {
    flex: 1,
    color: '#c8c8d0',
    fontSize: 12,
    lineHeight: 17,
  },
  previewBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(143, 191, 224, 0.2)',
  },
  previewBadgeText: {
    color: '#8fbfe0',
    fontSize: 11,
    fontWeight: '700',
  },
  detailCombatBonus: {
    color: '#c9a94f',
    fontSize: 12,
  },
  branchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  branchButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  branchButtonActive: {
    backgroundColor: '#4a4456',
  },
  branchLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  actionLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  transferProgress: {
    color: '#c9a94f',
    fontSize: 11,
    marginTop: 2,
  },
  secondaryLocked: {
    color: '#6a6a75',
    fontSize: 11,
  },
});
