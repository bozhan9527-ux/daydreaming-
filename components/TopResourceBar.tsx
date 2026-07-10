import { StyleSheet, Text, View } from 'react-native';

// 頂部資源列:呼應參考圖「畫面最上方就看得到等級/金幣,不用往下滑」的資訊層級——
// 藥丸狀徽章,金幣旁邊留一個視覺上的強調點(呼應參考圖金幣旁的「+」按鈕位置),
// 但這裡沒有付費儲值,所以不放真的「+」按鈕,只維持同樣的徽章視覺語言。
interface TopResourceBarProps {
  level: number;
  coins: number;
}

export function TopResourceBar({ level, coins }: TopResourceBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <View style={[styles.dot, styles.levelDot]} />
        <Text style={styles.pillText}>Lv.{level}</Text>
      </View>
      <View style={styles.pill}>
        <View style={[styles.dot, styles.coinDot]} />
        <Text style={styles.pillText}>{coins.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#3a3a45',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelDot: {
    backgroundColor: '#6ab0e0',
  },
  coinDot: {
    backgroundColor: '#c9a94f',
  },
  pillText: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});
