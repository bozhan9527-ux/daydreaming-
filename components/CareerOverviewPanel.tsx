import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { getCurrentTier, getJobTitle } from '../game/combat';
import { getCycleCount } from '../game/ascension';
import { STAGE_COUNT } from '../game/stages';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

// 生涯總覽:手遊玩家角度檢討提出的「跟自己比」——不接後端、不做排行榜,純粹彙整存檔裡
// 已經有的終生數據(擊殺數/等級/輪迴次數/清過大關數/成就收藏),不新增任何追蹤欄位。
// 分享按鈕生的是文字摘要,不是圖片:react-native-view-shot 之類的截圖套件在 RN Web 上
// 支援度不穩定,而這個遊戲目前真正上線的管道是網頁版——文字摘要搭配瀏覽器原生的
// Web Share API(手機瀏覽器會跳出系統分享選單,可以直接轉貼到任何App),觸及率不輸圖卡,
// 風險小很多。
export function CareerOverviewPanel() {
  const killCount = useGameState((state) => state.killCount);
  const level = useGameState((state) => state.level);
  const job = useGameState((state) => state.job);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const totalStagesCleared = useGameState((state) => state.totalStagesCleared);
  const unlockedAchievementIds = useGameState((state) => state.unlockedAchievementIds);
  const showToast = useToast((state) => state.show);

  const cycleCount = getCycleCount(totalStagesCleared);
  const title = hasChosenJob ? getJobTitle(job.archetype, job.branch, getCurrentTier(level.level)) : '學生';

  const stats: { label: string; value: string }[] = [
    { label: '目前身分', value: title },
    { label: '目前等級', value: `Lv.${level.level}` },
    { label: '累計擊敗怪物', value: `${killCount.toLocaleString()} 隻` },
    { label: '累計清完大關', value: `${totalStagesCleared.toLocaleString()} 關` },
    { label: '輪迴次數', value: `第 ${cycleCount + 1} 輪` },
    { label: '成就收藏', value: `${unlockedAchievementIds.length}/102` },
  ];

  async function handleShare() {
    const lines = [
      '「勇者發呆中」生涯總覽',
      ...stats.map((s) => `${s.label}:${s.value}`),
    ];
    const text = lines.join('\n');

    if (Platform.OS === 'web') {
      const nav = (globalThis as { navigator?: Navigator }).navigator as
        | (Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> })
        | undefined;
      if (nav?.share) {
        try {
          await nav.share({ title: '勇者發呆中 生涯總覽', text });
          return;
        } catch {
          // 使用者自己取消分享視窗不算錯誤,不用額外提示;真的失敗才落到剪貼簿備援。
          return;
        }
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(text);
        showToast('生涯總覽已複製到剪貼簿');
        return;
      }
      showToast('這個瀏覽器不支援分享,請手動截圖');
      return;
    }

    await Share.share({ message: text });
  }

  return (
    <View style={styles.container}>
      <View style={styles.statList}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
      {cycleCount === 0 && (
        <Text style={styles.hint}>打贏第{STAGE_COUNT}關的大魔王完成第一輪輪迴,輪迴次數才會開始累積。</Text>
      )}
      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>分享生涯總覽</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 10,
  },
  statList: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: '#8a8a95',
    fontSize: 12,
  },
  statValue: {
    color: '#f2f2f2',
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  shareButton: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#c9a94f',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#1c1c24',
    fontSize: 13,
    fontWeight: '700',
  },
});
