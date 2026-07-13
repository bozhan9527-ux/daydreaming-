import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getActiveLimitedEvent, getLimitedEventEndsAt } from '../game/limitedEvent';

const CLOCK_TICK_MS = 30000;

const STAT_LABELS: Record<'exp' | 'coins' | 'speed', string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}時${minutes}分` : `${minutes}分`;
}

// 浮在畫面左側的小徽章,跟右側的 DailyQuestBadge 對稱——沒有活動進行中就完全不渲染
// (見 game/limitedEvent.ts,一週7天只有3天有活動),不會平白佔用畫面版面。
export function LimitedEventBanner() {
  // 讀 Date.now() 畫倒數,同 SkillTracker.tsx 的既有模式,跳出 React Compiler 自動記憶化。
  'use no memo';

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const event = getActiveLimitedEvent(now);
  if (!event) return null;

  const remainingMs = getLimitedEventEndsAt(now) - now;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View style={styles.badge}>
        <Text style={styles.title}>🎉 {event.label}</Text>
        <Text style={styles.bonus}>
          {STAT_LABELS[event.stat]} +{Math.round(event.bonus * 100)}%
        </Text>
        <Text style={styles.remaining}>剩餘 {formatRemaining(remainingMs)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 74,
    left: 8,
    zIndex: 20,
  },
  badge: {
    alignItems: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(42, 36, 20, 0.92)',
    borderWidth: 1,
    borderColor: '#c9a94f',
  },
  title: {
    color: '#f2f2f2',
    fontSize: 10,
    fontWeight: '600',
  },
  bonus: {
    color: '#c9a94f',
    fontSize: 11,
    fontWeight: '700',
  },
  remaining: {
    color: '#c9c9d2',
    fontSize: 9,
  },
});
