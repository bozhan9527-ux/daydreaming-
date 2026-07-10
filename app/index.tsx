import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BattleScene } from '../components/BattleScene';
import { DailyQuestBadge } from '../components/DailyQuestBadge';
import { EquippedItemsStrip } from '../components/EquippedItemsStrip';
import { EventIcon } from '../components/EventIcon';
import { ExpBar } from '../components/ExpBar';
import { HeroHealthBar } from '../components/HeroHealthBar';
import { MainVisual } from '../components/MainVisual';
import { PANEL_TABS } from '../components/panelTabs';
import { SkillTracker } from '../components/SkillTracker';
import { TabBar } from '../components/TabBar';
import { ToastHost } from '../components/Toast';
import { TopResourceBar } from '../components/TopResourceBar';
import { getCompanionById } from '../game/companions';
import { getItemById } from '../game/equipment';
import { canLevelUp, expToNext, levelsAvailable, MAX_LEVEL } from '../game/leveling';
import { newlyUnlockedTabs } from '../game/onboarding';
import { TRANSFER_FRAGMENT_NAMES, TRANSFER_FRAGMENTS_PER_PROOF } from '../game/transfer';
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
  const lastEvent = useGameState((state) => state.lastEvent);
  const lastCompanionDropId = useGameState((state) => state.lastCompanionDropId);
  const lastEquipmentDropId = useGameState((state) => state.lastEquipmentDropId);
  const lastCoinWindfall = useGameState((state) => state.lastCoinWindfall);
  const lastTransferFragmentArchetype = useGameState((state) => state.lastTransferFragmentArchetype);
  const transferFragments = useGameState((state) => state.transferFragments);
  const lastDailyLoginBonus = useGameState((state) => state.lastDailyLoginBonus);
  const killCount = useGameState((state) => state.killCount);
  const hasChosenJob = useGameState((state) => state.hasChosenJob);

  const [openTabId, setOpenTabId] = useState<string | null>(null);
  const openTab = PANEL_TABS.find((tab) => tab.id === openTabId) ?? null;
  // 離線收益改成彈出視窗,關掉之後這次 session 就不再自動彈出(下次 load()重新設定 lastOfflineKills 時才會再跳)。
  const [offlineModalDismissed, setOfflineModalDismissed] = useState(false);
  const [dailyBonusModalDismissed, setDailyBonusModalDismissed] = useState(false);

  useBattleLoop();

  // 四種掉落通知(裝備/轉職碎片/寵物/金幣)同一時間最多只顯示一則。優先序:裝備 > 轉職碎片 >
  // 寵物 > 金幣(轉職碎片只在打贏大魔王才會掉,比寵物/金幣更值得被看到)。移到 hooks 之前算好,
  // 下面的 useEffect 才能引用到——不能放在 `if (!isLoaded) return` 之後,那樣會違反 hooks 規則。
  const equipmentDropItem = lastEquipmentDropId ? getItemById(lastEquipmentDropId) : undefined;
  const dropBannerText = equipmentDropItem
    ? `撿到裝備掉落:${equipmentDropItem.name}!已自動解鎖,可以到「裝備」分頁裝備`
    : lastTransferFragmentArchetype
      ? `撿到${TRANSFER_FRAGMENT_NAMES[lastTransferFragmentArchetype]}!(${transferFragments[lastTransferFragmentArchetype] ?? 0}/${TRANSFER_FRAGMENTS_PER_PROOF})`
      : lastCompanionDropId
        ? `意外獲得了新夥伴:${getCompanionById(lastCompanionDropId)?.name}!已自動解鎖,可以到「寵物坐騎」分頁裝備`
        : lastCoinWindfall !== null
          ? `意外之財!多撿到 ${lastCoinWindfall} 金幣`
          : null;

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

  // 掉落通知原本是常駐主畫面的固定高度區塊,現在改成 toast 跳出後自動消失——killCount 每次
  // 擊殺成功才會變(戰敗不算,見 game/heroHealth.ts),用它當「這次擊殺剛結算」的觸發點,
  // 避免同一個 dropBannerText 值在無關的重渲染時重複跳 toast。
  const previousKillCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (previousKillCountRef.current === null) {
      previousKillCountRef.current = killCount;
      return;
    }
    if (killCount !== previousKillCountRef.current && dropBannerText) {
      showToast(dropBannerText);
    }
    previousKillCountRef.current = killCount;
  }, [isLoaded, killCount, dropBannerText, showToast]);

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

  return (
    <View style={styles.root}>
    <View style={styles.container}>
      {/* 頂部資源列放最上面,一眼就看得到等級/金幣,不用往下找。 */}
      <TopResourceBar level={level.level} coins={coins} />

      {/* 彩蛋反應框縮小+加外框,不再是又高又空的區塊——原本100px高、沒有邊框,現在收窄
          高度並加一圈卡片邊框,呼應整頁不能滾動的版面限制,騰出來的高度給下面的內容。
          標題「勇者發呆中」拿掉,頂部資源列+彩蛋框已經足夠表明這是首頁,不需要額外重複。 */}
      <View style={styles.resultBox}>
        {lastEvent !== null ? (
          <>
            <EventIcon rarity={lastEvent.rarity} />
            <Text style={styles.resultRarity}>{RARITY_LABEL[lastEvent.rarity]}</Text>
            <Text style={styles.resultText} numberOfLines={1} ellipsizeMode="tail">
              {lastEvent.payload}
            </Text>
          </>
        ) : (
          <Text style={styles.resultRarity}>點擊勇者觸發反應</Text>
        )}
      </View>

      <MainVisual>
        <BattleScene />

        <HeroHealthBar />

        <SkillTracker />

        {/* 掉落通知改用 toast 跳出後自動消失(見上面的 useEffect),不再常駐佔用一個固定高度區塊。 */}

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

        {/* 已裝備道具縮圖列:9插槽一次看完裝了什麼/幾級/有沒有強化,不用切去「裝備」分頁。
            強化石/寶石數量原本在這裡下面常駐一列,現在收進「背包」分頁(見 InventoryPanel.tsx)。 */}
        <EquippedItemsStrip />

        <TabBar tabs={PANEL_TABS} activeId={openTabId ?? ''} level={level.level} hasChosenJob={hasChosenJob} onSelect={setOpenTabId} />
      </MainVisual>

      {/* 每日任務改成浮在畫面右側的小徽章,已領取直接消失,不再佔用主畫面高度。 */}
      <DailyQuestBadge />

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
          {/* RN Web 的 Modal 是直接 portal 到 document.body 的獨立子樹,根層級那個 ToastHost
              (在這個 Modal 開著的時候)疊圖疊不贏這個 portal,所以分頁內觸發的提示(例如轉職道具
              不夠)在這裡再掛一份、當這個 Modal 自己子樹裡最後一個節點,才能真的疊在最上面。
              全域狀態共用同一份 useToast,兩份 ToastHost 不會顯示不同內容,只是各自負責能疊贏
              的那個層級。 */}
          <ToastHost />
        </View>
      </Modal>
    </View>

    {/* Toast 提示(分頁鎖定提示/新分頁解鎖公告)要在主畫面就能跳出來,不能只綁在分頁 Modal 底下——
        跟主畫面內容同層放在共用的 flex:1 root 裡,不會像 Modal 那樣疊出一層擋住底下按鈕點擊的
        全螢幕 wrapper。 */}
    <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f14',
  },
  // 整頁不能滾動(手機螢幕多高,畫面就是多高),container 用 flex:1 撐滿 root、不能再用
  // ScrollView 那種「內容多高就多高」的邏輯——上面每個區塊都要精算過高度預算,加新東西
  // 之前務必先確認總高度沒有超過手機螢幕。
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0f0f14',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    color: '#f2f2f2',
  },
  // 縮小+加外框:原本100px高、沒有邊框的空白區塊,現在收窄高度並加卡片邊框,
  // 騰出來的高度讓整頁能塞進一個手機螢幕不用滾動。
  resultBox: {
    width: '100%',
    maxWidth: 280,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a45',
    backgroundColor: 'rgba(28, 28, 36, 0.6)',
    paddingHorizontal: 10,
  },
  resultRarity: {
    color: '#8a8a95',
    fontSize: 10,
  },
  resultText: {
    color: '#f2f2f2',
    fontSize: 11,
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
  // 分頁內容(裝備/職業/技能...等)自己的容器都有 maxWidth 限制版面寬度,但 ScrollView 的
  // contentContainerStyle 預設橫向對齊是 stretch,maxWidth 生效後內容就會貼著左邊、右側留一大塊
  // 空白,不是真的置中——這裡明確加 alignItems:'center',所有分頁內容才會在較寬的手機/視窗裡
  // 真正置中,不只是「看起來寬度對但偏左」。
  modalBodyContent: {
    alignItems: 'center',
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
