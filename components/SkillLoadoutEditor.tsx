import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype, JobBranch, JobTier } from '../game/combat';
import {
  ACTIVE_SLOT_IDS,
  ActiveSkillRef,
  ActiveSkillSlotId,
  activeSkillDamageCutRatio,
  activeSkillTriggerIntervalSeconds,
  countBorrowedActiveSlots,
  countBorrowedPassiveSlots,
  getPassiveBonusValue,
  MAX_BORROWED_ACTIVE_SLOTS,
  MAX_BORROWED_PASSIVE_SLOTS,
  PASSIVE_SLOT_IDS,
  PassiveSkillRef,
  PassiveSlotId,
  resolveSkillLevel,
  SKILL_LEVEL_CAP,
  SKILL_SLOT_NAMES,
  SkillSlotId,
  SkillSource,
  SkillTreeLevels,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { getStudentSkillFlavor, STUDENT_SKILL_LEVEL_CAP } from '../game/studentSkillTree';
import { useGameState } from '../hooks/useGameState';
import { ARCHETYPE_LABELS, ARCHETYPES, getSlotFlavor } from './JobSelector';
import { PixelSprite } from './PixelSprite';

// 每個職業階級(1~5)的技能都是完全獨立的技能,不加總——玩家可以自由挑選「哪一階、哪個
// 職業(或學生)的哪一格」放進7個技能欄(3被動+4主動),不限於目前職業/目前階級自己的版本。
// 借用來源的顯示名稱:自己職業自己那一階用「依階級瀏覽」同一套花名(見 JobSelector.tsx 的
// getSlotFlavor),學生用學生自己的花名(依學生自己投資的等級門檻),其餘(別的職業任一階)
// 沒有對應的 branch 資訊可查,維持印通用名稱。
function displaySkillName(
  source: SkillSource,
  sourceSlot: SkillSlotId,
  tier: JobTier,
  ownArchetype: Archetype,
  ownBranch: JobBranch,
  studentSkillTree: Record<SkillSlotId, number>
): string {
  if (source === 'student') return getStudentSkillFlavor(studentSkillTree[sourceSlot], sourceSlot).name;
  if (source !== ownArchetype) return SKILL_SLOT_NAMES[source][sourceSlot];
  return getSlotFlavor(source, ownBranch, tier, sourceSlot).name;
}

function sourceLabel(source: SkillSource): string {
  return source === 'student' ? '學生' : ARCHETYPE_LABELS[source];
}

const ALL_TIERS: JobTier[] = [1, 2, 3, 4, 5];
const TILE_SIZE = 40;

interface SkillLoadoutEditorProps {
  archetype: Archetype;
  branch: JobBranch;
}

interface LearnedActiveOption {
  source: SkillSource;
  tier: JobTier;
  sourceSlot: ActiveSkillSlotId;
  level: number;
  intervalSeconds: number;
  damageCutPct: number;
}

// 效益排序輔助:不管來源是哪一階職業還是學生,4個主動技能欄現在全部是同一種效果
// (造成傷害),直接用「每秒平均削減戰鬥時間的比例」(削減比例/觸發間隔)當唯一排序依據
// 由高到低排,玩家一眼就看得出哪個選項效益最高。levelCap 依來源決定(職業任一階=
// SKILL_LEVEL_CAP,學生=STUDENT_SKILL_LEVEL_CAP),呼應每個來源「單獨滿級」就有滿值表現。
function collectLearnedActiveOptions(
  skillTree: SkillTreeLevels,
  studentSkillTree: Record<SkillSlotId, number>
): LearnedActiveOption[] {
  const options: LearnedActiveOption[] = [];
  ARCHETYPES.forEach((archetype) => {
    ALL_TIERS.forEach((tier) => {
      ACTIVE_SLOT_IDS.forEach((slot) => {
        const level = skillTree[archetype][tier][slot];
        if (level > 0) {
          options.push({
            source: archetype,
            tier,
            sourceSlot: slot,
            level,
            intervalSeconds: activeSkillTriggerIntervalSeconds(slot, level, SKILL_LEVEL_CAP),
            damageCutPct: Math.round(activeSkillDamageCutRatio(slot, level, SKILL_LEVEL_CAP) * 1000) / 10,
          });
        }
      });
    });
  });
  ACTIVE_SLOT_IDS.forEach((slot) => {
    const level = studentSkillTree[slot];
    if (level > 0) {
      options.push({
        source: 'student',
        tier: 1,
        sourceSlot: slot,
        level,
        intervalSeconds: activeSkillTriggerIntervalSeconds(slot, level, STUDENT_SKILL_LEVEL_CAP),
        damageCutPct: Math.round(activeSkillDamageCutRatio(slot, level, STUDENT_SKILL_LEVEL_CAP) * 1000) / 10,
      });
    }
  });
  return options.sort((a, b) => b.damageCutPct / b.intervalSeconds - a.damageCutPct / a.intervalSeconds);
}

interface LearnedPassiveOption {
  source: SkillSource;
  tier: JobTier;
  sourceSlot: PassiveSlotId;
  level: number;
  bonusPct: number;
}

function collectLearnedPassiveOptions(
  skillTree: SkillTreeLevels,
  studentSkillTree: Record<SkillSlotId, number>
): LearnedPassiveOption[] {
  const passiveSlots = PASSIVE_SLOT_IDS as PassiveSlotId[];
  const options: LearnedPassiveOption[] = [];
  ARCHETYPES.forEach((archetype) => {
    ALL_TIERS.forEach((tier) => {
      passiveSlots.forEach((slot) => {
        const level = skillTree[archetype][tier][slot];
        if (level > 0) {
          options.push({ source: archetype, tier, sourceSlot: slot, level, bonusPct: Math.round(getPassiveBonusValue(level) * 1000) / 10 });
        }
      });
    });
  });
  passiveSlots.forEach((slot) => {
    const level = studentSkillTree[slot];
    if (level > 0) {
      options.push({ source: 'student', tier: 1, sourceSlot: slot, level, bonusPct: Math.round(getPassiveBonusValue(level) * 1000) / 10 });
    }
  });
  return options.sort((a, b) => b.bonusPct - a.bonusPct);
}

type EditingTarget = { kind: 'active'; position: ActiveSkillSlotId } | { kind: 'passive'; position: PassiveSlotId };

export function SkillLoadoutEditor({ archetype, branch }: SkillLoadoutEditorProps) {
  const skillTree = useGameState((state) => state.skillTree);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const activeSkillLoadout = useGameState((state) => state.activeSkillLoadout);
  const passiveSkillLoadout = useGameState((state) => state.passiveSkillLoadout);
  const setActiveSkillLoadout = useGameState((state) => state.setActiveSkillLoadout);
  const setPassiveSkillLoadout = useGameState((state) => state.setPassiveSkillLoadout);

  const [editing, setEditing] = useState<EditingTarget | null>(null);

  const activeOptions = collectLearnedActiveOptions(skillTree, studentSkillTree);
  const passiveOptions = collectLearnedPassiveOptions(skillTree, studentSkillTree);

  const borrowedActiveCount = countBorrowedActiveSlots(activeSkillLoadout, archetype);
  const borrowedPassiveCount = countBorrowedPassiveSlots(passiveSkillLoadout, archetype);

  const editingActiveRef = editing?.kind === 'active' ? activeSkillLoadout[editing.position] : null;
  const editingPassiveRef = editing?.kind === 'passive' ? passiveSkillLoadout[editing.position] : null;
  const editingActiveAlreadyBorrowed = editingActiveRef !== null && editingActiveRef.source !== archetype;
  const editingPassiveAlreadyBorrowed = editingPassiveRef !== null && editingPassiveRef.source !== archetype;
  const activeBorrowCapReached = borrowedActiveCount >= MAX_BORROWED_ACTIVE_SLOTS && !editingActiveAlreadyBorrowed;
  const passiveBorrowCapReached = borrowedPassiveCount >= MAX_BORROWED_PASSIVE_SLOTS && !editingPassiveAlreadyBorrowed;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        點一個欄位可以更換要放的技能——不限於目前職業自己的招式或目前階級,任何職業任一階、或學生期
        投資過等級的技能都能塞進來。主動最多借{MAX_BORROWED_ACTIVE_SLOTS}格別的來源
        (已借 {borrowedActiveCount}/{MAX_BORROWED_ACTIVE_SLOTS}),被動最多借{MAX_BORROWED_PASSIVE_SLOTS}格
        (已借 {borrowedPassiveCount}/{MAX_BORROWED_PASSIVE_SLOTS})。
      </Text>

      <Text style={styles.sectionTitle}>主動技能</Text>
      <View style={styles.positionRow}>
        {ACTIVE_SLOT_IDS.map((position) => {
          const ref = activeSkillLoadout[position];
          const isEditing = editing?.kind === 'active' && editing.position === position;
          const isBorrowed = ref !== null && ref.source !== archetype;
          const iconArchetype = ref === null ? archetype : ref.source === 'student' ? archetype : ref.source;
          const icon = ref ? getSkillIcon(iconArchetype, ref.sourceSlot, ref.tier as JobTier) : null;
          const level = ref ? resolveSkillLevel(ref, skillTree, studentSkillTree) : 0;
          return (
            <Pressable
              key={position}
              style={[styles.positionTile, isEditing && styles.positionTileActive]}
              onPress={() => setEditing(isEditing ? null : { kind: 'active', position })}
            >
              <View style={styles.iconWrap}>
                {icon && <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2} />}
              </View>
              {isBorrowed && ref && (
                <View style={styles.borrowedTag}>
                  <Text style={styles.borrowedTagText}>{sourceLabel(ref.source)}</Text>
                </View>
              )}
              <Text style={styles.positionLevel}>{ref ? `Lv.${level}` : '空著'}</Text>
              <Text style={styles.positionLabel} numberOfLines={1}>
                {ref ? displaySkillName(ref.source, ref.sourceSlot, ref.tier as JobTier, archetype, branch, studentSkillTree) : '未配置'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {editing?.kind === 'active' && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>選擇要放進這格的主動技能</Text>
          <Pressable
            style={styles.pickerRow}
            onPress={() => {
              setActiveSkillLoadout(editing.position, null);
              setEditing(null);
            }}
          >
            <Text style={styles.pickerRowText}>清空這格</Text>
          </Pressable>
          {activeOptions.length === 0 ? (
            <Text style={styles.emptyHint}>還沒有已經投資過等級的主動技能,先花技能書升級任一招式再回來配置。</Text>
          ) : (
            activeOptions.map((option) => {
              // 已經借滿上限時,別的來源選項直接鎖住不能點——自己職業任一階的技能不受影響,
              // 那些永遠能選。避免玩家點了才被 store 的 setActiveSkillLoadout 靜默擋下。
              const isForeign = option.source !== archetype;
              const locked = isForeign && activeBorrowCapReached;
              const ref: ActiveSkillRef = { source: option.source, tier: option.tier, sourceSlot: option.sourceSlot };
              return (
                <Pressable
                  key={`${option.source}-${option.tier}-${option.sourceSlot}`}
                  style={[styles.pickerRow, locked && styles.pickerRowLocked]}
                  disabled={locked}
                  onPress={() => {
                    setActiveSkillLoadout(editing.position, ref);
                    setEditing(null);
                  }}
                >
                  <Text style={[styles.pickerRowText, locked && styles.pickerRowTextLocked]}>
                    {displaySkillName(option.source, option.sourceSlot, option.tier, archetype, branch, studentSkillTree)} Lv.{option.level}
                    (每{option.intervalSeconds}秒削減{option.damageCutPct}%戰鬥時間)
                  </Text>
                  <Text style={styles.pickerRowSub}>
                    {sourceLabel(option.source)}
                    {option.source !== 'student' ? `${option.tier}階` : ''}
                    {locked ? `(已借滿${MAX_BORROWED_ACTIVE_SLOTS}格)` : ''}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>被動技能</Text>
      <View style={styles.positionRow}>
        {(PASSIVE_SLOT_IDS as PassiveSlotId[]).map((position) => {
          const ref = passiveSkillLoadout[position];
          const isEditing = editing?.kind === 'passive' && editing.position === position;
          const isBorrowed = ref !== null && ref.source !== archetype;
          const iconArchetype = ref === null ? archetype : ref.source === 'student' ? archetype : ref.source;
          const icon = ref ? getSkillIcon(iconArchetype, ref.sourceSlot, ref.tier as JobTier) : null;
          const level = ref ? resolveSkillLevel(ref, skillTree, studentSkillTree) : 0;
          return (
            <Pressable
              key={position}
              style={[styles.positionTile, isEditing && styles.positionTileActive]}
              onPress={() => setEditing(isEditing ? null : { kind: 'passive', position })}
            >
              <View style={styles.iconWrap}>
                {icon && <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2} />}
              </View>
              {isBorrowed && ref && (
                <View style={styles.borrowedTag}>
                  <Text style={styles.borrowedTagText}>{sourceLabel(ref.source)}</Text>
                </View>
              )}
              <Text style={styles.positionLevel}>{ref ? `Lv.${level}` : '空著'}</Text>
              <Text style={styles.positionLabel} numberOfLines={1}>
                {ref ? displaySkillName(ref.source, ref.sourceSlot, ref.tier as JobTier, archetype, branch, studentSkillTree) : '未配置'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {editing?.kind === 'passive' && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>選擇要放進這格的被動技能</Text>
          <Pressable
            style={styles.pickerRow}
            onPress={() => {
              setPassiveSkillLoadout(editing.position, null);
              setEditing(null);
            }}
          >
            <Text style={styles.pickerRowText}>清空這格</Text>
          </Pressable>
          {passiveOptions.length === 0 ? (
            <Text style={styles.emptyHint}>還沒有已經投資過等級的被動技能,先花技能書升級任一項再回來配置。</Text>
          ) : (
            passiveOptions.map((option) => {
              const isForeign = option.source !== archetype;
              const locked = isForeign && passiveBorrowCapReached;
              const ref: PassiveSkillRef = { source: option.source, tier: option.tier, sourceSlot: option.sourceSlot };
              return (
                <Pressable
                  key={`${option.source}-${option.tier}-${option.sourceSlot}`}
                  style={[styles.pickerRow, locked && styles.pickerRowLocked]}
                  disabled={locked}
                  onPress={() => {
                    setPassiveSkillLoadout(editing.position, ref);
                    setEditing(null);
                  }}
                >
                  <Text style={[styles.pickerRowText, locked && styles.pickerRowTextLocked]}>
                    {displaySkillName(option.source, option.sourceSlot, option.tier, archetype, branch, studentSkillTree)} Lv.{option.level}
                    (永久+{option.bonusPct}%)
                  </Text>
                  <Text style={styles.pickerRowSub}>
                    {sourceLabel(option.source)}
                    {option.source !== 'student' ? `${option.tier}階` : ''}
                    {locked ? `(已借滿${MAX_BORROWED_PASSIVE_SLOTS}格)` : ''}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#c9a94f',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  positionTile: {
    width: TILE_SIZE + 14,
    alignItems: 'center',
    gap: 2,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  positionTileActive: {
    borderColor: '#6ab0e0',
    backgroundColor: '#274357',
  },
  iconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowedTag: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  borrowedTagText: {
    color: '#6ab0e0',
    fontSize: 8,
    fontWeight: '600',
  },
  positionLevel: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '700',
  },
  positionLabel: {
    color: '#8a8a95',
    fontSize: 9,
    textAlign: 'center',
  },
  pickerCard: {
    width: '100%',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  pickerTitle: {
    color: '#c9a94f',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  // 職業認同上限鎖住的選項:淡化+不可點,跟一般選項區分開,不用等玩家點了才靠 toast 說明。
  pickerRowLocked: {
    opacity: 0.4,
  },
  pickerRowText: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  pickerRowTextLocked: {
    color: '#8a8a95',
  },
  pickerRowSub: {
    color: '#6ab0e0',
    fontSize: 11,
  },
  emptyHint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 6,
  },
});
