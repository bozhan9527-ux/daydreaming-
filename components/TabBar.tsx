import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isTabUnlocked, tabUnlockLevel } from '../game/onboarding';
import { getTabIcon } from '../game/sprites/tabIcons';
import { useToast } from '../hooks/useToast';
import { PanelTab } from './panelTabs';
import { PixelSprite } from './PixelSprite';

interface TabBarProps {
  tabs: PanelTab[];
  activeId: string;
  level: number;
  hasChosenJob: boolean;
  onSelect: (id: string) => void;
}

export function TabBar({ tabs, activeId, level, hasChosenJob, onSelect }: TabBarProps) {
  const showToast = useToast((state) => state.show);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const { frame, palette } = getTabIcon(tab.icon);
        const active = tab.id === activeId;
        const unlockLevel = tabUnlockLevel(tab.id);
        const unlocked = isTabUnlocked(tab.id, level, hasChosenJob);
        const lockedLabel = `Lv${unlockLevel}`;
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
