import { StyleSheet, Text, View } from 'react-native';

import { EquipmentSlot, getItemById, SLOT_Z_ORDER } from '../game/equipment';
import { useGameState } from '../hooks/useGameState';
import { ItemIcon } from './ItemIcon';

// 9 插槽 + 8 個間距要在最窄的手機寬度(扣掉左右 padding 後淨寬約 288px)也能排成一行,
// 不然「已裝備」跟「未裝備」款式尺寸就會因為換行而看起來不一致。28px×9 + 3px×8=276px,
// 留了一點餘裕。
const TILE_SIZE = 28;
const ICON_PIXEL_SIZE = 0.6;
const AI_ICON_HEIGHT = 22;
const EMPTY_SLOT_COLOR = '#3a3a45';

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  back: '背飾',
  bottom: '下身',
  top: '上身',
  belt: '腰帶',
  headwear: '頭飾',
  face: '面飾',
  gloves: '手套',
  offhand: '副手',
  mainhand: '主手',
};

// 已裝備道具縮圖列:9 插槽一次看完裝了什麼、幾級、有沒有強化,不用切去「裝備」分頁才看得到。
export function EquippedItemsStrip() {
  const equipment = useGameState((state) => state.equipment);
  const itemInstances = useGameState((state) => state.itemInstances);

  return (
    <View style={styles.row}>
      {SLOT_Z_ORDER.map((slot) => {
        const itemId = equipment[slot];
        const item = itemId ? getItemById(itemId) : undefined;
        const instance = itemId ? itemInstances[itemId] : undefined;
        const enhanceLevel = instance?.enhanceLevel ?? 0;

        if (!item) {
          return (
            <View key={slot} style={[styles.tile, styles.tileEmpty]}>
              <Text style={styles.emptyLabel}>{SLOT_LABELS[slot]}</Text>
            </View>
          );
        }

        return (
          <View key={slot} style={styles.tile}>
            <ItemIcon item={item} color={item.color} pixelSize={ICON_PIXEL_SIZE} aiHeight={AI_ICON_HEIGHT} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv{item.requiredLevel ?? 1}</Text>
            </View>
            {enhanceLevel > 0 && (
              <View style={styles.enhanceBadge}>
                <Text style={styles.enhanceText}>+{enhanceLevel}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    maxWidth: 320,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 7,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#3a3a45',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileEmpty: {
    borderStyle: 'dashed',
    borderColor: EMPTY_SLOT_COLOR,
  },
  emptyLabel: {
    color: '#5a5a65',
    fontSize: 8,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  levelText: {
    color: '#f2f2f2',
    fontSize: 7,
    fontWeight: '700',
  },
  enhanceBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#c9a94f',
    borderBottomLeftRadius: 5,
    paddingHorizontal: 2,
  },
  enhanceText: {
    color: '#17171f',
    fontSize: 7,
    fontWeight: '700',
  },
});
