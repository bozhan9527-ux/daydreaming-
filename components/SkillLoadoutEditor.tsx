import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype, JobTier } from '../game/combat';
import {
  ACTIVE_EFFECT_KIND_LABELS,
  ACTIVE_KIND_ORDER,
  ACTIVE_SLOT_IDS,
  activeSkillTriggerIntervalSeconds,
  ActiveSkillSlotId,
  countBorrowedActiveSlots,
  getActiveEffectKind,
  MAX_BORROWED_ACTIVE_SLOTS,
  SKILL_SLOT_NAMES,
  SkillTreeLevels,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { ARCHETYPE_LABELS, ARCHETYPES } from './JobSelector';
import { PixelSprite } from './PixelSprite';

const TILE_SIZE = 44;

// 主動技能欄自選:轉職是這個遊戲的既有機制,skillTree 永久保留玩家投資過的每個職業的技能等級
// (見 game/skillTree.ts 的 SkillTreeLevels),所以玩家不限於目前職業自己的4招,可以把「已經
// 投資過等級的其他職業主動技能」也塞進這4個欄位——呼應「從已學習的職業技能中選擇」的需求。
// 職業認同上限(見 game/skillTree.ts 的 MAX_BORROWED_ACTIVE_SLOTS):4格最多只能借2格別的
// 職業技能,避免完全自由配置讓玩家的技能欄跟「目前是什麼職業」完全脫鉤。
interface SkillLoadoutEditorProps {
  archetype: Archetype;
  tier: JobTier;
}

export function SkillLoadoutEditor({ archetype, tier }: SkillLoadoutEditorProps) {
  const skillTree = useGameState((state) => state.skillTree);
  const activeSkillLoadout = useGameState((state) => state.activeSkillLoadout);
  const setActiveSkillLoadout = useGameState((state) => state.setActiveSkillLoadout);

  const [editingPosition, setEditingPosition] = useState<ActiveSkillSlotId | null>(null);

  const learnedOptions = collectLearnedActiveSkills(skillTree);
  const borrowedCount = countBorrowedActiveSlots(activeSkillLoadout, archetype);
  const editingRef = editingPosition ? activeSkillLoadout[editingPosition] : null;
  const editingIsAlreadyBorrowed = editingRef !== null && editingRef.archetype !== archetype;
  const borrowCapReached = borrowedCount >= MAX_BORROWED_ACTIVE_SLOTS && !editingIsAlreadyBorrowed;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        點一個欄位可以更換要放的技能——不限於目前職業自己的招式,任何你投資過等級的職業技能都能塞進來,
        但最多只能借{MAX_BORROWED_ACTIVE_SLOTS}格別的職業技能(已借用 {borrowedCount}/{MAX_BORROWED_ACTIVE_SLOTS})。
      </Text>
      <View style={styles.positionRow}>
        {ACTIVE_SLOT_IDS.map((position) => {
          const ref = activeSkillLoadout[position];
          const tileArchetype = ref?.archetype ?? archetype;
          const tileSourceSlot = ref?.sourceSlot ?? position;
          const level = ref ? skillTree[ref.archetype][ref.sourceSlot] : 0;
          const icon = getSkillIcon(tileArchetype, tileSourceSlot, tier);
          const isBorrowed = ref !== null && ref.archetype !== archetype;
          const isEditing = editingPosition === position;
          return (
            <Pressable
              key={position}
              style={[styles.positionTile, isEditing && styles.positionTileActive]}
              onPress={() => setEditingPosition(isEditing ? null : position)}
            >
              <View style={styles.iconWrap}>
                <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2} />
              </View>
              {isBorrowed && (
                <View style={styles.borrowedTag}>
                  <Text style={styles.borrowedTagText}>{ARCHETYPE_LABELS[ref.archetype]}</Text>
                </View>
              )}
              <Text style={styles.positionLevel}>{ref ? `Lv.${level}` : '空著'}</Text>
              <Text style={styles.positionLabel} numberOfLines={1}>
                {ref ? SKILL_SLOT_NAMES[ref.archetype][ref.sourceSlot] : '未配置'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {editingPosition && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>選擇要放進這格的技能</Text>
          <Pressable
            style={styles.pickerRow}
            onPress={() => {
              setActiveSkillLoadout(editingPosition, null);
              setEditingPosition(null);
            }}
          >
            <Text style={styles.pickerRowText}>清空這格</Text>
          </Pressable>
          {learnedOptions.length === 0 ? (
            <Text style={styles.emptyHint}>還沒有已經投資過等級的主動技能,先花技能書升級任一招式再回來配置。</Text>
          ) : (
            learnedOptions.map((option, index) => {
              // 已經借滿上限時,別的職業技能選項直接鎖住不能點——跟自己職業的技能不衝突,
              // 那些永遠能選。避免玩家點了才被 store 的 setActiveSkillLoadout 靜默擋下、
              // 只留一個 toast 說明,不知道剛剛點的那格為什麼沒反應。
              const isForeign = option.archetype !== archetype;
              const locked = isForeign && borrowCapReached;
              // 效益排序輔助:同一種效果的選項排在一起(見 collectLearnedActiveSkills 的排序),
              // 換組時插一行效果標籤當分隔——玩家一眼就看得出「這幾個都是同一種效果,由快到慢
              // 排」,不用自己去猜排序邏輯。
              const showGroupHeader = index === 0 || learnedOptions[index - 1].effectKind !== option.effectKind;
              return (
                <View key={`${option.archetype}-${option.sourceSlot}`}>
                  {showGroupHeader && (
                    <Text style={styles.pickerGroupHeader}>{ACTIVE_EFFECT_KIND_LABELS[option.effectKind]}(觸發間隔由快到慢)</Text>
                  )}
                  <Pressable
                    style={[styles.pickerRow, locked && styles.pickerRowLocked]}
                    disabled={locked}
                    onPress={() => {
                      setActiveSkillLoadout(editingPosition, { archetype: option.archetype, sourceSlot: option.sourceSlot });
                      setEditingPosition(null);
                    }}
                  >
                    <Text style={[styles.pickerRowText, locked && styles.pickerRowTextLocked]}>
                      {SKILL_SLOT_NAMES[option.archetype][option.sourceSlot]} Lv.{option.level}({option.intervalSeconds}秒)
                    </Text>
                    <Text style={styles.pickerRowSub}>
                      {ARCHETYPE_LABELS[option.archetype]}
                      {locked ? `(已借滿${MAX_BORROWED_ACTIVE_SLOTS}格)` : ''}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

interface LearnedActiveSkillOption {
  archetype: Archetype;
  sourceSlot: ActiveSkillSlotId;
  level: number;
  effectKind: ReturnType<typeof getActiveEffectKind>;
  intervalSeconds: number;
}

// 效益排序輔助:同一種效果分組(見 ACTIVE_KIND_ORDER 的固定順序),組內按觸發間隔由快到慢排——
// 同一種效果「間隔越短=效益越高」是可以直接比較的客觀依據,不用另外發明一個跨效果種類的
// 綜合分數(見 game/skillTree.ts 的 ACTIVE_EFFECT_KIND_LABELS 註解)。
function collectLearnedActiveSkills(skillTree: SkillTreeLevels): LearnedActiveSkillOption[] {
  const options: LearnedActiveSkillOption[] = [];
  ARCHETYPES.forEach((archetype) => {
    ACTIVE_SLOT_IDS.forEach((slot) => {
      const level = skillTree[archetype][slot];
      if (level > 0) {
        options.push({
          archetype,
          sourceSlot: slot,
          level,
          effectKind: getActiveEffectKind(archetype, slot),
          intervalSeconds: activeSkillTriggerIntervalSeconds(slot, level),
        });
      }
    });
  });
  return options.sort((a, b) => {
    const kindOrderDiff = ACTIVE_KIND_ORDER.indexOf(a.effectKind) - ACTIVE_KIND_ORDER.indexOf(b.effectKind);
    if (kindOrderDiff !== 0) return kindOrderDiff;
    return a.intervalSeconds - b.intervalSeconds;
  });
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
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  positionTile: {
    width: TILE_SIZE + 16,
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
  pickerGroupHeader: {
    color: '#c9a94f',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
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
