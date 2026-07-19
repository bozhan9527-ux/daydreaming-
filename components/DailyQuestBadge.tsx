import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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

  // 三段式收合:遊戲一開始預設完整展開(玩家第一眼就看到今天有哪些任務,不用自己去發現
  // 這顆徽章),玩家自己點兩下收合成小三角形貼邊(不佔版面)。點第一下先退到只露出禮物圖示
  // (+待領取數字角標)的中間態,點第二下才收回三角形,再點一下重新展開。收合成一個
  // stage 狀態機而不是兩顆獨立布林,避免「icon展開了但清單也還開著」這種不一致組合。
  const [stage, setStage] = useState<0 | 1 | 2>(2);

  if (allClaimed) return null;

  function advance() {
    setStage((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
  }

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
      {stage !== 2 && (
        <Pressable style={styles.tabRow} onPress={advance}>
          {stage === 1 && (
            <View style={[styles.iconPill, claimableCount > 0 && styles.iconPillReady]}>
              <Image source={GIFT_ICON} style={styles.giftIconSmall} resizeMode="contain" />
              {claimableCount > 0 && (
                <View style={styles.miniClaimBadge}>
                  <Text style={styles.miniClaimText}>{claimableCount}</Text>
                </View>
              )}
            </View>
          )}
          <View style={[styles.triangle, claimableCount > 0 && styles.triangleReady]} />
        </Pressable>
      )}

      {stage === 2 && (
        <View style={styles.panel}>
          <Pressable style={styles.panelHeaderRow} onPress={() => setStage(0)}>
            <Text style={styles.panelHeaderTitle}>
              任務 {claimedCount}/{allRows.length}
            </Text>
            <Text style={styles.panelHeaderClose}>✕</Text>
          </Pressable>
          {/* 展開態預設全部攤開會蓋住彩蛋反應框裡的勇者待機動畫(見 app/index.tsx),用
              ScrollView 限制高度——任務多的時候可以自己滑,不會把整個上半部畫面吃光。 */}
          <ScrollView
            style={styles.panelScroll}
            contentContainerStyle={styles.panelScrollContent}
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 74,
    right: 0,
    zIndex: 20,
    alignItems: 'flex-end',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 三角形用 border 撐出來(RN 沒有原生三角形元件):寬高皆0的 View,右邊框設實色、上下
  // 邊框設透明,視覺上會呈現一個尖端朝左的三角形——貼右邊緣、尖端指向畫面內側,像個可以
  // 拉出來的標籤把手。
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 14,
    borderRightColor: '#59462b',
  },
  triangleReady: {
    borderRightColor: '#c9a94f',
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 23, 31, 0.9)',
    borderWidth: 1,
    borderColor: '#59462b',
  },
  iconPillReady: {
    borderColor: '#c9a94f',
    backgroundColor: 'rgba(42, 36, 20, 0.92)',
  },
  giftIconSmall: {
    width: 16,
    height: 16,
  },
  miniClaimBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    minWidth: 13,
    paddingHorizontal: 2,
    borderRadius: 7,
    backgroundColor: '#c9a94f',
    alignItems: 'center',
  },
  miniClaimText: {
    color: '#1c1c24',
    fontSize: 8,
    fontWeight: '700',
  },
  // 寬度從200縮到165、高度用panelScroll的maxHeight夾住——展開態預設就會出現(見上面
  // stage初始值),留一點空間給彩蛋反應框裡的勇者待機動畫,不要整個蓋住。
  panel: {
    marginTop: 4,
    marginRight: 8,
    width: 165,
    gap: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(23, 23, 31, 0.95)',
    borderWidth: 1,
    borderColor: '#59462b',
  },
  panelScroll: {
    maxHeight: 160,
  },
  panelScrollContent: {
    gap: 4,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  panelHeaderTitle: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '700',
  },
  panelHeaderClose: {
    color: '#8a8a95',
    fontSize: 12,
  },
  sectionLabel: {
    color: '#8a8a95',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  achievementHint: {
    color: '#c9a94f',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  rowLabel: {
    color: '#e0e0e6',
    fontSize: 11,
    flexShrink: 1,
  },
  rowProgress: {
    color: '#8a8a95',
    fontSize: 11,
  },
  rowDone: {
    color: '#5fa563',
    fontSize: 11,
  },
  rowClaimButton: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#c9a94f',
  },
  rowClaimButtonText: {
    color: '#1c1c24',
    fontSize: 11,
    fontWeight: '700',
  },
});
