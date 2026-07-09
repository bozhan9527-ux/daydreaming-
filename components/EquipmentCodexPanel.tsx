import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EquipmentBonusStat,
  EquipmentItem,
  EquipmentSlot,
  getEquippableItemsForSlot,
  getItemById,
  isItemUnlocked,
} from '../game/equipment';
import { getEquipmentSlotIcon, getItemIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { HeroSprite } from './HeroSprite';
import { PixelSprite } from './PixelSprite';

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

// 角色紙娃娃兩側各一欄圖示按鈕(參考玩家提供的截圖:武器對放最上面,其餘裝備往下排),
// 不再用下方一排可橫向捲動的槽位標籤。
const LEFT_COLUMN: EquipmentSlot[] = ['offhand', 'headwear', 'top', 'belt', 'bottom'];
const RIGHT_COLUMN: EquipmentSlot[] = ['mainhand', 'face', 'back', 'gloves'];

const EMPTY_ICON_COLOR = '#4a4456';

function formatBonus(stat: EquipmentBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

export function EquipmentCodexPanel() {
  const bodyType = useGameState((state) => state.bodyType);
  const equipment = useGameState((state) => state.equipment);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const equip = useGameState((state) => state.equip);
  const unequip = useGameState((state) => state.unequip);
  const purchaseItem = useGameState((state) => state.purchaseItem);
  const showToast = useToast((state) => state.show);

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');

  const archetype = job.archetype;
  const currentId = equipment[selectedSlot];
  const currentItem = currentId !== undefined ? getItemById(currentId) : undefined;
  const items = [...getEquippableItemsForSlot(selectedSlot, archetype)].sort(
    (a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0)
  );

  function pickItem(item: EquipmentItem) {
    const locked = item.requiredLevel !== undefined && level.level < item.requiredLevel;
    if (locked) return;
    if (isItemUnlocked(unlockedItemIds, item.id)) {
      equip(item.id);
      showToast(`已裝備:${item.name}`);
    } else {
      purchaseItem(item.id);
      showToast(`已購入並裝備:${item.name}`);
    }
  }

  function renderSlotButton(slot: EquipmentSlot) {
    const equipped = equipment[slot];
    const equippedItem = equipped !== undefined ? getItemById(equipped) : undefined;
    const icon = equippedItem ? getItemIcon(equippedItem) : getEquipmentSlotIcon(slot);
    const iconColor = equippedItem ? equippedItem.color : EMPTY_ICON_COLOR;
    const active = slot === selectedSlot;
    return (
      <Pressable
        key={slot}
        style={[styles.slotButton, equippedItem && styles.slotButtonFilled, active && styles.slotButtonActive]}
        onPress={() => setSelectedSlot(slot)}
      >
        <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: iconColor }} pixelSize={2} />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>裝備圖鑑</Text>
      <View style={styles.paperdollRow}>
        <View style={styles.slotColumn}>{LEFT_COLUMN.map(renderSlotButton)}</View>
        <View style={styles.heroWrap}>
          <HeroSprite bodyType={bodyType} equipment={equipment} pixelSize={6} />
        </View>
        <View style={styles.slotColumn}>{RIGHT_COLUMN.map(renderSlotButton)}</View>
      </View>
      <Text style={styles.hint}>目前選擇:{SLOT_LABELS[selectedSlot]}</Text>
      <View style={styles.itemList}>
        {currentItem && (
          <Pressable style={styles.itemRow} onPress={() => unequip(selectedSlot)}>
            <Text style={styles.itemRowLabel}>卸下 {currentItem.name}</Text>
          </Pressable>
        )}
        {items.map((item) => {
          const locked = item.requiredLevel !== undefined && level.level < item.requiredLevel;
          const unlocked = isItemUnlocked(unlockedItemIds, item.id);
          const isEquipped = currentId === item.id;
          const icon = getItemIcon(item);
          return (
            <Pressable
              key={item.id}
              style={[styles.itemRow, isEquipped && styles.itemRowActive, locked && styles.itemRowLocked]}
              onPress={() => pickItem(item)}
              disabled={locked}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: item.color }} pixelSize={2} />
                </View>
                <Text style={[styles.itemRowLabel, locked && styles.itemRowLabelLocked]}>
                  {item.name} ({formatBonus(item.bonus.stat, item.bonus.value)})
                </Text>
              </View>
              <Text style={styles.itemRowMeta}>
                {locked ? `Lv${item.requiredLevel} 解鎖` : unlocked ? (isEquipped ? '裝備中' : '點擊裝備') : `${item.price} 金幣`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 6,
  },
  title: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  paperdollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotColumn: {
    gap: 6,
  },
  slotButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3a45',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonFilled: {
    borderColor: '#6ab0e0',
  },
  slotButtonActive: {
    backgroundColor: '#4a4456',
  },
  hint: {
    color: '#8a8a95',
    fontSize: 10,
    textAlign: 'center',
  },
  itemList: {
    gap: 3,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
  },
  itemRowActive: {
    backgroundColor: '#4a4456',
  },
  itemRowLocked: {
    opacity: 0.45,
  },
  itemRowLabel: {
    color: '#f2f2f2',
    fontSize: 11,
    flexShrink: 1,
  },
  itemRowLabelLocked: {
    color: '#8a8a95',
  },
  itemRowMeta: {
    color: '#8a8a95',
    fontSize: 11,
  },
});
