import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import {
  EquipmentBonusStat,
  EquipmentItem,
  EquipmentSlot,
  getEquippableItemsForSlot,
  getIdentifyCost,
  getItemById,
  isItemUnlocked,
  ItemInstanceData,
  SubstatType,
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

const SUBSTAT_LABELS: Record<SubstatType, string> = {
  critRate: '爆擊率',
  resistance: '抗性',
};

// 9個部位排成一列橫向選槽,不需要像裝備分頁那樣圍著紙娃娃排兩欄——這裡的重點是
// 「這個部位背包裡還有哪些沒穿的款式」,不是穿戴總覽,選槽只是篩選用的。
const SLOT_ORDER: EquipmentSlot[] = ['mainhand', 'offhand', 'headwear', 'face', 'top', 'gloves', 'belt', 'bottom', 'back'];

const EMPTY_ICON_COLOR = '#4a4456';
// 圖示來源配合勇者本體像素密度提升整張放大了3倍,這裡用 2/3 抵銷回來,維持清單物理尺寸不變。
const ICON_PIXEL_SIZE = 2 / 3;

function formatBonus(stat: EquipmentBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

function formatSubstat(stat: SubstatType, value: number): string {
  return `${SUBSTAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

function formatItemStats(item: EquipmentItem, instance: ItemInstanceData | undefined): string {
  const lines = [item.name, `主加成:${formatBonus(item.bonus.stat, item.bonus.value)}`];
  if (instance) {
    lines.push(`隨機素質:${formatSubstat(instance.randomSubstat.type, instance.randomSubstat.value)}`);
    lines.push(
      instance.identified
        ? `隱藏素質:${formatSubstat(instance.hiddenSubstat.type, instance.hiddenSubstat.value)}`
        : `隱藏素質:未鑑定(花 ${getIdentifyCost(item)} 金幣鑑定)`
    );
  }
  if (item.requiredLevel !== undefined) lines.push(`需求等級:Lv${item.requiredLevel}`);
  if (item.archetype !== undefined) lines.push(`限定職業:${ARCHETYPE_LABELS[item.archetype]}`);
  if (item.twoHanded) lines.push('雙手武器,裝備後會清空副手');
  return lines.join('\n');
}

export function InventoryPanel() {
  const equipment = useGameState((state) => state.equipment);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const itemInstances = useGameState((state) => state.itemInstances);
  const coins = useGameState((state) => state.coins);
  const job = useGameState((state) => state.job);
  const equip = useGameState((state) => state.equip);
  const identifyItem = useGameState((state) => state.identifyItem);
  const showToast = useToast((state) => state.show);

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');

  const currentId = equipment[selectedSlot];
  const items = getEquippableItemsForSlot(selectedSlot, job.archetype);
  const bagItems = items.filter((item) => isItemUnlocked(unlockedItemIds, item.id) && item.id !== currentId);

  function handleEquip(item: EquipmentItem) {
    equip(item.id);
    showToast(`裝備:${formatItemStats(item, useGameState.getState().itemInstances[item.id])}`);
  }

  function handleIdentify(item: EquipmentItem) {
    const cost = getIdentifyCost(item);
    if (coins < cost) {
      showToast(`金幣不夠鑑定 ${item.name}(需要 ${cost} 金幣)`);
      return;
    }
    identifyItem(item.id);
    showToast(`鑑定完成:${item.name}\n${formatItemStats(item, useGameState.getState().itemInstances[item.id])}`);
  }

  function renderSlotButton(slot: EquipmentSlot) {
    const slotItemId = equipment[slot];
    const slotItem = slotItemId !== undefined ? getItemById(slotItemId) : undefined;
    const icon = slotItem ? getItemIcon(slotItem) : getEquipmentSlotIcon(slot);
    const iconColor = slotItem ? slotItem.color : EMPTY_ICON_COLOR;
    const active = slot === selectedSlot;
    return (
      <Pressable
        key={slot}
        style={[styles.slotButton, active && styles.slotButtonActive]}
        onPress={() => setSelectedSlot(slot)}
      >
        <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: iconColor }} pixelSize={ICON_PIXEL_SIZE} />
      </Pressable>
    );
  }

  function renderBagItemRow(item: EquipmentItem) {
    const icon = getItemIcon(item);
    const instance = itemInstances[item.id];
    const canIdentify = instance !== undefined && !instance.identified;
    return (
      <View key={item.id}>
        <Pressable style={styles.itemRow} onPress={() => handleEquip(item)}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}>
              <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: item.color }} pixelSize={ICON_PIXEL_SIZE} />
            </View>
            <Text style={styles.itemRowLabel}>
              {item.name} ({formatBonus(item.bonus.stat, item.bonus.value)})
            </Text>
          </View>
          <Text style={styles.itemRowMeta}>點擊裝備</Text>
        </Pressable>
        {canIdentify && (
          <Pressable style={styles.identifyRow} onPress={() => handleIdentify(item)}>
            <Text style={styles.identifyLabel}>🔍 鑑定隱藏素質({getIdentifyCost(item)} 金幣)</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.slotRow}>{SLOT_ORDER.map(renderSlotButton)}</View>
      <Text style={styles.hint}>目前選擇:{SLOT_LABELS[selectedSlot]}</Text>
      <View style={styles.itemList}>
        {bagItems.length === 0 ? (
          <Text style={styles.emptyText}>背包裡沒有這個部位的其他款式,去「裝備」分頁的商店逛逛</Text>
        ) : (
          bagItems.map(renderBagItemRow)
        )}
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
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
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
  slotButtonActive: {
    backgroundColor: '#4a4456',
    borderColor: '#6ab0e0',
  },
  hint: {
    color: '#8a8a95',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  itemList: {
    gap: 3,
  },
  emptyText: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
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
  itemRowLabel: {
    color: '#f2f2f2',
    fontSize: 11,
    flexShrink: 1,
  },
  itemRowMeta: {
    color: '#8a8a95',
    fontSize: 11,
  },
  identifyRow: {
    marginTop: 2,
    marginBottom: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2432',
  },
  identifyLabel: {
    color: '#c9a94f',
    fontSize: 10,
  },
});
