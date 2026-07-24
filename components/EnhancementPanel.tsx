import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ENHANCE_MAX_LEVEL,
  EquipmentSlot,
  getEnhanceCoinCost,
  getEnhanceFailChance,
  getEnhanceStoneCost,
  getEnhancedBonusValue,
  getItemById,
} from '../game/equipment';
import { currentMaterialTier, MATERIAL_TIER_LABELS } from '../game/materials';
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

export function EnhancementPanel() {
  const equipment = useGameState((state) => state.equipment);
  const itemInstances = useGameState((state) => state.itemInstances);
  const coins = useGameState((state) => state.coins);
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const jobTier = useGameState((state) => state.jobTier);
  const enhanceItem = useGameState((state) => state.enhanceItem);
  const showToast = useToast((state) => state.show);

  // 強化石分階制(見 game/materials.ts):強化裝備要用「目前職業階級」對應那一階的石頭,
  // 這裡只看那一階夠不夠用,其餘階級的庫存要去背包的材料瀏覽頁看。購買強化石的入口
  // 搬到商店分頁的「強化石」分類(見 ShopTab.tsx + EnhanceStoneShopSection.tsx),
  // 這裡只留「花石頭強化裝備」的操作。
  const materialTier = currentMaterialTier(hasChosenJob, jobTier);
  const availableStones = enhanceStones[materialTier];
  const materialTierLabel = MATERIAL_TIER_LABELS[materialTier];

  function handleEnhance(itemId: string) {
    enhanceItem(itemId);
    const outcome = useGameState.getState().lastEnhanceOutcome;
    if (outcome) showToast(outcome);
  }

  const equippedSlots = SLOTS.filter((slot) => equipment[slot] !== undefined);

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>裝備 +1~+5 強化失敗只浪費資源,+6~+10 失敗有機會降級或損毀,抗性素質能降低失敗率</Text>

      <View style={styles.stoneRow}>
        <Text style={styles.stoneLabel}>
          {materialTierLabel}強化石:{availableStones} 顆
        </Text>
        <Text style={styles.stoneBuy}>不夠用去「商店」分頁買</Text>
      </View>

      {equippedSlots.length === 0 && <Text style={styles.emptyHint}>還沒有裝備任何東西,先到「背包」分頁穿上再回來強化</Text>}

      {equippedSlots.map((slot) => {
        const itemId = equipment[slot]!;
        const item = getItemById(itemId);
        const instance = itemInstances[itemId];
        if (!item || !instance) return null;

        const isMaxed = instance.enhanceLevel >= ENHANCE_MAX_LEVEL;
        const coinCost = getEnhanceCoinCost(item, instance.enhanceLevel);
        const stoneCost = getEnhanceStoneCost(instance.enhanceLevel);
        const failChance = getEnhanceFailChance(instance, instance.enhanceLevel);
        const canAfford = coins >= coinCost && availableStones >= stoneCost;
        const icon = getItemIcon(item);
        const currentValue = getEnhancedBonusValue(item, instance);

        return (
          <View key={itemId} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.iconWrap}>
                <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: item.color }} pixelSize={ICON_PIXEL_SIZE} />
              </View>
              <View style={styles.itemHeaderText}>
                <Text style={styles.itemName}>
                  {SLOT_LABELS[slot]}:{item.name} +{instance.enhanceLevel}
                </Text>
                <Text style={styles.itemBonus}>目前加成:{Math.round(currentValue * 100)}%</Text>
              </View>
            </View>

            {isMaxed ? (
              <Text style={styles.maxedText}>已強化至上限 +{ENHANCE_MAX_LEVEL}</Text>
            ) : (
              <>
                <Text style={styles.costText}>
                  升到 +{instance.enhanceLevel + 1}:{coinCost} 金幣 / {stoneCost} 顆{materialTierLabel}強化石,失敗率{' '}
                  {Math.round(failChance * 100)}%
                  {instance.enhanceLevel + 1 > 5 ? '(危險區,失敗可能降級或損毀)' : ''}
                </Text>
                <Pressable
                  style={[styles.enhanceButton, !canAfford && styles.enhanceButtonDisabled]}
                  onPress={() => handleEnhance(itemId)}
                  disabled={!canAfford}
                >
                  <Text style={styles.enhanceButtonLabel}>強化</Text>
                </Pressable>
              </>
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
    gap: 6,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  stoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    marginBottom: 4,
  },
  stoneLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  stoneBuy: {
    color: '#c9a94f',
    fontSize: 11,
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
  itemHeaderText: {
    flex: 1,
  },
  itemName: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  itemBonus: {
    color: '#c9a94f',
    fontSize: 11,
  },
  costText: {
    color: '#8a8a95',
    fontSize: 11,
  },
  maxedText: {
    color: '#c9a94f',
    fontSize: 11,
  },
  enhanceButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#4a4456',
  },
  enhanceButtonDisabled: {
    opacity: 0.4,
  },
  enhanceButtonLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
