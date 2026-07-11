import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isTabUnlocked, tabUnlockLevel } from '../game/onboarding';
import { getTabIcon } from '../game/sprites/tabIcons';
import { TabAttentionFlags } from '../game/tabAttention';
import { useToast } from '../hooks/useToast';
import { PanelTab } from './panelTabs';
import { PixelSprite } from './PixelSprite';

interface TabBarProps {
  tabs: PanelTab[];
  activeId: string;
  level: number;
  hasChosenJob: boolean;
  attention: TabAttentionFlags;
  onSelect: (id: string) => void;
}

export function TabBar({ tabs, activeId, level, hasChosenJob, attention, onSelect }: TabBarProps) {
  const showToast = useToast((state) => state.show);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const { frame, palette } = getTabIcon(tab.icon);
        const active = tab.id === activeId;
        const unlockLevel = tabUnlockLevel(tab.id);
        const unlocked = isTabUnlocked(tab.id, level, hasChosenJob);
        const lockedLabel = `Lv${unlockLevel}`;
        // 已解鎖才顯示提醒角標——鎖住的分頁本來就有 Lv 門檻字樣提示,不用重複疊加。
        const showDot = unlocked && (attention[tab.id as keyof TabAttentionFlags] ?? false);
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, active && styles.tabActive, !unlocked && styles.tabLocked]}
            onPress={() => {
              if (!unlocked) {
                showToast(`Lv${unlockLevel} 解鎖「${tab.label}」`);
                return;
              }
              onSelect(tab.id);
            }}
          >
            <View style={styles.iconBox}>
              <PixelSprite frame={frame} palette={palette} pixelSize={4} />
              {showDot && <View style={styles.attentionDot} />}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {unlocked ? tab.label : lockedLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 強化/鑲嵌收進裝備分頁的子分頁、背包又拆成獨立項目後,目前固定就是6個頂層分頁——
  // 不再用可以左右滑動的 ScrollView(手勢很容易被誤以為頁面卡住,右邊幾顆容易被忽略),
  // 改成每顆等寬平分整排寬度(flex:1),6顆一次全部平鋪在畫面上,不需要滑動就能看到全部。
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 3,
    paddingHorizontal: 4,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
  },
  // 固定高度讓不同 pixelSize 的圖示(裝備/技能放大、圖鑑縮小)都能置中,
  // 底下的文字標籤才會對齊同一條線,不會因圖示大小不同而高低不一。
  iconBox: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 提醒角標:掛在圖示右上角的小紅點,只表示「這個分頁有事可做」,不帶數字——
  // 數字會逼玩家去對帳(算出來的角標值跟玩家腦中的計算不一致時反而變成困惑來源),
  // 純粹的「有/沒有」訊號對放置遊戲的分頁導覽來說已經夠用。
  attentionDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0503a',
    borderWidth: 1,
    borderColor: '#17171f',
  },
  tabActive: {
    backgroundColor: '#4a4456',
  },
  tabLocked: {
    opacity: 0.4,
  },
  label: {
    color: '#f2f2f2',
    fontSize: 9,
    textAlign: 'center',
  },
});
