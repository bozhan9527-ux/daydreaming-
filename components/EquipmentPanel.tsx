import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EquipmentBonusStat,
  EquipmentItem,
  EquipmentSlot,
  getEnhancedBonusValue,
  getEquipmentBonusTotalsFull,
  getEquippableItemsForSlot,
  getIdentifyCost,
  getItemById,
  getItemRarity,
  getRerollCost,
  getSubstatTotals,
  isItemUnlocked,
} from '../game/equipment';
import { getEquipmentSlotIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { RARITY_FRAME_PARTS } from './equipmentFrames';
import { useHeroArt } from './HeroWalkSprite';
import { formatBonus, formatItemStats } from './itemFormatting';
import { ItemIcon } from './ItemIcon';
import { ItemPreviewModal } from './ItemPreviewModal';
import { NineSliceFrame } from './NineSliceFrame';
import { OrnateFrame } from './OrnateFrame';
import { PixelSprite } from './PixelSprite';

// 裝備分頁的角色預覽:跟戰鬥畫面共用同一份 AI 美術(useHeroArt),平常顯示 open,點一下
// 短暫換成 middle(來源三聯圖中間那張動作格)再彈回來——跟 HeroWalkSprite 點擊顯示 click
// (最右格)是同一個「點一下看另一張」手感,只是這裡看的是中間那張。這個預覽不會疊裝備
// 圖層(AI 美術不是逐插槽疊圖系統),純粹替換掉原本 HeroSprite 的程式產生疊圖角色。
const HERO_PREVIEW_HEIGHT = 130;
const HERO_PREVIEW_CLICK_MS = 500;

function EquipmentHeroPreview() {
  const art = useHeroArt();
  const [showMiddle, setShowMiddle] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(timeout.current);
  }, []);

  function handlePress() {
    setShowMiddle(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setShowMiddle(false), HERO_PREVIEW_CLICK_MS);
  }

  const source = showMiddle ? art.middle : art.open;
  const aspectRatio = showMiddle ? art.middleAspectRatio : art.openAspectRatio;

  return (
    <Pressable onPress={handlePress}>
      <Image
        source={source}
        style={{ height: HERO_PREVIEW_HEIGHT, width: HERO_PREVIEW_HEIGHT * aspectRatio }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

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

// 角色紙娃娃兩側各一欄圖示按鈕:武器(主手/副手)對放最上排,其餘裝備往下排。
const LEFT_COLUMN: EquipmentSlot[] = ['offhand', 'headwear', 'top', 'belt', 'bottom'];
const RIGHT_COLUMN: EquipmentSlot[] = ['mainhand', 'face', 'back', 'gloves'];

const EMPTY_ICON_COLOR = '#4a4456';
// 圖示來源(equipmentIcons.ts/weapons.ts)配合勇者本體密度提升,整張放大了3倍,
// 這裡用 2/3 抵銷回來,維持清單/選槽按鈕原本的物理尺寸不變。
const ICON_PIXEL_SIZE = 2 / 3;
// 插槽按鈕是長方形(圖示+文字標籤,不是正方形),9宮格外框角落尺寸要比單純的正方形插槽小,
// 邊框段才有足夠空間撐開,不會角落花紋直接連在一起。
const SLOT_FRAME_CORNER = 14;
const SLOT_FRAME_EDGE = 5;

// 背包已經拆成獨立頂層分頁(見 components/InventoryPanel.tsx),這裡收納鑲嵌——
// 圍繞「身上穿的這件裝備」在操作,收在裝備分頁底下比較好找。強化跟鑲嵌都已經移到
// 「工坊」分頁(見 WorkshopTab.tsx),跟合成分頁放在一起,不再收在這裡。
type SubView = 'worn' | 'shop';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'worn', label: '穿戴' },
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

interface EquipmentPanelProps {
  selectedSlot: EquipmentSlot;
  onSelectSlot: (slot: EquipmentSlot) => void;
}

// selectedSlot 改由外層(InventoryTab.tsx)控制、透過 props 傳入——裝備分頁併進背包分頁
// 底下當子分頁後,「背包」子分頁的部位篩選列要跟這裡的插槽選取共用同一份狀態,不然玩家在
// 「背包」選了頭飾、切去「裝備」子分頁看到的還是上次的主手武器,兩邊各自為政。
export function EquipmentPanel({ selectedSlot, onSelectSlot }: EquipmentPanelProps) {
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

  const [subView, setSubView] = useState<SubView>('worn');
  const [shopStatFilter, setShopStatFilter] = useState<StatFilter>('all');
  // 點商店清單裡的道具原本會直接買/裝上去,只靠事後跳出的 toast 通知——玩家點下去前完全
  // 看不到屬性,等於盲猜。改成先跳出預覽卡片顯示完整屬性,玩家自己按「裝備」或「卸下」才會
  // 真的改動裝備狀態,pickItem 的購買/裝備邏輯不變,只是延後到按鈕按下才觸發。
  const [previewItem, setPreviewItem] = useState<EquipmentItem | null>(null);

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

  // 鑑定/重擲原本在背包分頁,搬過來跟「穿戴」卡片放一起——這兩個操作只對身上這件裝備有意義
  // (背包裡沒穿的款式不需要鑑定/重擲),放在正在看的這張卡片旁邊比切去背包分頁再找更直覺。
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

  function renderSlotButton(slot: EquipmentSlot) {
    const slotItemId = equipment[slot];
    const slotItem = slotItemId !== undefined ? getItemById(slotItemId) : undefined;
    const iconColor = slotItem ? slotItem.color : EMPTY_ICON_COLOR;
    const emptySlotIcon = getEquipmentSlotIcon(slot);
    const active = slot === selectedSlot;
    // 已裝備插槽邊框換成 RARITY_FRAME_PARTS 美術圖的9宮格組合(依 bracket 分四色,見
    // game/equipment.ts),呼應參考UI設計圖的稀有度框系統;空插槽維持 styles.slotButton
    // 預設的青銅框。
    return (
      <Pressable
        key={slot}
        style={[styles.slotButton, slotItem && styles.slotButtonFilled, active && styles.slotButtonActive]}
        onPress={() => onSelectSlot(slot)}
      >
        {slotItem && (
          <NineSliceFrame
            parts={RARITY_FRAME_PARTS[getItemRarity(slotItem.bracket)]}
            cornerSize={SLOT_FRAME_CORNER}
            edgeThickness={SLOT_FRAME_EDGE}
          />
        )}
        {slotItem ? (
          <ItemIcon item={slotItem} color={iconColor} pixelSize={ICON_PIXEL_SIZE} aiHeight={20} />
        ) : (
          <>
            <PixelSprite frame={emptySlotIcon.frame} palette={{ [emptySlotIcon.fillKey]: iconColor }} pixelSize={ICON_PIXEL_SIZE} />
            {/* 文字標籤只在空插槽顯示(告訴玩家這格是什麼部位)——已裝備的插槽靠圖示本身
                +稀有度外框顏色就能辨識穿了什麼,不需要每格都塞一行重複的部位名稱。 */}
            <Text style={styles.slotButtonLabel} numberOfLines={1}>
              {SLOT_LABELS[slot]}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  // 背包分頁拆出去之後,這裡只剩「商店」會用到這個渲染,不用再分 bag/shop 兩種模式
  // (背包款式的鑑定/點擊裝備邏輯搬到 components/InventoryPanel.tsx 去了)。改成1:1方框icon
  // 方格,點擊只開預覽(ItemPreviewModal),不再直接顯示文字名稱/價格——跟背包分頁的
  // 道具方格共用同一套「先看icon,點了才看到完整資訊」的瀏覽習慣。
  function renderShopItemTile(item: EquipmentItem) {
    const locked = item.requiredLevel !== undefined && level.level < item.requiredLevel;
    return (
      <Pressable
        key={item.id}
        style={[styles.itemTile, locked && styles.itemTileLocked]}
        onPress={() => setPreviewItem(item)}
        disabled={locked}
      >
        <ItemIcon item={item} color={item.color} pixelSize={ICON_PIXEL_SIZE} aiHeight={30} />
        {locked && <Text style={styles.itemTileLockLabel}>Lv{item.requiredLevel}</Text>}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.paperdollRow}>
        <View style={styles.slotColumn}>{LEFT_COLUMN.map(renderSlotButton)}</View>
        <View style={styles.heroWrap}>
          <EquipmentHeroPreview />
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
              {(() => {
                const instance = itemInstances[currentItem.id];
                const canIdentify = instance !== undefined && !instance.identified;
                return (
                  <>
                    {canIdentify && (
                      <Pressable style={styles.identifyRow} onPress={() => handleIdentify(currentItem)}>
                        <Text style={styles.identifyLabel}>🔍 鑑定隱藏素質({getIdentifyCost(currentItem)} 金幣)</Text>
                      </Pressable>
                    )}
                    {instance !== undefined && (
                      <Pressable style={styles.identifyRow} onPress={() => handleReroll(currentItem)}>
                        <Text style={styles.identifyLabel}>🎲 重擲隨機/隱藏素質({getRerollCost(currentItem)} 金幣)</Text>
                      </Pressable>
                    )}
                  </>
                );
              })()}
              <Pressable style={styles.unequipButton} onPress={() => unequip(selectedSlot)}>
                <Text style={styles.unequipLabel}>卸下</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.wornEmptyText}>這個部位還沒有裝備,去「背包」或「商店」挑一件</Text>
          )}
        </View>
      )}

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
          <View style={styles.itemGrid}>
            {filteredShopItems.length === 0 ? (
              <Text style={styles.wornEmptyText}>
                {shopStatFilter === 'all' ? '這個部位的款式都收集齊了' : '這個篩選條件下沒有符合的款式'}
              </Text>
            ) : (
              filteredShopItems.map(renderShopItemTile)
            )}
          </View>
        </>
      )}

      {previewItem && (
        <ItemPreviewModal
          item={previewItem}
          instance={itemInstances[previewItem.id]}
          coins={coins}
          isEquipped={equipment[selectedSlot] === previewItem.id}
          owned={isItemUnlocked(unlockedItemIds, previewItem.id)}
          onClose={() => setPreviewItem(null)}
          onEquipOrBuy={() => {
            pickItem(previewItem);
            setPreviewItem(null);
          }}
          onUnequip={() => {
            unequip(selectedSlot);
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
  // 選取中狀態統一用藍色(#6ab0e0)當「互動中/選取中」訊號色,金色專門留給裝飾性外框——
  // 跟背包分頁的插槽選取樣式對齊,不要兩個分頁各用一套顏色語言。
  slotButtonActive: {
    backgroundColor: '#3d3450',
    shadowColor: '#6ab0e0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 5,
  },
  // 已裝備插槽的邊框改用 NineSliceFrame 疊加的美術圖蓋掉,不用 borderWidth 畫框。
  slotButtonFilled: {
    borderWidth: 0,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  itemTile: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTileLocked: {
    opacity: 0.45,
  },
  itemTileLockLabel: {
    position: 'absolute',
    bottom: 2,
    color: '#8a8a95',
    fontSize: 9,
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
    fontSize: 11,
  },
});
