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
  onSelect: (id: string) => void;
}

export function TabBar({ tabs, activeId, level, onSelect }: TabBarProps) {
  const showToast = useToast((state) => state.show);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const { frame, palette } = getTabIcon(tab.icon);
        const active = tab.id === activeId;
        const unlockLevel = tabUnlockLevel(tab.id);
        const unlocked = isTabUnlocked(tab.id, level);
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
              <PixelSprite frame={frame} palette={palette} pixelSize={tab.iconPixelSize ?? 3} />
            </View>
            <Text style={styles.label}>{unlocked ? tab.label : `Lv${unlockLevel}`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 5,
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
  },
});
