import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const ACHIEVEMENT_ICON = require('../assets/sprites/ui/icon_tab_achievement.png');

import { isTabUnlocked } from '../game/onboarding';
import { useGameState } from '../hooks/useGameState';
import { AchievementPanel } from './AchievementPanel';

// 成就系統獨立浮動圖示,跟 SettingsButton(top:8)/DailyQuestBadge(top:74)同一套「浮在
// 畫面角落、不佔用主畫面高度」的既有慣例——插在這兩者中間空出來的 top:41 那段,不用跟
// 任務徽章共用同一塊面板(102筆成就清單塞進短期任務用的小面板會撐爆,見改版前
// DailyQuestBadge.tsx 的教訓),改成完全獨立的圖示+彈出視窗,樣式沿用底部6個分頁
// Modal 的既有寫法(見 app/index.tsx)。
export function AchievementBadge() {
  const level = useGameState((state) => state.level);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const unlockedAchievementIds = useGameState((state) => state.unlockedAchievementIds);
  const claimedAchievementIds = useGameState((state) => state.claimedAchievementIds);
  const [open, setOpen] = useState(false);

  const claimableCount = unlockedAchievementIds.filter((id) => !claimedAchievementIds.includes(id)).length;

  if (!isTabUnlocked('achievement', level.level, hasChosenJob)) return null;

  return (
    <>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Image source={ACHIEVEMENT_ICON} style={styles.icon} resizeMode="contain" />
        {claimableCount > 0 && (
          <View style={styles.claimBadge}>
            <Text style={styles.claimBadgeText}>{claimableCount}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>成就</Text>
            <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <AchievementPanel />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 41,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#59462b',
    zIndex: 20,
  },
  icon: {
    width: 20,
    height: 20,
  },
  claimBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#c9a94f',
    alignItems: 'center',
  },
  claimBadgeText: {
    color: '#1c1c24',
    fontSize: 9,
    fontWeight: '700',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  // 沿用 app/index.tsx 分頁 Modal 的既有樣式(modalSheet/modalHeader/modalBody 那套),
  // 用成就自己的金色識別(呼應成就卡片/生涯總覽既有的金色語彙),不用另外挑一個新的accentColor。
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    backgroundColor: '#17171f',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#c9a94f',
  },
  title: {
    color: '#c9a94f',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeLabel: {
    color: '#8a8a95',
    fontSize: 16,
  },
  body: {
    paddingHorizontal: 16,
  },
  bodyContent: {
    paddingVertical: 12,
    alignItems: 'center',
    paddingBottom: 24,
  },
});
