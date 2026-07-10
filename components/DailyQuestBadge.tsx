import { Pressable, StyleSheet, Text, View } from 'react-native';

import { canClaimDailyQuest, DAILY_QUEST_KILL_TARGET } from '../game/daily';
import { useGameState } from '../hooks/useGameState';

// 每日任務原本是常駐主畫面的一整列,現在改成浮在畫面右側的小徽章——已經領取就直接消失,
// 不再佔用主畫面高度(呼應「整頁不能滾動」的版面限制,常駐列是被砍掉的高度之一)。
export function DailyQuestBadge() {
  const dailyKillCount = useGameState((state) => state.dailyKillCount);
  const dailyQuestClaimed = useGameState((state) => state.dailyQuestClaimed);
  const claimDailyQuest = useGameState((state) => state.claimDailyQuest);

  if (dailyQuestClaimed) return null;

  const canClaim = canClaimDailyQuest(dailyKillCount, dailyQuestClaimed);
  const progress = Math.min(dailyKillCount, DAILY_QUEST_KILL_TARGET);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        style={[styles.badge, canClaim && styles.badgeReady]}
        onPress={() => canClaim && claimDailyQuest()}
        disabled={!canClaim}
      >
        <Text style={styles.title}>每日任務</Text>
        <Text style={styles.progress}>
          {progress}/{DAILY_QUEST_KILL_TARGET}
        </Text>
        {canClaim && <Text style={styles.claimLabel}>領取</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 74,
    right: 8,
    zIndex: 20,
  },
  badge: {
    alignItems: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(23, 23, 31, 0.9)',
    borderWidth: 1,
    borderColor: '#3a3a45',
  },
  badgeReady: {
    borderColor: '#c9a94f',
    backgroundColor: 'rgba(42, 36, 20, 0.92)',
  },
  title: {
    color: '#c9c9d2',
    fontSize: 9,
  },
  progress: {
    color: '#f2f2f2',
    fontSize: 11,
    fontWeight: '600',
  },
  claimLabel: {
    color: '#c9a94f',
    fontSize: 10,
    fontWeight: '700',
  },
});
