import { StyleSheet, Text, View } from 'react-native';

// 頂部資源列:呼應參考圖「畫面最上方就看得到等級/金幣,不用往下滑」的資訊層級——
// 藥丸狀徽章,金幣旁邊留一個視覺上的強調點(呼應參考圖金幣旁的「+」按鈕位置),
// 但這裡沒有付費儲值,所以不放真的「+」按鈕,只維持同樣的徽章視覺語言。
interface TopResourceBarProps {
  level: number;
  coins: number;
  skillBooks: number;
}

// 技能書是每次升技能都要看的資源,但原本只有背包分頁看得到庫存,玩家很容易忘記手上有多少——
// 跟等級/金幣一樣提到常駐列,其餘強化石/寶石維持收在背包(不是每次操作都要看,常駐列放太多
// 反而稀釋掉等級/金幣這兩個最核心的資訊)。
export function TopResourceBar({ level, coins, skillBooks }: TopResourceBarProps) {
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
      <View style={styles.pill}>
        <View style={[styles.dot, styles.skillBookDot]} />
        <Text style={styles.pillText}>技能書 {skillBooks}</Text>
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
  skillBookDot: {
    backgroundColor: '#8fbfe0',
  },
  pillText: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});
