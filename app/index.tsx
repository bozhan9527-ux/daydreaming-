import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BattleScene } from '../components/BattleScene';
import { EquippedItemsStrip } from '../components/EquippedItemsStrip';
import { EventIcon } from '../components/EventIcon';
import { ExpBar } from '../components/ExpBar';
import { MainVisual } from '../components/MainVisual';
import { PANEL_TABS } from '../components/panelTabs';
import { ResourceBar } from '../components/ResourceBar';
import { SkillTracker } from '../components/SkillTracker';
import { TabBar } from '../components/TabBar';
import { ToastHost } from '../components/Toast';
import { TopResourceBar } from '../components/TopResourceBar';
import { getCompanionById } from '../game/companions';
import { canClaimDailyQuest, DAILY_QUEST_KILL_TARGET } from '../game/daily';
import { getItemById } from '../game/equipment';
import { canLevelUp, expToNext, levelsAvailable, MAX_LEVEL } from '../game/leveling';
import { newlyUnlockedTabs } from '../game/onboarding';
import { Rarity } from '../game/trigger';
import { useBattleLoop } from '../hooks/useBattleLoop';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

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
  const lastDailyLoginBonus = useGameState((state) => state.lastDailyLoginBonus);
  const dailyKillCount = useGameState((state) => state.dailyKillCount);
  const dailyQuestClaimed = useGameState((state) => state.dailyQuestClaimed);
  const claimDailyQuest = useGameState((state) => state.claimDailyQuest);

  const [openTabId, setOpenTabId] = useState<string | null>(null);
  const openTab = PANEL_TABS.find((tab) => tab.id === openTabId) ?? null;
  // 離線收益改成彈出視窗,關掉之後這次 session 就不再自動彈出(下次 load()重新設定 lastOfflineKills 時才會再跳)。
  const [offlineModalDismissed, setOfflineModalDismissed] = useState(false);
  const [dailyBonusModalDismissed, setDailyBonusModalDismissed] = useState(false);

  useBattleLoop();

  // 追蹤玩家這次 session 裡等級有沒有跨過某個分頁的解鎖門檻,跨過就跳提示——
  // previousLevelRef 在第一次load完成時才取樣,避免老玩家重新整理頁面時被誤判成「剛解鎖」而狂跳提示。
  const showToast = useToast((state) => state.show);
  const previousLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (previousLevelRef.current === null) {
      previousLevelRef.current = level.level;
      return;
    }
    const unlocked = newlyUnlockedTabs(previousLevelRef.current, level.level);
    if (unlocked.length > 0) {
      const names = unlocked.map((id) => PANEL_TABS.find((tab) => tab.id === id)?.label).filter(Boolean).join('、');
      showToast(`解鎖新分頁:${names}`);
    }
    previousLevelRef.current = level.level;
  }, [isLoaded, level.level, showToast]);

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
  const showDailyBonusModal = lastDailyLoginBonus !== null && !dailyBonusModalDismissed;
  const canClaimQuest = canClaimDailyQuest(dailyKillCount, dailyQuestClaimed);
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
    <View style={styles.root}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* 彩蛋反應放最上面,一進畫面就看得到觸發結果。 */}
      <View style={styles.resultBox}>
        {lastEvent !== null ? (
          <>
            <EventIcon rarity={lastEvent.rarity} />
            <Text style={styles.resultRarity}>{RARITY_LABEL[lastEvent.rarity]}</Text>
            <Text style={styles.resultText} numberOfLines={2} ellipsizeMode="tail">
              {lastEvent.payload}
            </Text>
          </>
        ) : (
          <Text style={styles.resultRarity}>點擊勇者觸發反應</Text>
        )}
      </View>

      <TopResourceBar level={level.level} coins={coins} />
      <Text style={styles.title}>勇者發呆中</Text>

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

        <ExpBar level={level.level} bankedExp={level.bankedExp} needed={needed} isMaxLevel={isMaxLevel} levelsAvailable={availableLevels} />

        {/* 升級按鈕緊跟在經驗條後面,看到「可升N級」可以馬上按,不用再滑到畫面最下面——
            原本放在Tab列之後、跨過整個分頁按鈕區,操作路徑被拉斷。 */}
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

        <ResourceBar />

        {/* 已裝備道具縮圖列:9插槽一次看完裝了什麼/幾級/有沒有強化,不用切去「裝備」分頁。 */}
        <EquippedItemsStrip />

        {/* 每日任務:輕量的一行進度+領取按鈕,不開新分頁、不加彈窗,達標前只是安靜顯示進度。 */}
        <View style={styles.dailyQuestRow}>
          <Text style={styles.dailyQuestText}>
            {dailyQuestClaimed ? '今日任務已領取' : `今日任務:擊敗怪物 ${Math.min(dailyKillCount, DAILY_QUEST_KILL_TARGET)}/${DAILY_QUEST_KILL_TARGET}`}
          </Text>
          {!dailyQuestClaimed && (
            <Pressable
              style={[styles.dailyQuestButton, !canClaimQuest && styles.dailyQuestButtonDisabled]}
              onPress={() => claimDailyQuest()}
              disabled={!canClaimQuest}
            >
              <Text style={styles.dailyQuestButtonLabel}>領取</Text>
            </Pressable>
          )}
        </View>

        <TabBar tabs={PANEL_TABS} activeId={openTabId ?? ''} level={level.level} onSelect={setOpenTabId} />
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

      <Modal visible={showDailyBonusModal} animationType="fade" transparent onRequestClose={() => setDailyBonusModalDismissed(true)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDailyBonusModalDismissed(true)} />
        <View style={styles.offlineModalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>每日登入獎勵</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setDailyBonusModalDismissed(true)}>
              <Text style={styles.modalCloseLabel}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.offlineModalText}>
            歡迎回來!獲得 {lastDailyLoginBonus?.exp} 經驗、{lastDailyLoginBonus?.coins} 金幣
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
      </Modal>
    </ScrollView>

    {/* Toast 提示(分頁鎖定提示/新分頁解鎖公告)要在主畫面就能跳出來,不能只綁在分頁 Modal 底下——
        跟 ScrollView 同層放在共用的 flex:1 root 裡,不會被捲動帶走,也不會像 Modal 那樣疊出
        一層擋住底下按鈕點擊的全螢幕 wrapper。 */}
    <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  // 不會因為內容不同把下面的技能列/經驗條往下推。降到2行文字上限,配合縮小後的高度。
  resultBox: {
    width: '100%',
    maxWidth: 280,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  resultRarity: {
    color: '#8a8a95',
    fontSize: 11,
  },
  resultText: {
    color: '#f2f2f2',
    fontSize: 12,
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
  dailyQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dailyQuestText: {
    color: '#c9c9d2',
    fontSize: 11,
  },
  dailyQuestButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#c9a94f',
  },
  dailyQuestButtonDisabled: {
    opacity: 0.35,
  },
  dailyQuestButtonLabel: {
    color: '#17171f',
    fontSize: 11,
    fontWeight: '600',
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
