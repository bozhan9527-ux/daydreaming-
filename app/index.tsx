import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BattleScene } from '../components/BattleScene';
import { EventIcon } from '../components/EventIcon';
import { ExpBar } from '../components/ExpBar';
import { PANEL_TABS } from '../components/panelTabs';
import { SkillTracker } from '../components/SkillTracker';
import { TabBar } from '../components/TabBar';
import { ToastHost } from '../components/Toast';
import { getCompanionById } from '../game/companions';
import { expToNext, MAX_LEVEL } from '../game/leveling';
import { Rarity } from '../game/trigger';
import { useBattleLoop } from '../hooks/useBattleLoop';
import { useGameState } from '../hooks/useGameState';

const RARITY_LABEL: Record<Rarity, string> = {
  common: '一般反應',
  rare: '稀有畫面',
  epic: '超稀有彩蛋',
  legendary: '傳說事件',
};

export default function HomeScreen() {
  const isLoaded = useGameState((state) => state.isLoaded);
  const level = useGameState((state) => state.level);
  const levelUp = useGameState((state) => state.levelUp);
  const lastOfflineGain = useGameState((state) => state.lastOfflineGain);
  const lastOfflineKills = useGameState((state) => state.lastOfflineKills);
  const lastOfflineCoins = useGameState((state) => state.lastOfflineCoins);
  const coins = useGameState((state) => state.coins);
  const killCount = useGameState((state) => state.killCount);
  const lastEvent = useGameState((state) => state.lastEvent);
  const lastCompanionDropId = useGameState((state) => state.lastCompanionDropId);

  const [openTabId, setOpenTabId] = useState<string | null>(null);
  const openTab = PANEL_TABS.find((tab) => tab.id === openTabId) ?? null;

  useBattleLoop();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>載入中...</Text>
      </View>
    );
  }

  const isMaxLevel = level.level >= MAX_LEVEL;
  const needed = isMaxLevel ? 0 : expToNext(level.level);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>勇者發呆中</Text>

      {lastEvent !== null && (
        <View style={styles.resultBox}>
          <EventIcon rarity={lastEvent.rarity} />
          <Text style={styles.resultRarity}>{RARITY_LABEL[lastEvent.rarity]}</Text>
          <Text style={styles.resultText}>{lastEvent.payload}</Text>
        </View>
      )}

      {lastOfflineKills > 0 && (
        <Text style={styles.offlineGainText}>
          離線期間擊敗了 {lastOfflineKills} 隻怪,獲得 {lastOfflineGain} 經驗 {lastOfflineCoins} 金幣
        </Text>
      )}

      <BattleScene />

      <SkillTracker />

      <Text style={styles.killCountText}>已擊敗 {killCount} 隻怪</Text>

      {lastCompanionDropId && (
        <Text style={styles.companionDropText}>
          意外獲得了新夥伴:{getCompanionById(lastCompanionDropId)?.name}!已自動解鎖,可以到「寵物坐騎」分頁裝備
        </Text>
      )}

      <ExpBar level={level.level} bankedExp={level.bankedExp} needed={needed} isMaxLevel={isMaxLevel} coins={coins} />

      <TabBar tabs={PANEL_TABS} activeId={openTabId ?? ''} onSelect={setOpenTabId} />

      <Modal
        visible={openTab !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setOpenTabId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpenTabId(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{openTab?.label}</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setOpenTabId(null)}>
              <Text style={styles.modalCloseLabel}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            {openTab && <openTab.Component />}
          </ScrollView>
        </View>
        <ToastHost />
      </Modal>

      <View style={styles.levelUpRow}>
        <Pressable style={styles.levelUpButton} onPress={() => levelUp(1)} disabled={isMaxLevel}>
          <Text style={styles.levelUpLabel}>升 1 級</Text>
        </Pressable>
        <Pressable style={styles.levelUpButton} onPress={() => levelUp(5)} disabled={isMaxLevel}>
          <Text style={styles.levelUpLabel}>升 5 級</Text>
        </Pressable>
        <Pressable style={styles.levelUpButton} onPress={() => levelUp(10)} disabled={isMaxLevel}>
          <Text style={styles.levelUpLabel}>升 10 級</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0f0f14',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f14',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#0f0f14',
    gap: 24,
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    color: '#f2f2f2',
  },
  offlineGainText: {
    color: '#c9a94f',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  killCountText: {
    color: '#8a8a95',
    fontSize: 12,
  },
  companionDropText: {
    color: '#e8c25a',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  resultBox: {
    maxWidth: 280,
    alignItems: 'center',
    gap: 4,
  },
  resultRarity: {
    color: '#8a8a95',
    fontSize: 12,
  },
  resultText: {
    color: '#f2f2f2',
    fontSize: 14,
    textAlign: 'center',
  },
  levelUpRow: {
    flexDirection: 'row',
    gap: 12,
  },
  levelUpButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a35',
  },
  levelUpLabel: {
    color: '#f2f2f2',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalSheet: {
    maxHeight: '75%',
    backgroundColor: '#17171f',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: '#3a3a45',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#2a2a35',
  },
  modalTitle: {
    color: '#f2f2f2',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseLabel: {
    color: '#f2f2f2',
    fontSize: 14,
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBodyContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});
