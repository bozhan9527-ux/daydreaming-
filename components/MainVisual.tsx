import { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getCycleCount } from '../game/ascension';
import { getCurrentTier } from '../game/combat';
import { getJobBackdropColor, getJobBackground } from '../game/sprites/backgrounds';
import { useGameState } from '../hooks/useGameState';
import { getBackgroundArt } from './backgroundArt';
import { PixelSprite } from './PixelSprite';

// 主視覺(角色戰鬥場景的背景圖)延伸到下面的按鈕選項區:不再只包住 BattleScene 那一小塊,
// 而是把 BattleScene/技能追蹤條/統計文字/分頁按鈕全部包在同一張背景圖裡面。
// EXTENDED_ROWS 給的圖夠蓋掉這些內容常見的高度,超出的部分交給外層 View 的純色
// backgroundColor(跟圖片最底部同色)接住,不會露出明顯接縫,也不用去猜每個裝置實際疊出來多高。
const BACKGROUND_PIXEL_SIZE = 8;
const EXTENDED_ROWS = 48;

// 有 AI 圖時,AI 圖只蓋「戰鬥場景」這一段視覺高度(跟 BattleScene 的 SCENE_HEIGHT 同量級,
// 130→180後這裡也同步+50調整到186),用 resizeMode="cover" 填滿寬度、裁掉多餘的上下
// (照片原生比例不一定跟畫面吻合)。往下延伸到按鈕區的部分不再用程式紋理延伸,直接用
// backdropColor 純色接住——跟程式版「超出地面就接純色」的設計是同一個道理,只是換成用真的
// 圖來畫「地面以上」那一段而已。
const AI_BACKGROUND_HEIGHT = 186;

interface MainVisualProps {
  children: ReactNode;
}

export function MainVisual({ children }: MainVisualProps) {
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const stageProgress = useGameState((state) => state.stageProgress);
  const totalStagesCleared = useGameState((state) => state.totalStagesCleared);

  const tier = getCurrentTier(level.level);
  const backdropColor = getJobBackdropColor(job.archetype, job.branch, tier, stageProgress.stage);
  const cycleCount = getCycleCount(totalStagesCleared);
  const art = getBackgroundArt(job.archetype, job.branch, tier);
  const background = art ? null : getJobBackground(job.archetype, job.branch, tier, EXTENDED_ROWS, stageProgress.stage);

  return (
    <View style={[styles.wrap, { backgroundColor: backdropColor }]}>
      <View style={styles.backgroundLayer}>
        {art ? (
          <Image
            source={art.source}
            style={{ width: '100%', height: AI_BACKGROUND_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          background && (
            <PixelSprite frame={background.frame} palette={background.palette} pixelSize={BACKGROUND_PIXEL_SIZE} />
          )
        )}
      </View>

      <Text style={styles.stageLabel}>
        第 {stageProgress.stage} 關 - 第 {stageProgress.subStage} 小關 · 第 {cycleCount + 1} 輪
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
    fontSize: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    marginBottom: 4,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
});
