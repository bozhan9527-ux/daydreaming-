import { StyleSheet, Text, View } from 'react-native';

import { GEM_TYPES } from '../game/equipment';
import { sumTieredMaterialCounts } from '../game/materials';
import { useGameState } from '../hooks/useGameState';

// 常駐材料列:強化石/寶石要點進「強化」「鑲嵌」子分頁才看得到,玩家沒辦法隨時掌握自己有多少
// 「彈藥」。強化石+寶石各自顯示全部階級/種類加總(一眼掃過去有沒有東西),細節(強化石各階/
// 寶石各種類各階)要去背包的材料瀏覽頁跟工坊的鑲嵌子分頁看——寶石現在有13種各6階,全部攤開
// 展示會塞爆這條常駐列,不適合放在這裡。
// 技能書不重複列在這裡——已經常駐在頂部資源列(TopResourceBar.tsx),同一個數字不需要出現兩次。
export function ResourceBar() {
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const gemCounts = useGameState((state) => state.gemCounts);

  const totalGems = GEM_TYPES.reduce((sum, gemType) => sum + sumTieredMaterialCounts(gemCounts[gemType]), 0);

  const materials = [
    { key: 'enhanceStones', label: '強化石', value: sumTieredMaterialCounts(enhanceStones) },
    { key: 'gems', label: '寶石', value: totalGems },
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
