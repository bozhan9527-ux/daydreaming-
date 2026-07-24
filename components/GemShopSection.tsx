import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GEM_SPECS, GemType, GEM_TYPES } from '../game/equipment';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

const BONUS_GEM_TYPES = GEM_TYPES.filter((t) => GEM_SPECS[t].kind === 'bonus');
const SUBSTAT_GEM_TYPES = GEM_TYPES.filter((t) => GEM_SPECS[t].kind === 'substat');

// 商店的「鑲嵌石」分類:購買固定拿初階(見 hooks/useGameState.ts 的 purchaseGem 註解),
// 更高階要去「工坊」分頁的鑲嵌子分頁合成——跟 SocketPanel.tsx 原本內嵌的購買列是同一個
// action,搬來商店統一收購買入口,鑲嵌面板只留「合成/鑲入/拔出」的操作。
export function GemShopSection() {
  const coins = useGameState((state) => state.coins);
  const gemCounts = useGameState((state) => state.gemCounts);
  const purchaseGem = useGameState((state) => state.purchaseGem);
  const showToast = useToast((state) => state.show);

  const [selectedGemType, setSelectedGemType] = useState<GemType>('expGem');
  const selectedSpec = GEM_SPECS[selectedGemType];

  function handleBuy() {
    const price = selectedSpec.price;
    if (coins < price) {
      showToast(`金幣不夠買${selectedSpec.name}(需要 ${price} 金幣)`);
      return;
    }
    purchaseGem(selectedGemType);
    showToast(`購買初階${selectedSpec.name} x1`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>購買固定拿初階,更高階要去「工坊」分頁的鑲嵌子分頁用兩顆前一階合成一顆</Text>

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

      <Pressable style={styles.row} onPress={handleBuy}>
        <Text style={styles.label}>
          初階{selectedSpec.name}:{gemCounts[selectedGemType][0]} 顆
        </Text>
        <Text style={styles.cost}>購買 +1({selectedSpec.price} 金幣)</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
    marginTop: 4,
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
