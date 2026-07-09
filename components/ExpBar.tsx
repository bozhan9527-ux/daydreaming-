import { StyleSheet, Text, View } from 'react-native';

interface ExpBarProps {
  level: number;
  bankedExp: number;
  needed: number;
  isMaxLevel: boolean;
  coins: number;
  levelsAvailable: number;
}

export function ExpBar({ level, bankedExp, needed, isMaxLevel, coins, levelsAvailable }: ExpBarProps) {
  const ratio = isMaxLevel ? 1 : Math.min(1, needed > 0 ? bankedExp / needed : 0);
  // 銀行經驗值可能一次囤好幾級份,直接顯示「97812 / 300」這種原始數字量級差太多,
  // 看起來像壞掉,夠兌換至少1級時改顯示「可升 N 級」更直覺。
  const barLabel = isMaxLevel ? '已封頂' : levelsAvailable > 0 ? `可升 ${levelsAvailable} 級` : `${bankedExp} / ${needed}`;

  return (
    <View style={styles.row}>
      <Text style={styles.levelLabel}>Lv.{level}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
        <Text style={styles.barText}>{barLabel}</Text>
      </View>
      <Text style={styles.coinsLabel}>金幣 {coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 320,
  },
  levelLabel: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#c9a94f',
    borderRadius: 8,
  },
  barText: {
    color: '#f2f2f2',
    fontSize: 10,
    textAlign: 'center',
  },
  coinsLabel: {
    color: '#f2f2f2',
    fontSize: 13,
  },
});
