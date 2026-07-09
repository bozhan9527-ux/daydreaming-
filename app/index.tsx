import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BattleScene } from '../components/BattleScene';
import { EventIcon } from '../components/EventIcon';
import { ExpBar } from '../components/ExpBar';
import { MainVisual } from '../components/MainVisual';
import { PANEL_TABS } from '../components/panelTabs';
import { SkillTracker } from '../components/SkillTracker';
import { TabBar } from '../components/TabBar';
import { ToastHost } from '../components/Toast';
import { getCompanionById } from '../game/companions';
import { getItemById } from '../game/equipment';
import { canLevelUp, expToNext, levelsAvailable, MAX_LEVEL } from '../game/leveling';
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
  const lastEquipmentDropId = useGameState((state) => state.lastEquipmentDropId);
  const lastCoinWindfall = useGameState((state) => state.lastCoinWindfall);

  const [openTabId, setOpenTabId] = useState<string | null>(null);
  const openTab = PANEL_TABS.find((tab) => tab.id === openTabId) ?? null;
  // 離線收益改成彈出視窗,關掉之後這次 session 就不再自動彈出(下次 load()重新設定 lastOfflineKills 時才會再跳)。
  const [offlineModalDismissed, setOfflineModalDismissed] = useState(false);

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
  // 已存的經驗值不夠升1級時,三顆按鈕都該直接disable,不然點了沒反應,玩家會以為壞了。
  const canLevel = !isMaxLevel && canLevelUp(level);
  const availableLevels = isMaxLevel ? 0 : levelsAvailable(level);
  const showOfflineModal = lastOfflineKills > 0 && !offlineModalDismissed;
  const equipmentDropItem = lastEquipmentDropId ? getItemById(lastEquipmentDropId) : undefined;

  // 三種掉落通知(裝備/寵物/金幣)同一時間最多只顯示一則,固定高度的區塊,
  // 不會因為運氣好連續觸發就疊出好幾行、把下面的經驗條跟分頁按鈕往下推。
  // 優先序:裝備 > 寵物 > 金幣(裝備/寵物是解鎖類的稀有事件,比金幣windfall更值得被看到)。
  const dropBannerText = equipmentDropItem
    ? `撿到裝備掉落:${equipmentDropItem.name}!已自動解鎖,可以到「裝備」分頁裝備`
    : lastCompanionDropId
      ? `意外獲得了新夥伴:${getCompanionById(lastCompanionDropId)?.name}!已自動解鎖,可以到「寵物坐騎」分頁裝備`
      : lastCoinWindfall !== null
        ? `意外之財!多撿到 ${lastCoinWindfall} 金幣`
        : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>勇者發呆中</Text>

      <View style={styles.resultBox}>
        {lastEvent !== null ? (
          <>
            <EventIcon rarity={lastEvent.rarity} />
            <Text style={styles.resultRarity}>{RARITY_LABEL[lastEvent.rarity]}</Text>
            <Text style={styles.resultText} numberOfLines={3} ellipsizeMode="tail">
              {lastEvent.payload}
            </Text>
          </>
        ) : (
          <Text style={styles.resultRarity}>點擊勇者觸發反應</Text>
        )}
      </View>

      <MainVisual>
        <BattleScene />

        <SkillTracker />

        <Text style={styles.killCountText}>已擊敗 {killCount} 隻怪</Text>

        <View style={styles.dropBannerBox}>
          {dropBannerText && (
            <Text style={styles.companionDropText} numberOfLines={2}>
              {dropBannerText}
            </Text>
          )}
        </View>

        <ExpBar level={level.level} bankedExp={level.bankedExp} needed={needed} isMaxLevel={isMaxLevel} coins={coins} levelsAvailable={availableLevels} />

        <TabBar tabs={PANEL_TABS} activeId={openTabId ?? ''} onSelect={setOpenTabId} />
      </MainVisual>

      <Modal visible={showOfflineModal} animationType="fade" transparent onRequestClose={() => setOfflineModalDismissed(true)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOfflineModalDismissed(true)} />
        <View style={styles.offlineModalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>離線收益</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setOfflineModalDismissed(true)}>
              <Text style={styles.modalCloseLabel}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.offlineModalText}>
            離線期間擊敗了 {lastOfflineKills} 隻怪,{'\n'}獲得 {lastOfflineGain} 經驗、{lastOfflineCoins} 金幣
          </Text>
        </View>
      </Modal>

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
        <Pressable style={[styles.levelUpButton, !canLevel && styles.levelUpButtonDisabled]} onPress={() => levelUp(1)} disabled={!canLevel}>
          <Text style={styles.levelUpLabel}>升 1 級</Text>
        </Pressable>
        <Pressable style={[styles.levelUpButton, !canLevel && styles.levelUpButtonDisabled]} onPress={() => levelUp(5)} disabled={!canLevel}>
          <Text style={styles.levelUpLabel}>升 5 級</Text>
        </Pressable>
        <Pressable style={[styles.levelUpButton, !canLevel && styles.levelUpButtonDisabled]} onPress={() => levelUp(10)} disabled={!canLevel}>
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
  killCountText: {
    color: '#f2f2f2',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  companionDropText: {
    color: '#e8c25a',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  // 固定高度:三種掉落通知(裝備/寵物/金幣)同一時間只顯示一則,不管有沒有內容都佔用
  // 同樣的空間,避免連續觸發時疊出好幾行、把下面的經驗條跟分頁按鈕往下推。
  dropBannerBox: {
    height: 44,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 固定高度+置中,不管有沒有觸發到事件、文案長短,這個區塊佔的空間都一樣,
  // 不會因為內容不同把下面的遊戲畫面往下推。
  resultBox: {
    width: '100%',
    maxWidth: 280,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
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
  // 銀行經驗值不夠升1級時視覺變暗,搭配 disabled 一起用,不然按鈕看起來能按、按了卻沒反應。
  levelUpButtonDisabled: {
    opacity: 0.4,
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
  // 離線收益改成置中卡片式彈窗(不是從下滑入的分頁 Modal 樣式),關掉就不佔用版面空間。
  offlineModalCard: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    transform: [{ translateY: -80 }],
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: '#17171f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a3a45',
  },
  offlineModalText: {
    color: '#c9a94f',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
