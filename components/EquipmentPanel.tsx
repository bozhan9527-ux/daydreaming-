import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EquipmentBonusStat,
  EquipmentSlot,
  getEquipmentBonusTotals,
  getItemById,
  getItemsForSlot,
  isItemUnlocked,
} from '../game/equipment';
import { useGameState } from '../hooks/useGameState';

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  back: '背飾',
  bottom: '下身',
  top: '上身',
  belt: '腰帶',
  headwear: '頭飾',
  face: '面飾',
  gloves: '手套',
  offhand: '副手',
  mainhand: '主手武器',
};

const STAT_LABELS: Record<EquipmentBonusStat, string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

const SLOTS: EquipmentSlot[] = ['back', 'bottom', 'top', 'belt', 'headwear', 'face', 'gloves', 'offhand', 'mainhand'];

function formatBonus(stat: EquipmentBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

export function EquipmentPanel() {
  const equipment = useGameState((state) => state.equipment);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const unequip = useGameState((state) => state.unequip);
  const purchaseItem = useGameState((state) => state.purchaseItem);

  function cycle(slot: EquipmentSlot) {
    const items = getItemsForSlot(slot);
    const currentId = equipment[slot];
    const currentIndex = items.findIndex((item) => item.id === currentId);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      unequip(slot);
    } else {
      purchaseItem(items[nextIndex].id);
    }
  }

  const totals = getEquipmentBonusTotals(equipment);

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>
      {SLOTS.map((slot) => {
        const currentId = equipment[slot];
        const currentItem = currentId !== undefined ? getItemById(currentId) : undefined;
        const items = getItemsForSlot(slot);
        const currentIndex = items.findIndex((item) => item.id === currentId);
        const nextItem = items[currentIndex + 1];
        const nextLocked = nextItem !== undefined && !isItemUnlocked(unlockedItemIds, nextItem.id);
        return (
          <Pressable key={slot} style={styles.row} onPress={() => cycle(slot)}>
            <Text style={styles.slotLabel}>{SLOT_LABELS[slot]}</Text>
            <Text style={styles.itemLabel}>
              {currentItem ? `${currentItem.name} (${formatBonus(currentItem.bonus.stat, currentItem.bonus.value)})` : '空'}
              {nextLocked ? `(下一項 ${nextItem.price} 金幣)` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 4,
  },
  totalsText: {
    color: '#c9a94f',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  slotLabel: {
    color: '#8a8a95',
    fontSize: 12,
  },
  itemLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
