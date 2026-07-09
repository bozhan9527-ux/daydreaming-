import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import {
  EquipmentBonusStat,
  EquipmentItem,
  EquipmentSlot,
  getEquipmentBonusTotals,
  getEquippableItemsForSlot,
  getItemById,
  isItemUnlocked,
} from '../game/equipment';
import { getEquipmentSlotIcon, getItemIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
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

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

const STAT_LABELS: Record<EquipmentBonusStat, string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

const SLOTS: EquipmentSlot[] = ['back', 'bottom', 'top', 'belt', 'headwear', 'face', 'gloves', 'offhand', 'mainhand'];

const EMPTY_ICON_COLOR = '#4a4456';

function formatBonus(stat: EquipmentBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

function formatItemStats(item: EquipmentItem): string {
  const lines = [item.name, `主加成:${formatBonus(item.bonus.stat, item.bonus.value)}`];
  if (item.requiredLevel !== undefined) lines.push(`需求等級:Lv${item.requiredLevel}`);
  if (item.archetype !== undefined) lines.push(`限定職業:${ARCHETYPE_LABELS[item.archetype]}`);
  if (item.twoHanded) lines.push('雙手武器,裝備後會清空副手');
  return lines.join('\n');
}

export function EquipmentPanel() {
  const equipment = useGameState((state) => state.equipment);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const equip = useGameState((state) => state.equip);
  const unequip = useGameState((state) => state.unequip);
  const purchaseItem = useGameState((state) => state.purchaseItem);
  const showToast = useToast((state) => state.show);

  const [expandedSlot, setExpandedSlot] = useState<EquipmentSlot | null>(null);

  const totals = getEquipmentBonusTotals(equipment);

  function toggleSlot(slot: EquipmentSlot) {
    setExpandedSlot((current) => (current === slot ? null : slot));
  }

  function pickItem(item: EquipmentItem) {
    showToast(formatItemStats(item));
    if (item.requiredLevel !== undefined && level.level < item.requiredLevel) return;
    if (isItemUnlocked(unlockedItemIds, item.id)) {
      equip(item.id);
    } else {
      purchaseItem(item.id);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>
      {SLOTS.map((slot) => {
        const currentId = equipment[slot];
        const currentItem = currentId !== undefined ? getItemById(currentId) : undefined;
        const isExpanded = expandedSlot === slot;
        const headerIcon = currentItem ? getItemIcon(currentItem) : getEquipmentSlotIcon(slot);
        const headerIconColor = currentItem ? currentItem.color : EMPTY_ICON_COLOR;
        // 職業鎖裝目錄依等級門檻排序,由低到高;不限職業的起始款排在最前面。
        const items = [...getEquippableItemsForSlot(slot, job.archetype)].sort(
          (a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0)
        );

        return (
          <View key={slot}>
            <Pressable style={styles.row} onPress={() => toggleSlot(slot)}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <PixelSprite frame={headerIcon.frame} palette={{ [headerIcon.fillKey]: headerIconColor }} pixelSize={2} />
                </View>
                <Text style={styles.slotLabel}>{SLOT_LABELS[slot]}</Text>
              </View>
              <Text style={styles.itemLabel}>
                {currentItem ? `${currentItem.name} (${formatBonus(currentItem.bonus.stat, currentItem.bonus.value)})` : '空'}
              </Text>
            </Pressable>
            {isExpanded && (
              <View style={styles.itemList}>
                {currentItem && (
                  <Pressable style={styles.itemRow} onPress={() => unequip(slot)}>
                    <Text style={styles.itemRowLabel}>卸下</Text>
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
            )}
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
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
  slotLabel: {
    color: '#8a8a95',
    fontSize: 12,
  },
  itemLabel: {
    color: '#f2f2f2',
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  itemList: {
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 8,
    gap: 3,
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
