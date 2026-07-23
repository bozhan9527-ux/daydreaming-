import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype, JobBranch, JobTier } from '../game/combat';
import {
  activeSkillDamageCutRatio,
  ACTIVE_SLOT_IDS,
  activeSkillTriggerIntervalSeconds,
  ActiveSkillSlotId,
  countBorrowedActiveSlots,
  effectiveSkillLevel,
  MAX_BORROWED_ACTIVE_SLOTS,
  SKILL_SLOT_NAMES,
  SkillTreeLevels,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { ARCHETYPE_LABELS, ARCHETYPES, getSlotFlavor } from './JobSelector';
import { PixelSprite } from './PixelSprite';

// 技能格顯示名稱:玩家自己目前這個職業的技能,名稱要跟「依階級瀏覽」畫面(JobSelector.tsx 的
// getSlotFlavor)一致——那邊 2 階起會顯示職業分支專屬的「花名」(例如速戰速決在餐廳服務生
// 底下顯示成「手腳俐落出餐」),這裡如果還印通用名稱「速戰速決」,玩家會找不到自己在瀏覽頁看到
// 的那個技能名字。借來的別職業技能沒有對應的 branch 資訊可查,維持印通用名稱。
function displaySkillName(
  slotArchetype: Archetype,
  slotSourceSlot: ActiveSkillSlotId,
  ownArchetype: Archetype,
  ownBranch: JobBranch,
  tier: JobTier
): string {
  if (slotArchetype !== ownArchetype) return SKILL_SLOT_NAMES[slotArchetype][slotSourceSlot];
  return getSlotFlavor(slotArchetype, ownBranch, tier, slotSourceSlot).name;
}

const TILE_SIZE = 44;

// 主動技能欄自選:轉職是這個遊戲的既有機制,skillTree 永久保留玩家投資過的每個職業的技能等級
// (見 game/skillTree.ts 的 SkillTreeLevels),所以玩家不限於目前職業自己的4招,可以把「已經
// 投資過等級的其他職業主動技能」也塞進這4個欄位——呼應「從已學習的職業技能中選擇」的需求。
// 職業認同上限(見 game/skillTree.ts 的 MAX_BORROWED_ACTIVE_SLOTS):4格最多只能借2格別的
// 職業技能,避免完全自由配置讓玩家的技能欄跟「目前是什麼職業」完全脫鉤。
interface SkillLoadoutEditorProps {
  archetype: Archetype;
  branch: JobBranch;
  tier: JobTier;
}

export function SkillLoadoutEditor({ archetype, branch, tier }: SkillLoadoutEditorProps) {
  const skillTree = useGameState((state) => state.skillTree);
  const activeSkillLoadout = useGameState((state) => state.activeSkillLoadout);
  const setActiveSkillLoadout = useGameState((state) => state.setActiveSkillLoadout);

  const [editingPosition, setEditingPosition] = useState<ActiveSkillSlotId | null>(null);

  const learnedOptions = collectLearnedActiveSkills(skillTree, tier);
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
          const level = ref ? effectiveSkillLevel(skillTree[ref.archetype], tier, ref.sourceSlot) : 0;
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
                {ref ? displaySkillName(ref.archetype, ref.sourceSlot, archetype, branch, tier) : '未配置'}
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
            learnedOptions.map((option) => {
              // 已經借滿上限時,別的職業技能選項直接鎖住不能點——跟自己職業的技能不衝突,
              // 那些永遠能選。避免玩家點了才被 store 的 setActiveSkillLoadout 靜默擋下、
              // 只留一個 toast 說明,不知道剛剛點的那格為什麼沒反應。
              const isForeign = option.archetype !== archetype;
              const locked = isForeign && borrowCapReached;
              return (
                <Pressable
                  key={`${option.archetype}-${option.sourceSlot}`}
                  style={[styles.pickerRow, locked && styles.pickerRowLocked]}
                  disabled={locked}
                  onPress={() => {
                    setActiveSkillLoadout(editingPosition, { archetype: option.archetype, sourceSlot: option.sourceSlot });
                    setEditingPosition(null);
                  }}
                >
                  <Text style={[styles.pickerRowText, locked && styles.pickerRowTextLocked]}>
                    {displaySkillName(option.archetype, option.sourceSlot, archetype, branch, tier)} Lv.{option.level}(每{option.intervalSeconds}秒削減
                    {option.damageCutPct}%戰鬥時間)
                  </Text>
                  <Text style={styles.pickerRowSub}>
                    {ARCHETYPE_LABELS[option.archetype]}
                    {locked ? `(已借滿${MAX_BORROWED_ACTIVE_SLOTS}格)` : ''}
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

interface LearnedActiveSkillOption {
  archetype: Archetype;
  sourceSlot: ActiveSkillSlotId;
  level: number;
  intervalSeconds: number;
  damageCutPct: number;
}

// 效益排序輔助:4個技能欄現在全部是同一種效果(造成傷害),不用再按「效果種類」分組——
// 直接用「每秒平均削減戰鬥時間的比例」(削減比例/觸發間隔)當唯一排序依據由高到低排,
// 玩家一眼就看得出哪個選項效益最高,不用自己心算換算。
function collectLearnedActiveSkills(skillTree: SkillTreeLevels, tier: JobTier): LearnedActiveSkillOption[] {
  const options: LearnedActiveSkillOption[] = [];
  ARCHETYPES.forEach((archetype) => {
    ACTIVE_SLOT_IDS.forEach((slot) => {
      const level = effectiveSkillLevel(skillTree[archetype], tier, slot);
      if (level > 0) {
        const intervalSeconds = activeSkillTriggerIntervalSeconds(slot, level);
        const cutRatio = activeSkillDamageCutRatio(slot, level);
        options.push({
          archetype,
          sourceSlot: slot,
          level,
          intervalSeconds,
          damageCutPct: Math.round(cutRatio * 1000) / 10,
        });
      }
    });
  });
  return options.sort((a, b) => b.damageCutPct / b.intervalSeconds - a.damageCutPct / a.intervalSeconds);
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
