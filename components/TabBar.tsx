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
        // 技能分頁在學生期就算等級已經到了 Lv5(TAB_UNLOCK_LEVELS.skill),還是被 hasChosenJob
        // 多擋一層,這時候顯示「Lv5」會誤導(看起來應該解鎖了卻沒有),改顯示畢業門檻。
        const lockedBySkillGraduation = tab.id === 'skill' && level >= unlockLevel && !hasChosenJob;
        const lockedLabel = lockedBySkillGraduation ? '畢業解鎖' : `Lv${unlockLevel}`;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, active && styles.tabActive, !unlocked && styles.tabLocked]}
            onPress={() => {
              if (!unlocked) {
                showToast(lockedBySkillGraduation ? `選定主職畢業後才能解鎖「${tab.label}」` : `Lv${unlockLevel} 解鎖「${tab.label}」`);
                return;
              }
              onSelect(tab.id);
            }}
          >
            <View style={styles.iconBox}>
              <PixelSprite frame={frame} palette={palette} pixelSize={tab.iconPixelSize ?? 3} />
            </View>
            <Text style={styles.label}>{unlocked ? tab.label : lockedLabel}</Text>
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
