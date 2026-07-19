import { StyleSheet, Text, View } from 'react-native';

import { GEM_SPECS, GEM_TYPES } from '../game/equipment';
import { useGameState } from '../hooks/useGameState';

// 常駐材料列:強化石/寶石要點進「強化」「鑲嵌」子分頁才看得到,玩家沒辦法隨時掌握自己有多少
// 「彈藥」。改成清楚分類的 2 欄網格(強化石+3種寶石,各自升級對應等級的裝備/技能素材),
// 每格獨立卡片、字級跟其他背包內文一致,取代原本擠成一整行、5個數字塞在一起難以掃視的樣式。
// 技能書不重複列在這裡——已經常駐在頂部資源列(TopResourceBar.tsx),同一個數字不需要出現兩次。
export function ResourceBar() {
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const gemCounts = useGameState((state) => state.gemCounts);

  const materials = [
    { key: 'enhanceStones', label: '強化石', value: enhanceStones },
    ...GEM_TYPES.map((gemType) => ({
      key: gemType,
      label: GEM_SPECS[gemType].name,
      value: gemCounts[gemType],
    })),
  ];

  return (
    <View style={styles.grid}>
      {materials.map((item) => (
        <View key={item.key} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  label: {
    color: '#8a8a95',
    fontSize: 11,
  },
  value: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '600',
  },
});
