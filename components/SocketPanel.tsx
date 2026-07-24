import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  canCraftGemTier,
  EquipmentSlot,
  GEM_SPECS,
  GEM_TYPES,
  GemType,
  getItemById,
} from '../game/equipment';
import { MATERIAL_TIER_LABELS, MATERIAL_TIERS, MaterialTier } from '../game/materials';
import { getItemIcon } from '../game/sprites/equipmentIcons';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { PixelSprite } from './PixelSprite';

// 圖示來源放大了3倍(配合勇者本體密度提升),用 2/3 抵銷回來維持原本物理尺寸。
const ICON_PIXEL_SIZE = 2 / 3;

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

// 加成類(exp/coins/speed)跟素質類(物理/魔法抗性、爆擊率、爆擊傷害、攻擊力、吸血、回血)
// 分兩區塊瀏覽——13種寶石一次全攤開會太亂,先選大類再選種類比較好找。
const BONUS_GEM_TYPES = GEM_TYPES.filter((t) => GEM_SPECS[t].kind === 'bonus');
const SUBSTAT_GEM_TYPES = GEM_TYPES.filter((t) => GEM_SPECS[t].kind === 'substat');

// 找目前選定種類裡「持有量最高的那一階」,鑲嵌時自動挑這一階——玩家幾乎總是想鑲自己最好的
// 那顆,不用另外多一層「選第幾階鑲」的介面。
function highestHeldTier(counts: Record<MaterialTier, number>): MaterialTier | null {
  for (let tier = 5; tier >= 0; tier--) {
    if (counts[tier as MaterialTier] > 0) return tier as MaterialTier;
  }
  return null;
}

export function SocketPanel() {
  const equipment = useGameState((state) => state.equipment);
  const itemInstances = useGameState((state) => state.itemInstances);
  const gemCounts = useGameState((state) => state.gemCounts);
  const craftGemTier = useGameState((state) => state.craftGemTier);
  const socketGem = useGameState((state) => state.socketGem);
  const unsocketGem = useGameState((state) => state.unsocketGem);
  const showToast = useToast((state) => state.show);

  const [selectedGemType, setSelectedGemType] = useState<GemType>('expGem');
  const selectedCounts = gemCounts[selectedGemType];
  const selectedSpec = GEM_SPECS[selectedGemType];

  // 購買初階寶石的入口搬到商店分頁的「鑲嵌石」分類(見 ShopTab.tsx + GemShopSection.tsx),
  // 這裡只留「合成/鑲入/拔出」的操作。
  function handleCraft(tier: MaterialTier) {
    if (tier === 0) return;
    craftGemTier(selectedGemType, tier);
    showToast(`合成${MATERIAL_TIER_LABELS[tier]}${selectedSpec.name}`);
  }

  // 連續合成:每次都重新讀取 getState() 的即時庫存判斷還能不能繼續,比照
  // CraftingPanel.tsx 的「全部合成」同一套做法。
  function handleCraftAll(tier: MaterialTier) {
    if (tier === 0) return;
    let count = 0;
    while (canCraftGemTier(selectedGemType, tier, useGameState.getState().gemCounts) && count < 5000) {
      craftGemTier(selectedGemType, tier);
      count++;
    }
    if (count === 0) {
      showToast(`${MATERIAL_TIER_LABELS[(tier - 1) as MaterialTier]}${selectedSpec.name}不夠,需要2顆才能合成`);
    } else {
      showToast(`連續合成完畢:${MATERIAL_TIER_LABELS[tier]}${selectedSpec.name} +${count}`);
    }
  }

  function handleSocket(itemId: string, socketIndex: number) {
    const tier = highestHeldTier(selectedCounts);
    if (tier === null) {
      showToast(`${selectedSpec.name}不夠,去「商店」分頁購買、這裡合成、或打副本掉落`);
      return;
    }
    socketGem(itemId, socketIndex, selectedGemType, tier);
    showToast(`鑲入${MATERIAL_TIER_LABELS[tier]}${selectedSpec.name}`);
  }

  function handleUnsocket(itemId: string, socketIndex: number) {
    unsocketGem(itemId, socketIndex);
    showToast('已拔出寶石,退回庫存');
  }

  const equippedSlots = SLOTS.filter((slot) => equipment[slot] !== undefined);

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        寶石分加成類(exp/coins/speed)跟素質類(抗性/爆擊/攻擊/吸血/回血),各自初階~五階,2顆前一階
        合成1顆下一階;拔除寶石會原樣退回對應階級的庫存,不會損毀。初階不夠去「商店」分頁買
      </Text>

      <View style={styles.gemTypeSection}>
        <Text style={styles.sectionLabel}>加成類</Text>
        <View style={styles.gemTypeRow}>
          {BONUS_GEM_TYPES.map((gemType) => (
            <Pressable
              key={gemType}
              style={[styles.gemTypeChip, selectedGemType === gemType && styles.gemTypeChipSelected]}
              onPress={() => setSelectedGemType(gemType)}
            >
              <Text style={styles.gemTypeChipLabel}>{GEM_SPECS[gemType].name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionLabel}>素質類</Text>
        <View style={styles.gemTypeRow}>
          {SUBSTAT_GEM_TYPES.map((gemType) => (
            <Pressable
              key={gemType}
              style={[styles.gemTypeChip, selectedGemType === gemType && styles.gemTypeChipSelected]}
              onPress={() => setSelectedGemType(gemType)}
            >
              <Text style={styles.gemTypeChipLabel}>{GEM_SPECS[gemType].name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.tierCard}>
        <Text style={styles.tierCardTitle}>{selectedSpec.name}</Text>
        <View style={styles.tierRow}>
          {MATERIAL_TIERS.map((tier) => (
            <View key={tier} style={styles.tierCell}>
              <Text style={styles.tierCellLabel}>{MATERIAL_TIER_LABELS[tier]}</Text>
              <Text style={styles.tierCellCount}>x{selectedCounts[tier]}</Text>
              {tier > 0 && (
                <View style={styles.tierCraftButtonGroup}>
                  <Pressable style={styles.tierCraftButton} onPress={() => handleCraft(tier)}>
                    <Text style={styles.tierCraftButtonLabel}>合成</Text>
                  </Pressable>
                  <Pressable style={styles.tierCraftAllButton} onPress={() => handleCraftAll(tier)}>
                    <Text style={styles.tierCraftButtonLabel}>全部合成</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {equippedSlots.length === 0 && <Text style={styles.emptyHint}>還沒有裝備任何東西,先到「背包」分頁穿上再回來鑲嵌</Text>}

      {equippedSlots.map((slot) => {
        const itemId = equipment[slot]!;
        const item = getItemById(itemId);
        const instance = itemInstances[itemId];
        if (!item || !instance) return null;
        const icon = getItemIcon(item);

        return (
          <View key={itemId} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.iconWrap}>
                <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: item.color }} pixelSize={ICON_PIXEL_SIZE} />
              </View>
              <Text style={styles.itemName}>
                {SLOT_LABELS[slot]}:{item.name}
              </Text>
            </View>
            <View style={styles.socketRow}>
              {instance.socketedGems.map((socketed, index) =>
                socketed ? (
                  <Pressable key={index} style={styles.socketFilled} onPress={() => handleUnsocket(itemId, index)}>
                    <Text style={styles.socketFilledLabel}>
                      {GEM_SPECS[socketed.type].name} {MATERIAL_TIER_LABELS[socketed.tier]}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable key={index} style={styles.socketEmpty} onPress={() => handleSocket(itemId, index)}>
                    <Text style={styles.socketEmptyLabel}>鑲入{selectedSpec.name}</Text>
                  </Pressable>
                )
              )}
              {instance.socketedGems.length === 0 && <Text style={styles.noSocketText}>這件裝備沒有插槽</Text>}
            </View>
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
    gap: 6,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  gemTypeSection: {
    gap: 4,
  },
  sectionLabel: {
    color: '#8a8a95',
    fontSize: 11,
    fontWeight: '700',
  },
  gemTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gemTypeChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  gemTypeChipSelected: {
    backgroundColor: '#274357',
    borderWidth: 1,
    borderColor: '#6ab0e0',
  },
  gemTypeChipLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  tierCard: {
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
  tierCardTitle: {
    color: '#c9a94f',
    fontSize: 12,
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tierCell: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  tierCellLabel: {
    color: '#8a8a95',
    fontSize: 11,
  },
  tierCellCount: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '600',
  },
  tierCraftButtonGroup: {
    gap: 2,
  },
  tierCraftButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#4a4456',
  },
  tierCraftAllButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#2a2440',
    borderWidth: 1,
    borderColor: '#6ab0e0',
  },
  tierCraftButtonLabel: {
    color: '#f2f2f2',
    fontSize: 9,
    textAlign: 'center',
  },
  emptyHint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
  itemCard: {
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    color: '#f2f2f2',
    fontSize: 12,
    flexShrink: 1,
  },
  socketRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  socketFilled: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#4a4456',
  },
  socketFilledLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  socketEmpty: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#59462b',
    borderStyle: 'dashed',
  },
  socketEmptyLabel: {
    color: '#8a8a95',
    fontSize: 11,
  },
  noSocketText: {
    color: '#6a6a75',
    fontSize: 11,
  },
});
