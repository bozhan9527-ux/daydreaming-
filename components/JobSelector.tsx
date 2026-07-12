import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Archetype,
  calcCombatMultiplier,
  canUnlockDualClass,
  DUAL_CLASS_UNLOCK_LEVEL,
  getArchetypeComposition,
  getCurrentTier,
  getJobTitle,
  JobBranch,
  JobTier,
  TIER_UNLOCK_LEVELS,
} from '../game/combat';
import { getEquipmentBonusTotalsFull, getSubstatTotals } from '../game/equipment';
import { heroAttackPower, heroDefensePower, heroMaxHp } from '../game/heroHealth';
import {
  ACTIVE_SLOT_IDS,
  getSkillSlotBonusDescription,
  isPassiveSlot,
  PASSIVE_SLOT_IDS,
  SKILL_SLOT_DESCRIPTIONS,
  SKILL_SLOT_NAMES,
  SkillSlotId,
  SkillTreeLevels,
} from '../game/skillTree';
import { getTierSkillFlavor } from '../game/skillTreeFlavor';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { TRANSFER_FRAGMENT_NAMES, TRANSFER_FRAGMENTS_PER_PROOF, TRANSFER_PROOF_NAMES } from '../game/transfer';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const PREVIEW_TILE_SIZE = 48;
const ARCHETYPE_ICON_SIZE = 44;

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

const ARCHETYPES: Archetype[] = [
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
function getSlotFlavor(archetype: Archetype, tier: JobTier, slot: SkillSlotId): { name: string; description: string } {
  if (tier === 1) {
    return { name: SKILL_SLOT_NAMES[archetype][slot], description: SKILL_SLOT_DESCRIPTIONS[archetype][slot] };
  }
  return getTierSkillFlavor(archetype, tier, slot);
}

// 角色狀態面板:只在第一層(archetypes)顯示,獨立呼叫 useGameState 抓自己需要的資料——
// 這一層本來就沒有像 TierList/SkillDetailPanel 那樣被父層挑選/篩選過的資料要傳,
// 直接在元件內部訂閱比多繞一層 props 更直接,跟 JobSelector() 本體的寫法一致。
// 物理/魔法爆擊數字兩邊都顯示(不管玩家現在主職是哪邊),只有跟目前職業系別相符的
// 那個區塊套金色高亮,呼應 archetypeIconWrapPrimary 既有的金框視覺語彙。
function HeroStatusPanel() {
  const heroHp = useGameState((state) => state.heroHp);
  const equipment = useGameState((state) => state.equipment);
  const itemInstances = useGameState((state) => state.itemInstances);
  const level = useGameState((state) => state.level);
  const job = useGameState((state) => state.job);

  const currentTier = getCurrentTier(level.level);
  const substatTotals = getSubstatTotals(equipment, itemInstances);
  const bonusTotals = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const heroSchool = getArchetypeComposition(job.archetype).damageType;
  const isPhysical = heroSchool === 'physical';

  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>角色狀態</Text>
      <Text style={styles.statusLine}>
        Lv{level.level} · HP {heroHp}/{heroMaxHp(level.level)}
      </Text>
      <Text style={styles.statusLine}>
        物理防禦 {Math.round(heroDefensePower(level.level, currentTier, substatTotals.physicalResistance))}　魔法防禦{' '}
        {Math.round(heroDefensePower(level.level, currentTier, substatTotals.magicResistance))}
      </Text>
      <Text style={[styles.statusLine, isPhysical && styles.statusLineHighlight]}>
        物理攻擊力 {Math.round(heroAttackPower(level.level, currentTier, substatTotals.physicalAttack))}
      </Text>
      <Text style={[styles.statusLine, !isPhysical && styles.statusLineHighlight]}>
        魔法攻擊力 {Math.round(heroAttackPower(level.level, currentTier, substatTotals.magicAttack))}
      </Text>
      <Text style={[styles.statusLine, isPhysical && styles.statusLineHighlight]}>
        物理:爆擊率 {Math.round(substatTotals.physicalCritRate * 100)}% / 爆擊傷害 +
        {Math.round(substatTotals.physicalCritDamage * 100)}%
      </Text>
      <Text style={[styles.statusLine, !isPhysical && styles.statusLineHighlight]}>
        魔法:爆擊率 {Math.round(substatTotals.magicCritRate * 100)}% / 爆擊傷害 +
        {Math.round(substatTotals.magicCritDamage * 100)}%
      </Text>
      <Text style={styles.statusLine}>
        總加成:經驗+{Math.round(bonusTotals.exp * 100)}% / 金幣+{Math.round(bonusTotals.coins * 100)}% / 速度+
        {Math.round(bonusTotals.speed * 100)}%
      </Text>
      <Text style={styles.statusLine}>職業階級倍率 x{calcCombatMultiplier(job.archetype, currentTier).toFixed(2)}</Text>
    </View>
  );
}

// 第一層:6個職業各自一個icon,不再用「物理/魔法 x 近戰/遠程/輔助」的文字分組樹狀圖——
// 一眼就能看到6個職業,點哪個都直接進到那個職業的階級分支畫面。
function ArchetypeGrid({
  job,
  secondaryJob,
  hasChosenJob,
  onSelect,
}: {
  job: Archetype;
  secondaryJob: Archetype | null;
  hasChosenJob: boolean;
  onSelect: (archetype: Archetype) => void;
}) {
  return (
    <View style={styles.archetypeGrid}>
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
      <Text style={styles.detailDesc}>點下面的階級可以看那一階的技能敘述,不管解鎖了沒都能先看。</Text>

      <View style={styles.tierRow}>
        {TIERS.map((tier) => {
          const unlocked = currentLevel >= TIER_UNLOCK_LEVELS[tier];
          // 還沒真的選定這個職業之前(!isPrimary),分支還沒選,先用分支A的稱號當預覽代表——
          // 兩個分支在1階本來就同名,2階起才分岔,這裡只是讓玩家先看到「大概會變成什麼身分」。
          const tierTitle = getJobTitle(archetype, isPrimary ? branch : 'A', tier);
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

      {!hasChosenJob ? (
        <View style={styles.detailActions}>
          <Pressable style={[styles.actionButton, !canGraduate && styles.actionButtonDisabled]} onPress={onSetPrimary}>
            <Text style={styles.actionLabel}>設為主職(畢業)</Text>
          </Pressable>
          {!canGraduate && <Text style={styles.secondaryLocked}>Lv{graduateLevel} 畢業後才能選定主職</Text>}
        </View>
      ) : isPrimary ? (
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
function SkillDetailPanel({
  archetype,
  tier,
  branch,
  skillLevels,
  onBack,
}: {
  archetype: Archetype;
  tier: JobTier;
  branch: JobBranch;
  skillLevels: SkillTreeLevels[Archetype];
  onBack: () => void;
}) {
  const [previewSlot, setPreviewSlot] = useState<SkillSlotId>('active1');
  const previewLevel = skillLevels[previewSlot];
  const flavor = getSlotFlavor(archetype, tier, previewSlot);
  const tierTitle = getJobTitle(archetype, branch, tier);

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
          const slotLevel = skillLevels[slot];
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
            </Pressable>
          );
        })}
      </View>
      <View style={styles.previewDetail}>
        <Text style={styles.previewDetailName}>
          {flavor.name} Lv.{previewLevel}
        </Text>
        <Text style={styles.previewDetailDesc}>{flavor.description}</Text>
        <Text style={styles.previewDetailBonus}>{getSkillSlotBonusDescription(archetype, previewSlot, previewLevel)}</Text>
      </View>
    </View>
  );
}

type DrillView = 'archetypes' | 'tiers' | 'skills';

export function JobSelector() {
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skillTree = useGameState((state) => state.skillTree);
  const transferFragments = useGameState((state) => state.transferFragments);
  const transferProofs = useGameState((state) => state.transferProofs);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const setJob = useGameState((state) => state.setJob);
  const setSecondaryJob = useGameState((state) => state.setSecondaryJob);

  const [view, setView] = useState<DrillView>('archetypes');
  const [viewingArchetype, setViewingArchetype] = useState<Archetype>(job.archetype);
  const [viewingTier, setViewingTier] = useState<JobTier>(1);

  const currentTier = getCurrentTier(level.level);
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
          <HeroStatusPanel />
          <ArchetypeGrid
            job={job.archetype}
            secondaryJob={secondaryJob}
            hasChosenJob={hasChosenJob}
            onSelect={(archetype) => {
              setViewingArchetype(archetype);
              setView('tiers');
            }}
          />
        </>
      )}

      {view === 'tiers' && (
        <TierList
          archetype={viewingArchetype}
          isPrimary={isViewingPrimary}
          isSecondary={isViewingSecondary}
          branch={job.branch}
          currentTier={currentTier}
          hasChosenJob={hasChosenJob}
          graduateLevel={TIER_UNLOCK_LEVELS[2]}
          currentLevel={level.level}
          dualClassUnlocked={dualClassUnlocked}
          transferFragmentCount={transferFragments[viewingArchetype] ?? 0}
          transferProofCount={transferProofs[viewingArchetype] ?? 0}
          onBack={() => setView('archetypes')}
          onSetPrimary={() => setJob(viewingArchetype, job.branch)}
          onSetBranch={(b) => setJob(job.archetype, b)}
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
          branch={isViewingPrimary ? job.branch : 'A'}
          skillLevels={skillTree[viewingArchetype]}
          onBack={() => setView('tiers')}
        />
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
  statusCard: {
    width: '100%',
    gap: 3,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  statusTitle: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusLine: {
    color: '#c8c8d0',
    fontSize: 11,
  },
  statusLineHighlight: {
    color: '#c9a94f',
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
    fontSize: 10,
    fontWeight: '700',
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
  archetypeSwitchIconWrapActive: {
    backgroundColor: '#4a4456',
    borderWidth: 2,
    borderColor: '#c9a94f',
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
    fontSize: 9,
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
    borderColor: '#3a3a45',
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
    fontSize: 10,
    fontWeight: '700',
  },
  detailDesc: {
    color: '#c8c8d0',
    fontSize: 12,
    lineHeight: 17,
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
