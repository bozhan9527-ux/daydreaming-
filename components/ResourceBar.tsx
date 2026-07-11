import { StyleSheet, Text, View } from 'react-native';

import { GEM_SPECS, GEM_TYPES } from '../game/equipment';
import { useGameState } from '../hooks/useGameState';

// 常駐資源列:強化石/寶石要點進「強化」「鑲嵌」分頁才看得到,玩家沒辦法隨時掌握自己有多少
// 「彈藥」。這裡用一排精簡數字常駐在主畫面,不用切分頁就能看到現況。
export function ResourceBar() {
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const gemCounts = useGameState((state) => state.gemCounts);
  const skillBooks = useGameState((state) => state.skillBooks);

  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Text style={styles.label}>強化石</Text>
        <Text style={styles.value}>{enhanceStones}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>技能書</Text>
        <Text style={styles.value}>{skillBooks}</Text>
      </View>
      {GEM_TYPES.map((gemType) => (
        <View key={gemType} style={styles.item}>
          <Text style={styles.label}>{GEM_SPECS[gemType].name}</Text>
          <Text style={styles.value}>{gemCounts[gemType]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  label: {
    color: '#8a8a95',
    fontSize: 10,
  },
  value: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '600',
  },
});
