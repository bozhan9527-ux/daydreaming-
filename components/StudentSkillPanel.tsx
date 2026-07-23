import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ACTIVE_SLOT_IDS,
  isPassiveSlot,
  PASSIVE_SLOT_IDS,
  skillSlotUpgradeBookCost,
  SkillSlotId,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import {
  canUpgradeStudentSkillSlot,
  getStudentSkillFlavor,
  getStudentSkillSlotBonusDescription,
  STUDENT_SKILL_LEVEL_CAP,
} from '../game/studentSkillTree';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const TILE_SIZE = 56;

// 學生技能樹獨立分頁(從併入前的 SkillPanel 學生分支搬出):畢業前投資的技能永久保留,
// 加成疊加在職業技能之上,不管畢業前後都能持續在這裡花技能書升級——不再跟職業技能樹
// 共用同一個切換 tab,直接從職業分頁第一層的「學生」格子進來。
export function StudentSkillPanel({ onBack }: { onBack: () => void }) {
  const archetype = useGameState((state) => state.job.archetype);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const level = useGameState((state) => state.level);
  const skillBooks = useGameState((state) => state.skillBooks);
  const upgradeStudentSkillSlot = useGameState((state) => state.upgradeStudentSkillSlot);
  const upgradeStudentSkillSlotMax = useGameState((state) => state.upgradeStudentSkillSlotMax);

  const [selectedSlot, setSelectedSlot] = useState<SkillSlotId>('active1');

  const availableBooks = skillBooks[0];
  const selectedLevel = studentSkillTree[selectedSlot];
  const selectedBookCost = skillSlotUpgradeBookCost(selectedLevel);
  const canUpgradeSelected = canUpgradeStudentSkillSlot(selectedLevel, availableBooks);
  const selectedAtCap = selectedLevel >= STUDENT_SKILL_LEVEL_CAP;
  const selectedFlavor = getStudentSkillFlavor(level.level, selectedSlot);
  const selectedBonusDesc = getStudentSkillSlotBonusDescription(selectedSlot, selectedLevel);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonLabel}>‹ 職業</Text>
        </Pressable>
        <Text style={styles.headerTitle}>學生技能</Text>
      </View>

      <Text style={styles.hint}>
        {hasChosenJob
          ? '畢業前投資的學生技能永久保留,加成疊加在職業技能之上,仍可持續花書升級'
          : '這是你的學生技能,畢業後不會消失,加成會疊加在職業技能之上並可以持續升級'}
      </Text>

      <View style={styles.grid}>
        {[...PASSIVE_SLOT_IDS, ...ACTIVE_SLOT_IDS].map((slot) => {
          const slotLevel = studentSkillTree[slot];
          const isSelected = slot === selectedSlot;
          const icon = getSkillIcon(archetype, slot, 1);
          return (
            <Pressable
              key={slot}
              style={[styles.tile, isSelected && styles.tileSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <View style={styles.iconWrap}>
                <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={3} />
              </View>
              <View style={styles.tileKindTag}>
                <Text style={styles.tileKindTagText}>{isPassiveSlot(slot) ? '被動' : '主動'}</Text>
              </View>
              <View style={styles.tileLevelBadge}>
                <Text style={styles.tileLevelText}>
                  {slotLevel}/{STUDENT_SKILL_LEVEL_CAP}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailKind}>{isPassiveSlot(selectedSlot) ? '被動技能' : '主動技能'}</Text>
          <Text style={styles.detailName}>
            {selectedFlavor.name} {selectedLevel}/{STUDENT_SKILL_LEVEL_CAP}
            {selectedAtCap ? '(已達上限)' : ''}
          </Text>
        </View>
        <Text style={styles.detailDesc}>{selectedFlavor.description}</Text>
        <Text style={styles.detailBonus}>{selectedBonusDesc}</Text>

        <View style={styles.upgradeButtonRow}>
          <Pressable
            style={[styles.upgradeButton, !canUpgradeSelected && styles.upgradeButtonDisabled]}
            onPress={() => upgradeStudentSkillSlot(selectedSlot)}
            disabled={!canUpgradeSelected}
          >
            <Text style={styles.upgradeLabel}>
              {selectedAtCap ? '已達上限' : `升級 (${selectedBookCost} 本初階技能書,持有 ${availableBooks} 本)`}
            </Text>
          </Pressable>
          {!selectedAtCap && (
            <Pressable
              style={[styles.upgradeButtonMax, !canUpgradeSelected && styles.upgradeButtonDisabled]}
              onPress={() => upgradeStudentSkillSlotMax(selectedSlot)}
              disabled={!canUpgradeSelected}
            >
              <Text style={styles.upgradeLabel}>衝到底</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
    gap: 10,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  headerTitle: {
    color: '#c9a94f',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    backgroundColor: '#2a2a35',
    borderWidth: 2,
    borderColor: '#59462b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: '#c9a94f',
    backgroundColor: '#4a4456',
  },
  iconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileKindTag: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  tileKindTagText: {
    color: '#c9a94f',
    fontSize: 8,
    fontWeight: '600',
  },
  tileLevelBadge: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tileLevelText: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 4,
    borderRadius: 4,
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
  detailHeader: {
    gap: 2,
  },
  detailKind: {
    color: '#8a8a95',
    fontSize: 11,
  },
  detailName: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
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
});
