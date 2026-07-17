import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const GIFT_ICON = require('../assets/sprites/ui/icon_gift.png');

import {
  canClaimDailyQuest,
  canClaimDailyTask,
  DAILY_QUEST_KILL_TARGET,
  DAILY_TASKS,
  DailyTaskId,
} from '../game/daily';
import { canClaimWeeklyChallenge, getActiveWeeklyChallenges } from '../game/weeklyChallenge';
import { useGameState } from '../hooks/useGameState';

interface TaskRow {
  key: string;
  label: string;
  current: number;
  target: number;
  claimed: boolean;
  canClaim: boolean;
  onClaim: () => void;
}

// 每日任務原本只有 1 條(擊殺),現在擴充成任務池共 5 條(擊殺+鑑定+副本+強化+寵物坐騎裝備),
// 再加上週期成就輪替(見 game/weeklyChallenge.ts)的 3 條本週挑戰——刻意塞進同一個徽章裡
// (只分兩個子區塊 每日/本週),不另外開第二個浮動徽章佔畫面(Hick's Law:選項越多決策越慢,
// 兩個徽章疊在畫面上比一個徽章裡分兩段更吵)。徽章本身還是浮在畫面右側的小按鈕(不佔主畫面
// 高度),點一下展開/收合底下的清單,兩邊全部領完才會整個消失。
export function DailyQuestBadge() {
  const [expanded, setExpanded] = useState(false);

  const dailyKillCount = useGameState((state) => state.dailyKillCount);
  const dailyQuestClaimed = useGameState((state) => state.dailyQuestClaimed);
  const claimDailyQuest = useGameState((state) => state.claimDailyQuest);
  const dailyTaskProgress = useGameState((state) => state.dailyTaskProgress);
  const dailyTaskClaimedIds = useGameState((state) => state.dailyTaskClaimedIds);
  const claimDailyTask = useGameState((state) => state.claimDailyTask);
  const weeklyChallengeProgress = useGameState((state) => state.weeklyChallengeProgress);
  const weeklyChallengeClaimedIds = useGameState((state) => state.weeklyChallengeClaimedIds);
  const claimWeeklyChallenge = useGameState((state) => state.claimWeeklyChallenge);
  const unlockedAchievementIds = useGameState((state) => state.unlockedAchievementIds);
  const claimedAchievementIds = useGameState((state) => state.claimedAchievementIds);

  const dailyRows: TaskRow[] = [
    {
      key: 'kill',
      label: `擊敗${DAILY_QUEST_KILL_TARGET}隻怪物`,
      current: Math.min(dailyKillCount, DAILY_QUEST_KILL_TARGET),
      target: DAILY_QUEST_KILL_TARGET,
      claimed: dailyQuestClaimed,
      canClaim: canClaimDailyQuest(dailyKillCount, dailyQuestClaimed),
      onClaim: claimDailyQuest,
    },
    ...DAILY_TASKS.map((task) => ({
      key: task.id,
      label: task.label,
      current: Math.min(dailyTaskProgress[task.id] ?? 0, task.target),
      target: task.target,
      claimed: dailyTaskClaimedIds.includes(task.id),
      canClaim: canClaimDailyTask(task.id, dailyTaskProgress, dailyTaskClaimedIds),
      onClaim: () => claimDailyTask(task.id as DailyTaskId),
    })),
  ];

  const weeklyRows: TaskRow[] = getActiveWeeklyChallenges().map((def) => ({
    key: def.id,
    label: def.label,
    current: Math.min(weeklyChallengeProgress[def.statKey] ?? 0, def.target),
    target: def.target,
    claimed: weeklyChallengeClaimedIds.includes(def.id),
    canClaim: canClaimWeeklyChallenge(def.id, weeklyChallengeProgress, weeklyChallengeClaimedIds),
    onClaim: () => claimWeeklyChallenge(def.id),
  }));

  // 成就待領取數(見 game/achievements.ts 的手動領取制):只把「還有幾個可領」的數字併進
  // 徽章總待領取數,不把102個成就逐筆列進這個小面板——面板本來就是給「每日/每週」這種會
  // 跨天/跨週歸零的短期任務用,成就是終生累積清單,塞進來會撐爆面板,也稀釋掉「今天/本週
  // 做完了嗎」這個原本的判斷基準。allClaimed(徽章整個消失的條件)刻意不算進成就數——不然
  // 已經有大量歷史成就待領的老玩家會發現徽章永遠不會消失,失去「今天做完了」的完成感。
  const achievementClaimableCount = unlockedAchievementIds.filter((id) => !claimedAchievementIds.includes(id)).length;

  const allRows = [...dailyRows, ...weeklyRows];
  const claimedCount = allRows.filter((row) => row.claimed).length;
  const claimableCount = allRows.filter((row) => row.canClaim).length + achievementClaimableCount;
  const allClaimed = claimedCount === allRows.length;

  if (allClaimed) return null;

  function renderRow(row: TaskRow) {
    return (
      <View key={row.key} style={styles.row}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {row.claimed ? '✓ ' : ''}
          {row.label}
        </Text>
        {row.claimed ? (
          <Text style={styles.rowDone}>已領取</Text>
        ) : row.canClaim ? (
          <Pressable style={styles.rowClaimButton} onPress={row.onClaim}>
            <Text style={styles.rowClaimButtonText}>領取</Text>
          </Pressable>
        ) : (
          <Text style={styles.rowProgress}>
            {row.current}/{row.target}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        style={[styles.badge, claimableCount > 0 && styles.badgeReady]}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Image source={GIFT_ICON} style={styles.giftIcon} resizeMode="contain" />
        <Text style={styles.title}>任務</Text>
        <Text style={styles.progress}>
          {claimedCount}/{allRows.length}
        </Text>
        {claimableCount > 0 && <Text style={styles.claimLabel}>{claimableCount} 個待領取</Text>}
      </Pressable>

      {expanded && (
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>每日任務</Text>
          {dailyRows.map(renderRow)}
          <Text style={styles.sectionLabel}>本週挑戰</Text>
          {weeklyRows.map(renderRow)}
          {achievementClaimableCount > 0 && (
            <>
              <Text style={styles.sectionLabel}>成就</Text>
              <Text style={styles.achievementHint}>
                {achievementClaimableCount} 個成就可領取,前往「成就」分頁一鍵領取
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 74,
    right: 8,
    zIndex: 20,
    alignItems: 'flex-end',
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
  giftIcon: {
    width: 18,
    height: 18,
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
    fontSize: 9,
    fontWeight: '700',
  },
  panel: {
    marginTop: 4,
    width: 200,
    gap: 4,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(23, 23, 31, 0.95)',
    borderWidth: 1,
    borderColor: '#3a3a45',
  },
  sectionLabel: {
    color: '#8a8a95',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  achievementHint: {
    color: '#c9a94f',
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  rowLabel: {
    color: '#e0e0e6',
    fontSize: 10,
    flexShrink: 1,
  },
  rowProgress: {
    color: '#8a8a95',
    fontSize: 10,
  },
  rowDone: {
    color: '#5fa563',
    fontSize: 10,
  },
  rowClaimButton: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#c9a94f',
  },
  rowClaimButtonText: {
    color: '#1c1c24',
    fontSize: 10,
    fontWeight: '700',
  },
});
