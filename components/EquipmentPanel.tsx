import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Archetype } from '../game/combat';
import {
  EquipmentBonusStat,
  EquipmentItem,
  EquipmentSlot,
  getEnhancedBonusValue,
  getEquipmentBonusTotalsFull,
  getEquippableItemsForSlot,
  getIdentifyCost,
  getItemById,
  getSubstatTotals,
  isItemUnlocked,
  ItemInstanceData,
  SubstatType,
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

// 角色紙娃娃兩側各一欄圖示按鈕:武器(主手/副手)對放最上排,其餘裝備往下排。
const LEFT_COLUMN: EquipmentSlot[] = ['offhand', 'headwear', 'top', 'belt', 'bottom'];
const RIGHT_COLUMN: EquipmentSlot[] = ['mainhand', 'face', 'back', 'gloves'];

const EMPTY_ICON_COLOR = '#4a4456';

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

export function EquipmentPanel() {
  const bodyType = useGameState((state) => state.bodyType);
  const equipment = useGameState((state) => state.equipment);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const itemInstances = useGameState((state) => state.itemInstances);
  const coins = useGameState((state) => state.coins);
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const equip = useGameState((state) => state.equip);
  const unequip = useGameState((state) => state.unequip);
  const purchaseItem = useGameState((state) => state.purchaseItem);
  const identifyItem = useGameState((state) => state.identifyItem);
  const showToast = useToast((state) => state.show);

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');

  const totals = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const substatTotals = getSubstatTotals(equipment, itemInstances);

  const currentId = equipment[selectedSlot];
  const currentItem = currentId !== undefined ? getItemById(currentId) : undefined;
  const items = [...getEquippableItemsForSlot(selectedSlot, job.archetype)].sort(
    (a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0)
  );

  function pickItem(item: EquipmentItem) {
    // equip()/purchaseItem() 是第一次擁有這件裝備時擲隨機/隱藏素質的地方(同步 set),
    // 所以要先執行動作、再用 getState() 讀最新的 itemInstances,toast 才看得到剛擲出來的素質,
    // 不能用 render 當下就已經捕捉住的 itemInstances(對第一次購買來說會是還沒擲過的舊值)。
    const locked = item.requiredLevel !== undefined && level.level < item.requiredLevel;
    if (!locked) {
      if (isItemUnlocked(unlockedItemIds, item.id)) {
        equip(item.id);
      } else {
        purchaseItem(item.id);
      }
    }
    showToast(formatItemStats(item, useGameState.getState().itemInstances[item.id]));
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
        style={[styles.slotButton, slotItem && styles.slotButtonFilled, active && styles.slotButtonActive]}
        onPress={() => setSelectedSlot(slot)}
      >
        <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: iconColor }} pixelSize={2} />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.paperdollRow}>
        <View style={styles.slotColumn}>{LEFT_COLUMN.map(renderSlotButton)}</View>
        <View style={styles.heroWrap}>
          <HeroSprite bodyType={bodyType} equipment={equipment} pixelSize={6} />
        </View>
        <View style={styles.slotColumn}>{RIGHT_COLUMN.map(renderSlotButton)}</View>
      </View>
      <Text style={styles.hint}>目前選擇:{SLOT_LABELS[selectedSlot]}</Text>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>
      <Text style={styles.totalsText}>
        素質總和:{formatSubstat('critRate', substatTotals.critRate)} / {formatSubstat('resistance', substatTotals.resistance)}
      </Text>
      <View style={styles.itemList}>
        {currentItem && (
          <Pressable style={styles.itemRow} onPress={() => unequip(selectedSlot)}>
            <Text style={styles.itemRowLabel}>
              卸下 {currentItem.name} ({formatBonus(currentItem.bonus.stat, getEnhancedBonusValue(currentItem, itemInstances[currentItem.id]))})
            </Text>
          </Pressable>
        )}
        {items.map((item) => {
          const locked = item.requiredLevel !== undefined && level.level < item.requiredLevel;
          const unlocked = isItemUnlocked(unlockedItemIds, item.id);
          const isEquipped = currentId === item.id;
          const icon = getItemIcon(item);
          const instance = itemInstances[item.id];
          const canIdentify = instance !== undefined && !instance.identified;
          return (
            <View key={item.id}>
              <Pressable
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
              {canIdentify && (
                <Pressable style={styles.identifyRow} onPress={() => handleIdentify(item)}>
                  <Text style={styles.identifyLabel}>🔍 鑑定隱藏素質({getIdentifyCost(item)} 金幣)</Text>
                </Pressable>
              )}
            </View>
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
    gap: 4,
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
    marginBottom: 2,
  },
  totalsText: {
    color: '#c9a94f',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
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
