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
import { EnhancementPanel } from './EnhancementPanel';
import { HeroSprite } from './HeroSprite';
import { PixelSprite } from './PixelSprite';
import { SocketPanel } from './SocketPanel';

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
  physicalResistance: '物理抗性',
  magicResistance: '魔法抗性',
  physicalCritRate: '物理爆擊率',
  physicalCritDamage: '物理爆擊傷害',
  magicCritRate: '魔法爆擊率',
  magicCritDamage: '魔法爆擊傷害',
  physicalAttack: '物理攻擊力',
  magicAttack: '魔法攻擊力',
  lifesteal: '吸血',
  hpRegen: '自動回血',
};

// 角色紙娃娃兩側各一欄圖示按鈕:武器(主手/副手)對放最上排,其餘裝備往下排。
const LEFT_COLUMN: EquipmentSlot[] = ['offhand', 'headwear', 'top', 'belt', 'bottom'];
const RIGHT_COLUMN: EquipmentSlot[] = ['mainhand', 'face', 'back', 'gloves'];

const EMPTY_ICON_COLOR = '#4a4456';
// 圖示來源(equipmentIcons.ts/weapons.ts)配合勇者本體密度提升,整張放大了3倍,
// 這裡用 2/3 抵銷回來,維持清單/選槽按鈕原本的物理尺寸不變。
const ICON_PIXEL_SIZE = 2 / 3;

// 背包已經拆成獨立頂層分頁(見 components/InventoryPanel.tsx),這裡改收納強化跟鑲嵌
// 兩個原本各自獨立的分頁——都是圍繞「身上穿的這件裝備」在操作,收在裝備分頁底下比較好找。
type SubView = 'worn' | 'enhance' | 'socket' | 'shop';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'worn', label: '穿戴' },
  { id: 'enhance', label: '強化' },
  { id: 'socket', label: '鑲嵌' },
  { id: 'shop', label: '商店' },
];

// 篩選:生成式目錄一個部位最多50個等級檔,商店清單(還沒買的款式)常常一次塞滿一長串——
// 跟 InventoryPanel.tsx 背包分頁同一套篩選維度(主加成類型),排序沿用既有的依需求等級規則
// (見下面 items 的 .sort),不重複加一顆排序切換鈕。
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

function formatSubstat(stat: SubstatType, value: number): string {
  return `${SUBSTAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

// 素質格數值為0(+0%)時用暗色淡化,取代跟旁邊真正有投資的欄位一樣的視覺權重——這個格子
// 集中了8+2個素質,新玩家/沒點的方向常年停在+0%,不淡化的話很難一眼看出「哪些欄位真的有加成」。
function SubstatCell({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <View style={styles.substatCell}>
      <Text style={styles.substatCellLabel}>{label}</Text>
      <Text style={[styles.substatCellValue, pct === 0 && styles.substatCellValueZero]}>+{pct}%</Text>
    </View>
  );
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
  const showToast = useToast((state) => state.show);

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');
  const [subView, setSubView] = useState<SubView>('worn');
  const [shopStatFilter, setShopStatFilter] = useState<StatFilter>('all');

  const totals = getEquipmentBonusTotalsFull(equipment, itemInstances);
  const substatTotals = getSubstatTotals(equipment, itemInstances);

  const currentId = equipment[selectedSlot];
  const currentItem = currentId !== undefined ? getItemById(currentId) : undefined;
  const items = [...getEquippableItemsForSlot(selectedSlot, job.archetype)].sort(
    (a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0)
  );
  // 商店:還沒擁有(不管有沒有等級鎖)的款式;已擁有但沒穿的背包款式改到獨立的
  // 「背包」分頁(components/InventoryPanel.tsx)去挑,「穿戴」畫面只顯示目前穿著的那一件。
  // shopItems 維持「全部未擁有款式」不受篩選影響,子分頁按鈕上的數字才是「這個部位總共還有
  // 幾款沒收集」;篩選只影響下面實際渲染的清單(filteredShopItems)。
  const shopItems = items.filter((item) => !isItemUnlocked(unlockedItemIds, item.id));
  const filteredShopItems = shopItems.filter(
    (item) => shopStatFilter === 'all' || item.bonus.stat === shopStatFilter
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
        <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: iconColor }} pixelSize={ICON_PIXEL_SIZE} />
        <Text style={styles.slotButtonLabel} numberOfLines={1}>
          {SLOT_LABELS[slot]}
        </Text>
      </Pressable>
    );
  }

  // 背包分頁拆出去之後,這裡只剩「商店」會用到這個 row 渲染,不用再分 bag/shop 兩種模式
  // (背包款式的鑑定/點擊裝備邏輯搬到 components/InventoryPanel.tsx 去了)。
  function renderShopItemRow(item: EquipmentItem) {
    const locked = item.requiredLevel !== undefined && level.level < item.requiredLevel;
    const icon = getItemIcon(item);
    return (
      <Pressable key={item.id} style={[styles.itemRow, locked && styles.itemRowLocked]} onPress={() => pickItem(item)} disabled={locked}>
        <View style={styles.rowLeft}>
          <View style={styles.iconWrap}>
            <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: item.color }} pixelSize={ICON_PIXEL_SIZE} />
          </View>
          <Text style={[styles.itemRowLabel, locked && styles.itemRowLabelLocked]}>
            {item.name} ({formatBonus(item.bonus.stat, item.bonus.value)})
          </Text>
        </View>
        <Text style={styles.itemRowMeta}>{locked ? `Lv${item.requiredLevel} 解鎖` : `${item.price} 金幣`}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.paperdollRow}>
        <View style={styles.slotColumn}>{LEFT_COLUMN.map(renderSlotButton)}</View>
        <View style={styles.heroWrap}>
          <HeroSprite bodyType={bodyType} equipment={equipment} pixelSize={2.5} />
        </View>
        <View style={styles.slotColumn}>{RIGHT_COLUMN.map(renderSlotButton)}</View>
      </View>
      <Text style={styles.hint}>目前選擇:{SLOT_LABELS[selectedSlot]}</Text>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>
      {/* 素質總和改成格子,取代原本一整行斜線分隔的長文字——物理/魔法各自4種素質+通用2種
          已經累積到密到要換行才塞得下,格子讓每個數字獨立佔一塊,掃視速度比逐字讀完一整行快。 */}
      <View style={styles.substatGrid}>
        <View style={styles.substatRow}>
          <Text style={styles.substatRowLabel}>物理</Text>
          <SubstatCell label="攻擊" value={substatTotals.physicalAttack} />
          <SubstatCell label="抗性" value={substatTotals.physicalResistance} />
          <SubstatCell label="爆率" value={substatTotals.physicalCritRate} />
          <SubstatCell label="爆傷" value={substatTotals.physicalCritDamage} />
        </View>
        <View style={styles.substatRow}>
          <Text style={styles.substatRowLabel}>魔法</Text>
          <SubstatCell label="攻擊" value={substatTotals.magicAttack} />
          <SubstatCell label="抗性" value={substatTotals.magicResistance} />
          <SubstatCell label="爆率" value={substatTotals.magicCritRate} />
          <SubstatCell label="爆傷" value={substatTotals.magicCritDamage} />
        </View>
        {/* 吸血/自動回血是通用素質(不分物理/魔法),只用一行、兩格,格子寬度自然比上面寬一倍。 */}
        <View style={styles.substatRow}>
          <Text style={styles.substatRowLabel}>通用</Text>
          <SubstatCell label="吸血" value={substatTotals.lifesteal} />
          <SubstatCell label="回血" value={substatTotals.hpRegen} />
        </View>
      </View>

      <View style={styles.subNav}>
        {SUB_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.subNavButton, subView === view.id && styles.subNavButtonActive]}
            onPress={() => setSubView(view.id)}
          >
            <Text style={styles.subNavLabel}>
              {view.label}
              {view.id === 'shop' ? `(${shopItems.length})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {subView === 'worn' && (
        <View style={styles.wornCard}>
          {currentItem ? (
            <>
              <Text style={styles.wornItemName}>{currentItem.name}</Text>
              <Text style={styles.wornItemBonus}>
                {formatBonus(currentItem.bonus.stat, getEnhancedBonusValue(currentItem, itemInstances[currentItem.id]))}
              </Text>
              <Pressable style={styles.unequipButton} onPress={() => unequip(selectedSlot)}>
                <Text style={styles.unequipLabel}>卸下</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.wornEmptyText}>這個部位還沒有裝備,去「背包」或「商店」挑一件</Text>
          )}
        </View>
      )}

      {/* 強化/鑲嵌本來就是各自獨立看「身上所有已裝備」的清單,不是照 selectedSlot 篩選,
          搬進來當子分頁之後行為不變,直接沿用原本的元件。 */}
      {subView === 'enhance' && <EnhancementPanel />}
      {subView === 'socket' && <SocketPanel />}

      {subView === 'shop' && (
        <>
          <View style={styles.filterRow}>
            {STAT_FILTERS.map((filter) => (
              <Pressable
                key={filter}
                style={[styles.filterChip, shopStatFilter === filter && styles.filterChipActive]}
                onPress={() => setShopStatFilter(filter)}
              >
                <Text style={styles.filterChipLabel}>{STAT_FILTER_LABELS[filter]}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.itemList}>
            {filteredShopItems.length === 0 ? (
              <Text style={styles.wornEmptyText}>
                {shopStatFilter === 'all' ? '這個部位的款式都收集齊了' : '這個篩選條件下沒有符合的款式'}
              </Text>
            ) : (
              filteredShopItems.map(renderShopItemRow)
            )}
          </View>
        </>
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
  // 原本只有圖示、要點下去才知道是哪個部位——彈窗高度已經拉高有空間,直接把部位名稱
  // 露在圖示下面,不用點了才知道。寬度加大到48才塞得下4字的「主手武器」不截斷。
  slotButton: {
    width: 48,
    paddingVertical: 4,
    gap: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3a45',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonLabel: {
    color: '#8a8a95',
    fontSize: 8,
    textAlign: 'center',
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
  substatGrid: {
    width: '100%',
    gap: 4,
    marginBottom: 8,
  },
  substatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  substatRowLabel: {
    width: 28,
    color: '#8fbfe0',
    fontSize: 10,
    fontWeight: '600',
  },
  substatCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  substatCellLabel: {
    color: '#8a8a95',
    fontSize: 9,
  },
  substatCellValue: {
    color: '#c9a94f',
    fontSize: 11,
    fontWeight: '600',
  },
  substatCellValueZero: {
    color: '#5a5a65',
    fontWeight: '400',
  },
  subNav: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
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
  wornCard: {
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  wornItemName: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  wornItemBonus: {
    color: '#c9a94f',
    fontSize: 12,
  },
  wornEmptyText: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  unequipButton: {
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  unequipLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  itemList: {
    gap: 3,
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
