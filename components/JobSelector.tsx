import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Archetype,
  calcCombatMultiplier,
  canUnlockDualClass,
  DamageType,
  DUAL_CLASS_UNLOCK_LEVEL,
  getArchetypeByComposition,
  getCurrentTier,
  getJobTitle,
  JobBranch,
  Subtype,
} from '../game/combat';
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
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const PREVIEW_TILE_SIZE = 48;

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

const DAMAGE_TYPES: DamageType[] = ['physical', 'magic'];
const DAMAGE_TYPE_LABELS: Record<DamageType, string> = { physical: '物理', magic: '魔法' };
const SUBTYPES: Subtype[] = ['melee', 'ranged', 'support'];
const SUBTYPE_LABELS: Record<Subtype, string> = { melee: '近戰', ranged: '遠程', support: '輔助' };

const BRANCHES: JobBranch[] = ['A', 'B'];

// 職業樹點進去可以直接預覽該職業6個技能格(不用先設成主職、切去技能分頁才看得到),
// 純預覽不含升級操作(升級還是要到「技能」分頁,那邊才有本職的資源可以花)。
function SkillPreviewGrid({ archetype, skillLevels }: { archetype: Archetype; skillLevels: SkillTreeLevels[Archetype] }) {
  const [previewSlot, setPreviewSlot] = useState<SkillSlotId>('active1');
  const previewLevel = skillLevels[previewSlot];

  return (
    <View style={styles.previewSection}>
      <View style={styles.previewGrid}>
        {[...PASSIVE_SLOT_IDS, ...ACTIVE_SLOT_IDS].map((slot) => {
          const slotLevel = skillLevels[slot];
          const icon = getSkillIcon(archetype, slot, slotLevel);
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
          {SKILL_SLOT_NAMES[archetype][previewSlot]} Lv.{previewLevel}
        </Text>
        <Text style={styles.previewDetailDesc}>{SKILL_SLOT_DESCRIPTIONS[archetype][previewSlot]}</Text>
        <Text style={styles.previewDetailBonus}>{getSkillSlotBonusDescription(archetype, previewSlot, previewLevel)}</Text>
      </View>
    </View>
  );
}

interface JobDetailCardProps {
  archetype: Archetype;
  isPrimary: boolean;
  isSecondary: boolean;
  branch: JobBranch;
  tier: ReturnType<typeof getCurrentTier>;
  dualClassUnlocked: boolean;
  skillLevels: SkillTreeLevels[Archetype];
  onSetPrimary: () => void;
  onSetBranch: (branch: JobBranch) => void;
  onToggleSecondary: () => void;
}

function JobDetailCard({
  archetype,
  isPrimary,
  isSecondary,
  branch,
  tier,
  dualClassUnlocked,
  skillLevels,
  onSetPrimary,
  onSetBranch,
  onToggleSecondary,
}: JobDetailCardProps) {
  const icon = getSkillIcon(archetype, 'active1', 0);
  const combatBonusPct = Math.round((calcCombatMultiplier(archetype, tier) - 1) * 100);

  return (
    <View style={styles.detailCard}>
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

      <Text style={styles.detailCombatBonus}>職業戰鬥加成:+{combatBonusPct}%</Text>
      <Text style={styles.detailDesc}>點技能格可以直接預覽介紹跟目前等級;要升級的話,設為主職後到「技能」分頁操作。</Text>

      <SkillPreviewGrid archetype={archetype} skillLevels={skillLevels} />

      {isPrimary && (
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
      )}

      {!isPrimary && (
        <View style={styles.detailActions}>
          <Pressable style={styles.actionButton} onPress={onSetPrimary}>
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
      )}
    </View>
  );
}

export function JobSelector() {
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const skillTree = useGameState((state) => state.skillTree);
  const setJob = useGameState((state) => state.setJob);
  const setSecondaryJob = useGameState((state) => state.setSecondaryJob);

  const [viewingArchetype, setViewingArchetype] = useState<Archetype>(job.archetype);

  const tier = getCurrentTier(level.level);
  const title = getJobTitle(job.archetype, job.branch, tier);
  const dualClassUnlocked = canUnlockDualClass(level.level);
  const isViewingPrimary = viewingArchetype === job.archetype;
  const isViewingSecondary = viewingArchetype === secondaryJob;

  return (
    <View style={styles.container}>
      <Text style={styles.currentTitle}>{title}</Text>

      <View style={styles.tree}>
        {DAMAGE_TYPES.map((damageType) => (
          <View key={damageType} style={styles.treeBranch}>
            <Text style={styles.treeBranchLabel}>{DAMAGE_TYPE_LABELS[damageType]}</Text>
            {SUBTYPES.map((subtype) => {
              const archetype = getArchetypeByComposition(damageType, subtype);
              const isPrimary = job.archetype === archetype;
              const isSecondary = secondaryJob === archetype;
              const isViewing = viewingArchetype === archetype;
              return (
                <Pressable
                  key={archetype}
                  style={[styles.treeNode, isViewing && styles.treeNodeViewing]}
                  onPress={() => setViewingArchetype(archetype)}
                >
                  <Text style={styles.treeNodeLabel}>{SUBTYPE_LABELS[subtype]}</Text>
                  {isPrimary && <Text style={styles.treeNodeTag}>主</Text>}
                  {isSecondary && <Text style={styles.treeNodeTag}>副</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <JobDetailCard
        archetype={viewingArchetype}
        isPrimary={isViewingPrimary}
        isSecondary={isViewingSecondary}
        branch={job.branch}
        tier={tier}
        dualClassUnlocked={dualClassUnlocked}
        skillLevels={skillTree[viewingArchetype]}
        onSetPrimary={() => setJob(viewingArchetype, job.branch)}
        onSetBranch={(b) => setJob(job.archetype, b)}
        onToggleSecondary={() => setSecondaryJob(isViewingSecondary ? null : viewingArchetype)}
      />
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
  tree: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  treeBranch: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 2,
    borderColor: '#3a3a45',
  },
  treeBranchLabel: {
    color: '#8a8a95',
    fontSize: 11,
    fontWeight: '600',
  },
  treeNode: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  treeNodeViewing: {
    backgroundColor: '#4a4456',
    borderWidth: 1,
    borderColor: '#c9a94f',
  },
  treeNodeLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  treeNodeTag: {
    color: '#c9a94f',
    fontSize: 10,
    fontWeight: '700',
  },
  detailCard: {
    width: '100%',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  previewSection: {
    gap: 8,
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
  detailSkillName: {
    color: '#8a8a95',
    fontSize: 11,
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
  detailBonus: {
    color: '#8fd4a8',
    fontSize: 12,
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
  secondaryLocked: {
    color: '#6a6a75',
    fontSize: 11,
  },
});
