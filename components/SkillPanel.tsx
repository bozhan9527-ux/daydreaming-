import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCurrentTier } from '../game/combat';
import {
  ACTIVE_SLOT_IDS,
  canUpgradeSkillSlot,
  isPassiveSlot,
  PASSIVE_SLOT_IDS,
  getSkillSlotBonusDescription,
  skillSlotLevelCap,
  skillSlotUpgradeCoinCost,
  skillSlotUpgradeCost,
  SKILL_SLOT_DESCRIPTIONS,
  SKILL_SLOT_NAMES,
  SkillSlotId,
} from '../game/skillTree';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

const TILE_SIZE = 56;

export function SkillPanel() {
  const archetype = useGameState((state) => state.job.archetype);
  const skillTree = useGameState((state) => state.skillTree);
  const level = useGameState((state) => state.level);
  const coins = useGameState((state) => state.coins);
  const upgradeSkillSlot = useGameState((state) => state.upgradeSkillSlot);

  const [selectedSlot, setSelectedSlot] = useState<SkillSlotId>('active1');

  const tier = getCurrentTier(level.level);
  const icon = getSkillIcon(archetype);
  const slotLevels = skillTree[archetype];
  const cap = skillSlotLevelCap(tier);

  const selectedLevel = slotLevels[selectedSlot];
  const selectedCost = skillSlotUpgradeCost(selectedLevel);
  const selectedCoinCost = skillSlotUpgradeCoinCost(selectedLevel);
  const canUpgradeSelected = canUpgradeSkillSlot(selectedLevel, tier, level.bankedExp, coins);
  const selectedAtCap = selectedLevel >= cap;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>技能書只顯示目前職業的技能;切換職業後這裡會跟著換一套</Text>

      <View style={styles.grid}>
        {[...PASSIVE_SLOT_IDS, ...ACTIVE_SLOT_IDS].map((slot) => {
          const slotLevel = slotLevels[slot];
          const isSelected = slot === selectedSlot;
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
                <Text style={styles.tileLevelText}>Lv.{slotLevel}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailKind}>{isPassiveSlot(selectedSlot) ? '被動技能' : '主動技能'}</Text>
          <Text style={styles.detailName}>
            {SKILL_SLOT_NAMES[archetype][selectedSlot]} Lv.{selectedLevel}
            {selectedAtCap ? '(已達本階上限)' : ''}
          </Text>
        </View>
        <Text style={styles.detailDesc}>{SKILL_SLOT_DESCRIPTIONS[archetype][selectedSlot]}</Text>
        <Text style={styles.detailBonus}>{getSkillSlotBonusDescription(archetype, selectedSlot, selectedLevel)}</Text>
        <Text style={styles.detailCap}>目前階級上限:{cap} 級(升階可再提高)</Text>

        <Pressable
          style={[styles.upgradeButton, !canUpgradeSelected && styles.upgradeButtonDisabled]}
          onPress={() => upgradeSkillSlot(archetype, selectedSlot)}
          disabled={!canUpgradeSelected}
        >
          <Text style={styles.upgradeLabel}>
            {selectedAtCap ? '已達上限' : `升級 (${selectedCost} 經驗 / ${selectedCoinCost} 金幣)`}
          </Text>
        </Pressable>
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
    borderColor: '#3a3a45',
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
    fontSize: 9,
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
  detailCap: {
    color: '#6a6a75',
    fontSize: 11,
  },
  upgradeButton: {
    marginTop: 4,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    opacity: 0.4,
  },
  upgradeLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
