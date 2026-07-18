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
import { getEquipmentSlotIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { ItemIcon } from './ItemIcon';
import { PixelSprite } from './PixelSprite';
import { ResourceBar } from './ResourceBar';

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

// 9個部位排成一列橫向選槽,不需要像裝備分頁那樣圍著紙娃娃排兩欄——這裡的重點是
// 「這個部位背包裡還有哪些沒穿的款式」,不是穿戴總覽,選槽只是篩選用的。
const SLOT_ORDER: EquipmentSlot[] = ['mainhand', 'offhand', 'headwear', 'face', 'top', 'gloves', 'belt', 'bottom', 'back'];

const EMPTY_ICON_COLOR = '#4a4456';
// 圖示來源配合勇者本體像素密度提升整張放大了3倍,這裡用 2/3 抵銷回來,維持清單物理尺寸不變。
const ICON_PIXEL_SIZE = 2 / 3;

// 篩選/排序:生成式目錄一個部位最多50個等級檔,練到後期背包同一部位塞了一長串款式,
// 只能一格一格滑動找。'all' 是「不篩選」,其餘對應 item.bonus.stat 三選一——裝備目錄
// 目前沒有稀有度分級,主加成類型是唯一有意義的篩選維度。
type StatFilter = 'all' | EquipmentBonusStat;

const STAT_FILTERS: StatFilter[] = ['all', 'exp', 'coins', 'speed'];

const STAT_FILTER_LABELS: Record<StatFilter, string> = {
  all: '全部',
  exp: '經驗',
  coins: '金幣',
  speed: '速度',
};

function formatBonus(stat: EquipmentBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

export function InventoryPanel() {
  const equipment = useGameState((state) => state.equipment);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const job = useGameState((state) => state.job);
  const equip = useGameState((state) => state.equip);
  const showToast = useToast((state) => state.show);

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');
  const [statFilter, setStatFilter] = useState<StatFilter>('all');
  const [sortDesc, setSortDesc] = useState(false);

  const currentId = equipment[selectedSlot];
  const items = getEquippableItemsForSlot(selectedSlot, job.archetype);
  const bagItems = items
    .filter((item) => isItemUnlocked(unlockedItemIds, item.id))
    .filter((item) => statFilter === 'all' || item.bonus.stat === statFilter)
    .sort((a, b) => (sortDesc ? -1 : 1) * ((a.requiredLevel ?? 0) - (b.requiredLevel ?? 0)));

  function handleEquip(item: EquipmentItem) {
    equip(item.id);
    // 這裡刻意只顯示一行(不像鑑定完成那樣列出隨機/隱藏素質全部細節)——裝備清單本身就在
    // 螢幕上,提示訊息疊在畫面底部太高的話會蓋住清單最底下那幾列的「點擊裝備」按鈕,
    // 玩家連續換裝時反而點不到下一件。
    showToast(`已裝備:${item.name}(${formatBonus(item.bonus.stat, item.bonus.value)})`);
  }

  function renderSlotButton(slot: EquipmentSlot) {
    const slotItemId = equipment[slot];
    const slotItem = slotItemId !== undefined ? getItemById(slotItemId) : undefined;
    const iconColor = slotItem ? slotItem.color : EMPTY_ICON_COLOR;
    const emptySlotIcon = getEquipmentSlotIcon(slot);
    const active = slot === selectedSlot;
    return (
      <Pressable
        key={slot}
        style={[styles.slotButton, active && styles.slotButtonActive]}
        onPress={() => setSelectedSlot(slot)}
      >
        {slotItem ? (
          <ItemIcon item={slotItem} color={iconColor} pixelSize={ICON_PIXEL_SIZE} aiHeight={20} />
        ) : (
          <PixelSprite frame={emptySlotIcon.frame} palette={{ [emptySlotIcon.fillKey]: iconColor }} pixelSize={ICON_PIXEL_SIZE} />
        )}
        <Text style={styles.slotButtonLabel} numberOfLines={1}>
          {SLOT_LABELS[slot]}
        </Text>
      </Pressable>
    );
  }

  function renderBagItemRow(item: EquipmentItem) {
    const equipped = item.id === currentId;
    return (
      <Pressable
        key={item.id}
        style={[styles.itemRow, equipped && styles.itemRowEquipped]}
        onPress={() => !equipped && handleEquip(item)}
      >
        <View style={styles.rowLeft}>
          <View style={styles.iconWrap}>
            <ItemIcon item={item} color={item.color} pixelSize={ICON_PIXEL_SIZE} aiHeight={20} />
          </View>
          <Text style={styles.itemRowLabel}>
            {item.name} ({formatBonus(item.bonus.stat, item.bonus.value)})
          </Text>
        </View>
        <Text style={[styles.itemRowMeta, equipped && styles.itemRowMetaEquipped]}>
          {equipped ? '已裝備' : '點擊裝備'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* 強化石/寶石數量原本常駐主畫面,現在收進背包分頁——反正這些「彈藥」本來就是要
          在背包/裝備相關畫面查看的資訊,不需要佔用主畫面的高度。 */}
      <ResourceBar />
      <View style={styles.slotRow}>{SLOT_ORDER.map(renderSlotButton)}</View>
      <Text style={styles.hint}>目前選擇:{SLOT_LABELS[selectedSlot]}</Text>
      {/* 篩選/排序列:練到後期同一部位背包塞了一長串款式,篩主加成類型+切換需求等級排序方向,
          不用一格一格滑動找。 */}
      <View style={styles.filterRow}>
        {STAT_FILTERS.map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterChip, statFilter === filter && styles.filterChipActive]}
            onPress={() => setStatFilter(filter)}
          >
            <Text style={styles.filterChipLabel}>{STAT_FILTER_LABELS[filter]}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.sortButton} onPress={() => setSortDesc((prev) => !prev)}>
          <Text style={styles.filterChipLabel}>需求等級 {sortDesc ? '高→低' : '低→高'}</Text>
        </Pressable>
      </View>
      <View style={styles.itemList}>
        {bagItems.length === 0 ? (
          <Text style={styles.emptyText}>
            {statFilter === 'all' ? '背包裡沒有這個部位的其他款式,去「裝備」分頁的商店逛逛' : '這個篩選條件下沒有符合的款式'}
          </Text>
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
    width: 48,
    paddingVertical: 4,
    gap: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonLabel: {
    color: '#8a8a95',
    fontSize: 8,
    textAlign: 'center',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  filterChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  filterChipActive: {
    backgroundColor: '#4a4456',
    borderColor: '#6ab0e0',
  },
  filterChipLabel: {
    color: '#c8c8d0',
    fontSize: 9,
  },
  sortButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
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
  itemRowEquipped: {
    backgroundColor: '#243424',
    borderWidth: 1,
    borderColor: '#5fa563',
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
  itemRowMetaEquipped: {
    color: '#8fd992',
    fontWeight: '600',
  },
});
