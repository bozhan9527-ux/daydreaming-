import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isTabUnlocked, tabUnlockLevel } from '../game/onboarding';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';
import { JobSelector } from './JobSelector';
import { SkillPanel } from './SkillPanel';

type HostView = 'job' | 'skill';

const HOST_VIEWS: { id: HostView; label: string }[] = [
  { id: 'job', label: '職業' },
  { id: 'skill', label: '技能' },
];

// 「技能」原本是獨立頂層分頁(Lv5解鎖),併進「職業」分頁當子分頁——職業分頁本身Lv1就開放,
// 併進來之後子分頁層級要繼續套用技能原本的 Lv5 門檻(不因為併進職業分頁就提早開放),鎖住時
// 點擊給跟原本 TabBar 一樣的提示 toast。
export function JobTab() {
  const [hostView, setHostView] = useState<HostView>('job');
  const level = useGameState((state) => state.level.level);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const showToast = useToast((state) => state.show);

  const skillUnlocked = isTabUnlocked('skill', level, hasChosenJob);
  const skillUnlockLevel = tabUnlockLevel('skill');

  function handleSelect(view: HostView) {
    if (view === 'skill' && !skillUnlocked) {
      showToast(`Lv${skillUnlockLevel} 解鎖「技能」`);
      return;
    }
    setHostView(view);
  }

  const showSkillPanel = hostView === 'skill' && skillUnlocked;

  return (
    <View style={styles.container}>
      <View style={styles.hostNav}>
        {HOST_VIEWS.map((view) => {
          const locked = view.id === 'skill' && !skillUnlocked;
          return (
            <Pressable
              key={view.id}
              style={[
                styles.hostNavButton,
                hostView === view.id && !locked && styles.hostNavButtonActive,
                locked && styles.hostNavButtonLocked,
              ]}
              onPress={() => handleSelect(view.id)}
            >
              <Text style={styles.hostNavLabel}>{locked ? `${view.label}(Lv${skillUnlockLevel})` : view.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {showSkillPanel ? <SkillPanel /> : <JobSelector />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 6,
  },
  hostNav: {
    flexDirection: 'row',
    gap: 6,
  },
  hostNavButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#59462b',
    alignItems: 'center',
  },
  // 選取中的子分頁統一用藍色(#6ab0e0)訊號色,金色專門留給裝飾性外框。
  hostNavButtonActive: {
    backgroundColor: '#3d3450',
    borderColor: '#6ab0e0',
  },
  hostNavButtonLocked: {
    opacity: 0.5,
  },
  hostNavLabel: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '700',
  },
});
