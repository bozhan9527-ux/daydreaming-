import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const ASCENSION_ICON = require('../assets/sprites/ui/icon_tab_ascension.png');

import { isTabUnlocked } from '../game/onboarding';
import { useGameState } from '../hooks/useGameState';
import { AscensionPanel } from './AscensionPanel';

// 轉生原本是頂層分頁,UX覆盤後改成右上角獨立浮動圖示(跟 AchievementBadge 同一套慣例,
// 緊接在它下面),把頂層分頁的位置讓給更常用的「商店」(見 panelTabs.tsx)。轉生本身的
// 玩法/數值/存檔完全不變,只是換個入口——Lv50 才解鎖,平常不需要隨時佔一個分頁位置。
export function AscensionBadge() {
  const level = useGameState((state) => state.level);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const [open, setOpen] = useState(false);

  if (!isTabUnlocked('ascension', level.level, hasChosenJob)) return null;

  return (
    <>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Image source={ASCENSION_ICON} style={styles.icon} resizeMode="contain" />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>轉生</Text>
            <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <AscensionPanel />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 74,
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
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
    borderBottomColor: '#7ad0c8',
  },
  title: {
    color: '#7ad0c8',
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
