import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EquipmentSlot, getItemById, getItemsForSlot } from '../game/equipment';
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

const SLOTS: EquipmentSlot[] = ['back', 'bottom', 'top', 'belt', 'headwear', 'face', 'gloves', 'offhand', 'mainhand'];

export function EquipmentPanel() {
  const equipment = useGameState((state) => state.equipment);
  const equip = useGameState((state) => state.equip);
  const unequip = useGameState((state) => state.unequip);

  function cycle(slot: EquipmentSlot) {
    const items = getItemsForSlot(slot);
    const currentId = equipment[slot];
    const currentIndex = items.findIndex((item) => item.id === currentId);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      unequip(slot);
    } else {
      equip(items[nextIndex].id);
    }
  }

  return (
    <View style={styles.container}>
      {SLOTS.map((slot) => {
        const currentId = equipment[slot];
        const currentItem = currentId !== undefined ? getItemById(currentId) : undefined;
        return (
          <Pressable key={slot} style={styles.row} onPress={() => cycle(slot)}>
            <Text style={styles.slotLabel}>{SLOT_LABELS[slot]}</Text>
            <Text style={styles.itemLabel}>{currentItem ? currentItem.name : '空'}</Text>
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
