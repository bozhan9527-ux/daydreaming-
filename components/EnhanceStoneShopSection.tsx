import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENHANCE_STONE_PRICE } from '../game/equipment';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

// 商店的「強化石」分類:購買固定拿初階(見 hooks/useGameState.ts 的 purchaseEnhanceStone
// 註解),更高階只能靠合成(工坊→合成分頁)或副本掉落——跟 EnhancementPanel.tsx 原本內嵌的
// 購買列是同一個 action,搬來商店統一收購買入口,強化面板只留「花石頭強化裝備」的操作。
export function EnhanceStoneShopSection() {
  const coins = useGameState((state) => state.coins);
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const purchaseEnhanceStone = useGameState((state) => state.purchaseEnhanceStone);
  const showToast = useToast((state) => state.show);

  function handleBuy() {
    if (coins < ENHANCE_STONE_PRICE) {
      showToast(`金幣不夠買強化石(需要 ${ENHANCE_STONE_PRICE} 金幣)`);
      return;
    }
    purchaseEnhanceStone();
    showToast('購買強化石 x1');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>購買固定拿初階強化石,更高階要去「工坊」分頁的合成子分頁用兩顆前一階換一顆</Text>
      <Pressable style={styles.row} onPress={handleBuy}>
        <Text style={styles.label}>初階強化石:{enhanceStones[0]} 顆</Text>
        <Text style={styles.cost}>購買 +1({ENHANCE_STONE_PRICE} 金幣)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  label: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  cost: {
    color: '#c9a94f',
    fontSize: 11,
  },
});
