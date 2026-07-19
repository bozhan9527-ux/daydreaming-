import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EquipmentSlot, GEM_SPECS, GEM_TYPES, GemType, getItemById } from '../game/equipment';
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

const GEM_SHORT_LABELS: Record<GemType, string> = {
  expGem: '經驗',
  coinGem: '金幣',
  speedGem: '速度',
};

const SLOTS: EquipmentSlot[] = ['back', 'bottom', 'top', 'belt', 'headwear', 'face', 'gloves', 'offhand', 'mainhand'];

export function SocketPanel() {
  const equipment = useGameState((state) => state.equipment);
  const itemInstances = useGameState((state) => state.itemInstances);
  const coins = useGameState((state) => state.coins);
  const gemCounts = useGameState((state) => state.gemCounts);
  const purchaseGem = useGameState((state) => state.purchaseGem);
  const socketGem = useGameState((state) => state.socketGem);
  const unsocketGem = useGameState((state) => state.unsocketGem);
  const showToast = useToast((state) => state.show);

  function handleBuyGem(gemType: GemType) {
    const price = GEM_SPECS[gemType].price;
    if (coins < price) {
      showToast(`金幣不夠買${GEM_SPECS[gemType].name}(需要 ${price} 金幣)`);
      return;
    }
    purchaseGem(gemType);
    showToast(`購買${GEM_SPECS[gemType].name} x1`);
  }

  function handleSocket(itemId: string, socketIndex: number, gemType: GemType) {
    if (gemCounts[gemType] <= 0) {
      showToast(`${GEM_SPECS[gemType].name}不夠,先去購買或戰鬥掉落`);
      return;
    }
    socketGem(itemId, socketIndex, gemType);
    showToast(`鑲入${GEM_SPECS[gemType].name}`);
  }

  function handleUnsocket(itemId: string, socketIndex: number) {
    unsocketGem(itemId, socketIndex);
    showToast('已拔出寶石,退回背包');
  }

  const equippedSlots = SLOTS.filter((slot) => equipment[slot] !== undefined);

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>寶石直接加成 exp/coins/speed,插槽數依裝備階級而定;拔除寶石會原樣退回背包,不會損毀</Text>

      <View style={styles.gemInventoryRow}>
        {GEM_TYPES.map((gemType) => (
          <Pressable key={gemType} style={styles.gemBuyButton} onPress={() => handleBuyGem(gemType)}>
            <Text style={styles.gemBuyLabel}>
              {GEM_SPECS[gemType].name} x{gemCounts[gemType]}
            </Text>
            <Text style={styles.gemBuyPrice}>購買({GEM_SPECS[gemType].price} 金幣)</Text>
          </Pressable>
        ))}
      </View>

      {equippedSlots.length === 0 && <Text style={styles.emptyHint}>還沒有裝備任何東西,先到「裝備」分頁穿上再回來鑲嵌</Text>}

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
              {instance.socketedGems.map((gemType, index) =>
                gemType ? (
                  <Pressable key={index} style={styles.socketFilled} onPress={() => handleUnsocket(itemId, index)}>
                    <Text style={styles.socketFilledLabel}>{GEM_SHORT_LABELS[gemType]}</Text>
                  </Pressable>
                ) : (
                  <View key={index} style={styles.socketEmpty}>
                    {GEM_TYPES.map((g) => (
                      <Pressable key={g} style={styles.socketOption} onPress={() => handleSocket(itemId, index, g)}>
                        <Text style={styles.socketOptionLabel}>{GEM_SHORT_LABELS[g]}</Text>
                      </Pressable>
                    ))}
                  </View>
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
  gemInventoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  gemBuyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  gemBuyLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  gemBuyPrice: {
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
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#59462b',
    borderStyle: 'dashed',
  },
  socketOption: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: '#2a2a35',
  },
  socketOptionLabel: {
    color: '#8a8a95',
    fontSize: 11,
  },
  noSocketText: {
    color: '#6a6a75',
    fontSize: 11,
  },
});
