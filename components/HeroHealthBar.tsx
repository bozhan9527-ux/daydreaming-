import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { heroMaxHp } from '../game/heroHealth';
import { useGameState } from '../hooks/useGameState';

// 裁自使用者提供的UI設計參考圖(DAYDREAMING UI HOME SKIN V1.0,第3節「HP & EXP BAR」)。
const HEART_ICON = require('../assets/sprites/ui/icon_heart.png');

const CLOCK_TICK_MS = 250;

// 血量比例的顏色門檻:>50% 綠色(安全)、20~50% 黃色(小心)、<20% 紅色(危險)——
// 呼應 game/heroHealth.ts 註解說的「平常小怪只小幅掉血,只有推王/落後練等才有真正戰敗風險」,
// 顏色只是給玩家一個「現在算不算安全」的直覺提示,不影響任何數值判定。
const HP_COLOR_SAFE = '#5ec26a';
const HP_COLOR_WARNING = '#d8b34a';
const HP_COLOR_DANGER = '#e05050';

function hpBarColor(ratio: number): string {
  if (ratio > 0.5) return HP_COLOR_SAFE;
  if (ratio > 0.2) return HP_COLOR_WARNING;
  return HP_COLOR_DANGER;
}

export function HeroHealthBar() {
  // 倒地恢復倒數要讀 Date.now() 這種 impure 值即時更新,跟 SkillTracker.tsx 的做法一致,
  // 這個 component 要跳出 React Compiler 的自動記憶化,不然 forceTick 不會觸發重算。
  'use no memo';

  const heroHp = useGameState((state) => state.heroHp);
  const level = useGameState((state) => state.level);
  const defeatRecoveryUntil = useGameState((state) => state.defeatRecoveryUntil);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const maxHp = heroMaxHp(level.level);
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, heroHp / maxHp)) : 0;
  const barColor = hpBarColor(ratio);

  const now = Date.now();
  const isRecovering = defeatRecoveryUntil !== null && now < defeatRecoveryUntil;
  const secondsLeft = isRecovering ? Math.max(0, Math.ceil((defeatRecoveryUntil! - now) / 1000)) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Image source={HEART_ICON} style={styles.heartIcon} resizeMode="contain" />
          <Text style={styles.label}>HP</Text>
        </View>
        <Text style={styles.value}>
          {Math.max(0, Math.round(heroHp))} / {maxHp}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
      </View>
      {isRecovering && (
        <View style={styles.recoveryBanner}>
          <Text style={styles.recoveryText}>倒地中,{secondsLeft} 秒後重新站起</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#1c1c24',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heartIcon: {
    width: 13,
    height: 13,
  },
  label: {
    color: '#c9a94f',
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '600',
  },
  // 血條外框改成金色鑲邊,呼應參考圖「HP & EXP BAR」的金屬滾邊血條樣式。
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a2a35',
    borderWidth: 1,
    borderColor: '#59462b',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  recoveryBanner: {
    marginTop: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(224, 80, 80, 0.18)',
    borderRadius: 6,
    paddingVertical: 3,
  },
  recoveryText: {
    color: '#e05050',
    fontSize: 11,
    fontWeight: '700',
  },
});
