import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EquipmentItem,
  EquipmentSlot,
  getEquippableItemsForSlot,
  getIdentifyCost,
  getRerollCost,
  isItemUnlocked,
  SLOT_Z_ORDER,
} from '../game/equipment';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { formatItemStats } from './itemFormatting';
import { ItemIcon } from './ItemIcon';
import { ItemPreviewModal } from './ItemPreviewModal';

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

// 8欄密集網格用的圖示尺寸——瀏覽格數多,縮小到能一行塞8格。
const DENSE_ICON_PIXEL_SIZE = 0.4;
const DENSE_AI_HEIGHT = 22;

// 部位篩選,比裝備部位多一個「全部」——紙娃娃(角色預覽+穿戴總覽)搬到「狀態」分頁後
// (見 CharacterStatusPanel.tsx),這裡不再需要靠點紙娃娃插槽選部位,改成頂部的部位分頁列
// 直接切換,「已擁有」「商店」兩個子檢視共用同一組部位篩選。
type SlotFilter = 'all' | EquipmentSlot;
const SLOT_FILTERS: SlotFilter[] = ['all', ...SLOT_Z_ORDER];
const SLOT_FILTER_LABELS: Record<SlotFilter, string> = {
  all: '全部',
  ...SLOT_LABELS,
};

type SubView = 'owned' | 'shop';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'owned', label: '已擁有' },
  { id: 'shop', label: '商店' },
];

// 「裝備」分頁:已擁有款式瀏覽(owned)+商店(shop)兩個子檢視,共用同一組部位篩選列,
// 8欄密集網格。紙娃娃(角色預覽+穿戴總覽)搬到「狀態」分頁(CharacterStatusPanel.tsx)
// 取代那裡原本的「已裝備物品」格子,不在這裡重複顯示;原本的「穿戴」子檢視也一併拿掉——
// 「已擁有」清單裡點開已裝備的那件,預覽卡片一樣有卸下/鑑定/重擲功能,不需要另開一頁。
export function EquipmentPanel() {
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
  const rerollEquipmentSubstats = useGameState((state) => state.rerollEquipmentSubstats);
  const showToast = useToast((state) => state.show);

  const [subView, setSubView] = useState<SubView>('owned');
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');
  // 點清單裡的道具先跳出預覽卡片(見 ItemPreviewModal.tsx)顯示完整屬性,玩家自己按按鈕
  // 才會真的改動裝備狀態,不是點下去就直接買/裝上去。
  const [previewItem, setPreviewItem] = useState<EquipmentItem | null>(null);

  const filterSlots = slotFilter === 'all' ? SLOT_Z_ORDER : [slotFilter];
  const candidateItems = filterSlots
    .flatMap((slot) => getEquippableItemsForSlot(slot, job.archetype, job.branch))
    .sort((a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0));

  const ownedItems = candidateItems.filter((item) => isItemUnlocked(unlockedItemIds, item.id));
  const shopItems = candidateItems.filter((item) => !isItemUnlocked(unlockedItemIds, item.id));
  // 商店分頁標籤上的數字是「全部部位總共還有幾款沒收集」,不受部位/加成篩選影響,
  // 篩選只影響下面實際渲染的清單。
  const totalShopCount = SLOT_Z_ORDER.flatMap((slot) => getEquippableItemsForSlot(slot, job.archetype, job.branch)).filter(
    (item) => !isItemUnlocked(unlockedItemIds, item.id)
  ).length;

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

  function handleReroll(item: EquipmentItem) {
    const cost = getRerollCost(item);
    if (coins < cost) {
      showToast(`金幣不夠重擲 ${item.name}(需要 ${cost} 金幣)`);
      return;
    }
    rerollEquipmentSubstats(item.id);
    showToast(`重擲完成:${item.name}\n${formatItemStats(item, useGameState.getState().itemInstances[item.id])}`);
  }

  // 8欄密集網格格子:已擁有清單裡目前裝備的那件加一圈亮框標示,商店清單裡等級不夠的鎖住。
  function renderItemTile(item: EquipmentItem, opts: { equipped?: boolean; locked?: boolean }) {
    return (
      <Pressable
        key={item.id}
        style={[styles.tile, opts.equipped && styles.tileEquipped, opts.locked && styles.tileLocked]}
        onPress={() => setPreviewItem(item)}
        disabled={opts.locked}
      >
        <ItemIcon item={item} color={item.color} pixelSize={DENSE_ICON_PIXEL_SIZE} aiHeight={DENSE_AI_HEIGHT} />
        {opts.locked && <Text style={styles.tileLockLabel}>Lv{item.requiredLevel}</Text>}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.subNav}>
        {SUB_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.subNavButton, subView === view.id && styles.subNavButtonActive]}
            onPress={() => setSubView(view.id)}
          >
            <Text style={styles.subNavLabel}>
              {view.label}
              {view.id === 'shop' ? `(${totalShopCount})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 部位篩選:固定寬度5欄網格,不受各部位標籤文字長短影響,10個選項(全部+9部位)
          剛好排成整齊的2排。 */}
      <View style={styles.slotFilterGrid}>
        {SLOT_FILTERS.map((filter) => (
          <Pressable
            key={filter}
            style={[styles.slotFilterChip, slotFilter === filter && styles.filterChipActive]}
            onPress={() => setSlotFilter(filter)}
          >
            <Text style={styles.filterChipLabel} numberOfLines={1}>
              {SLOT_FILTER_LABELS[filter]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {subView === 'owned' &&
          (ownedItems.length === 0 ? (
            <Text style={styles.emptyText}>還沒有擁有符合這個篩選條件的款式</Text>
          ) : (
            ownedItems.map((item) => renderItemTile(item, { equipped: equipment[item.slot] === item.id }))
          ))}
        {subView === 'shop' &&
          (shopItems.length === 0 ? (
            <Text style={styles.emptyText}>{slotFilter === 'all' ? '款式都收集齊了' : '這個部位沒有符合的款式'}</Text>
          ) : (
            shopItems.map((item) =>
              renderItemTile(item, { locked: item.requiredLevel !== undefined && level.level < item.requiredLevel })
            )
          ))}
      </View>

      {previewItem && (
        <ItemPreviewModal
          item={previewItem}
          instance={itemInstances[previewItem.id]}
          coins={coins}
          isEquipped={equipment[previewItem.slot] === previewItem.id}
          owned={isItemUnlocked(unlockedItemIds, previewItem.id)}
          onClose={() => setPreviewItem(null)}
          onEquipOrBuy={() => {
            pickItem(previewItem);
            setPreviewItem(null);
          }}
          onUnequip={() => {
            unequip(previewItem.slot);
            setPreviewItem(null);
          }}
          onIdentify={() => handleIdentify(previewItem)}
          onReroll={() => handleReroll(previewItem)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 4,
  },
  subNav: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  subNavButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  subNavButtonActive: {
    backgroundColor: '#4a4456',
  },
  subNavLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  // 固定寬度5欄網格:10個選項(全部+9部位)不管文字長短都排成整齊的2排,
  // 不會像 flex-wrap 那樣依文字寬度自然換行、行末參差不齊。
  slotFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  slotFilterChip: {
    width: 52,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#4a4456',
    borderColor: '#6ab0e0',
  },
  filterChipLabel: {
    color: '#c8c8d0',
    fontSize: 11,
  },
  emptyText: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  // 8欄密集網格:280寬容器扣掉間距後,每格約30px才塞得下8欄——比照參考圖的密集多欄排列,
  // 顏色維持既有深色莫蘭迪調性,不套用參考圖的米色亮色主題。
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
  },
  tile: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEquipped: {
    borderColor: '#5fa563',
    backgroundColor: '#243424',
  },
  tileLocked: {
    opacity: 0.45,
  },
  tileLockLabel: {
    position: 'absolute',
    bottom: 1,
    color: '#8a8a95',
    fontSize: 7,
  },
});
