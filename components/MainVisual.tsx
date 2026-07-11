import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getCurrentTier } from '../game/combat';
import { getJobBackdropColor, getJobBackground } from '../game/sprites/backgrounds';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

// 主視覺(角色戰鬥場景的背景圖)延伸到下面的按鈕選項區:不再只包住 BattleScene 那一小塊,
// 而是把 BattleScene/技能追蹤條/統計文字/分頁按鈕全部包在同一張背景圖裡面。
// EXTENDED_ROWS 給的圖夠蓋掉這些內容常見的高度,超出的部分交給外層 View 的純色
// backgroundColor(跟圖片最底部同色)接住,不會露出明顯接縫,也不用去猜每個裝置實際疊出來多高。
const BACKGROUND_PIXEL_SIZE = 8;
const EXTENDED_ROWS = 48;

interface MainVisualProps {
  children: ReactNode;
}

export function MainVisual({ children }: MainVisualProps) {
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const stageProgress = useGameState((state) => state.stageProgress);

  const tier = getCurrentTier(level.level);
  const background = getJobBackground(job.archetype, job.branch, tier, EXTENDED_ROWS);
  const backdropColor = getJobBackdropColor(job.archetype, job.branch, tier);

  return (
    <View style={[styles.wrap, { backgroundColor: backdropColor }]}>
      <View style={styles.backgroundLayer}>
        <PixelSprite frame={background.frame} palette={background.palette} pixelSize={BACKGROUND_PIXEL_SIZE} />
      </View>

      <Text style={styles.stageLabel}>
        第 {stageProgress.stage} 關 - 第 {stageProgress.subStage} 小關
      </Text>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    paddingTop: 4,
    paddingBottom: 16,
  },
  backgroundLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
  },
  stageLabel: {
    textAlign: 'center',
    color: '#f2f2f2',
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    marginBottom: 4,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
});
