import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  // 三段式收合,跟右側 DailyQuestBadge 對稱(見該檔案註解)——貼左邊緣的小三角形,點第一下
  // 往右延伸露出🎉圖示,點第二下攤開完整活動內容,第三下收回三角形。
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  const now = Date.now();
  const event = getActiveLimitedEvent(now);
  if (!event) return null;

  const remainingMs = getLimitedEventEndsAt(now) - now;

  function advance() {
    setStage((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {stage !== 2 && (
        <Pressable style={styles.tabRow} onPress={advance}>
          <View style={styles.triangle} />
          {stage === 1 && (
            <View style={styles.iconPill}>
              <Text style={styles.iconPillEmoji}>🎉</Text>
            </View>
          )}
        </Pressable>
      )}

      {stage === 2 && (
        <View style={styles.badge}>
          <Pressable style={styles.panelHeaderRow} onPress={() => setStage(0)}>
            <Text style={styles.title}>🎉 {event.label}</Text>
            <Text style={styles.panelHeaderClose}>✕</Text>
          </Pressable>
          <Text style={styles.bonus}>
            {STAT_LABELS[event.stat]} +{Math.round(event.bonus * 100)}%
          </Text>
          <Text style={styles.remaining}>剩餘 {formatRemaining(remainingMs)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 74,
    left: 0,
    zIndex: 20,
    alignItems: 'flex-start',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 跟 DailyQuestBadge 的三角形鏡射:左邊框設實色、上下透明,尖端朝右指向畫面內側。
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftWidth: 14,
    borderLeftColor: '#c9a94f',
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 36, 20, 0.92)',
    borderWidth: 1,
    borderColor: '#c9a94f',
  },
  iconPillEmoji: {
    fontSize: 14,
  },
  badge: {
    marginTop: 4,
    marginLeft: 8,
    alignItems: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(42, 36, 20, 0.92)',
    borderWidth: 1,
    borderColor: '#c9a94f',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelHeaderClose: {
    color: '#c9c9d2',
    fontSize: 11,
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
