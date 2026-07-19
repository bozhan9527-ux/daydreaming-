import { Image, StyleSheet, Text, View } from 'react-native';

// 裁自使用者提供的UI設計參考圖(DAYDREAMING UI HOME SKIN V1.0,第3節「HP & EXP BAR」)。
const EXP_ICON = require('../assets/sprites/ui/icon_exp.png');

interface ExpBarProps {
  level: number;
  bankedExp: number;
  needed: number;
  isMaxLevel: boolean;
  levelsAvailable: number;
}

// 金幣已經在 TopResourceBar 常駐顯示,這裡不再重複——原本緊貼經驗條的「金幣 N」
// 跟頂部資源列同時存在,同一個數字在畫面上出現兩次。Lv標籤留著,因為它跟進度條是同一組資訊
// (在看「這一級」升到哪了),拿掉反而要多看一次頂部才知道現在是第幾級。
export function ExpBar({ level, bankedExp, needed, isMaxLevel, levelsAvailable }: ExpBarProps) {
  const ratio = isMaxLevel ? 1 : Math.min(1, needed > 0 ? bankedExp / needed : 0);
  // 銀行經驗值可能一次囤好幾級份,直接顯示「97812 / 300」這種原始數字量級差太多,
  // 看起來像壞掉,夠兌換至少1級時改顯示「可升 N 級」更直覺。
  const barLabel = isMaxLevel ? '已封頂' : levelsAvailable > 0 ? `可升 ${levelsAvailable} 級` : `${bankedExp} / ${needed}`;

  return (
    <View style={styles.row}>
      <Image source={EXP_ICON} style={styles.expIcon} resizeMode="contain" />
      <Text style={styles.levelLabel}>Lv.{level}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
        <Text style={styles.barText}>{barLabel}</Text>
      </View>
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
  expIcon: {
    width: 16,
    height: 16,
  },
  levelLabel: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  // 經驗條外框改成金色鑲邊,呼應參考圖「HP & EXP BAR」的金屬滾邊血條樣式。
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#59462b',
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
    fontSize: 11,
    textAlign: 'center',
  },
});
