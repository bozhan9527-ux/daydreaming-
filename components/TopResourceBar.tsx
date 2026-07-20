import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const LEVEL_ICON = require('../assets/sprites/ui/icon_level.png');
const COIN_ICON = require('../assets/sprites/ui/icon_coin.png');
const SKILLBOOK_ICON = require('../assets/sprites/ui/icon_skillbook.png');

// 頂部資源列:呼應參考圖「畫面最上方就看得到等級/金幣,不用往下滑」的資訊層級——
// 藥丸狀徽章,金幣旁邊留一個視覺上的強調點(呼應參考圖金幣旁的「+」按鈕位置),
// 但這裡沒有付費儲值,所以不放真的「+」按鈕,只維持同樣的徽章視覺語言。三個徽章都換成
// 使用者提供的 UI 素材圖示,等級用月桂葉+星星徽章(原本沒有對應素材,維持純色圓點)。
interface TopResourceBarProps {
  level: number;
  coins: number;
  skillBooks: number;
  onPressLevel?: () => void;
}

// 技能書是每次升技能都要看的資源,但原本只有背包分頁看得到庫存,玩家很容易忘記手上有多少——
// 跟等級/金幣一樣提到常駐列,其餘強化石/寶石維持收在背包(不是每次操作都要看,常駐列放太多
// 反而稀釋掉等級/金幣這兩個最核心的資訊)。生涯總覽(見 CareerOverviewPanel.tsx)刻意不在這裡
// 加第4個徽章,而是讓既有的Lv.徽章可以點——不增加常駐列的視覺元素數量,只是讓現有元素多一個
// 用途。
export function TopResourceBar({ level, coins, skillBooks, onPressLevel }: TopResourceBarProps) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.pill} onPress={onPressLevel} disabled={!onPressLevel}>
        <Image source={LEVEL_ICON} style={styles.icon} resizeMode="contain" />
        <Text style={styles.pillText}>Lv.{level}</Text>
      </Pressable>
      <View style={styles.pill}>
        <Image source={COIN_ICON} style={styles.icon} resizeMode="contain" />
        <Text style={styles.pillText}>{coins.toLocaleString()}</Text>
      </View>
      <View style={styles.pill}>
        <Image source={SKILLBOOK_ICON} style={styles.icon} resizeMode="contain" />
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
    borderColor: '#59462b',
  },
  icon: {
    width: 16,
    height: 16,
  },
  pillText: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
});
