import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  canClaimDailyQuest,
  canClaimDailyTask,
  DAILY_QUEST_KILL_TARGET,
  DAILY_TASKS,
  DailyTaskId,
} from '../game/daily';
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

// 每日任務原本只有 1 條(擊殺),現在擴充成任務池共 5 條(擊殺+鑑定+副本+強化+寵物坐騎裝備)——
// 徽章本身還是浮在畫面右側的小按鈕(不佔主畫面高度),點一下展開/收合底下的清單,
// 5 條全部領完才會整個消失(呼應原本「已領取就消失」的精神,只是判定條件從1條變5條)。
export function DailyQuestBadge() {
  const [expanded, setExpanded] = useState(false);

  const dailyKillCount = useGameState((state) => state.dailyKillCount);
  const dailyQuestClaimed = useGameState((state) => state.dailyQuestClaimed);
  const claimDailyQuest = useGameState((state) => state.claimDailyQuest);
  const dailyTaskProgress = useGameState((state) => state.dailyTaskProgress);
  const dailyTaskClaimedIds = useGameState((state) => state.dailyTaskClaimedIds);
  const claimDailyTask = useGameState((state) => state.claimDailyTask);

  const rows: TaskRow[] = [
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

  const claimedCount = rows.filter((row) => row.claimed).length;
  const claimableCount = rows.filter((row) => row.canClaim).length;
  const allClaimed = claimedCount === rows.length;

  if (allClaimed) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        style={[styles.badge, claimableCount > 0 && styles.badgeReady]}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Text style={styles.title}>每日任務</Text>
        <Text style={styles.progress}>
          {claimedCount}/{rows.length}
        </Text>
        {claimableCount > 0 && <Text style={styles.claimLabel}>{claimableCount} 個待領取</Text>}
      </Pressable>

      {expanded && (
        <View style={styles.panel}>
          {rows.map((row) => (
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
          ))}
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
