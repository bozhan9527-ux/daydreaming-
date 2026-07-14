import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BattleScene } from '../components/BattleScene';
import { CareerOverviewPanel } from '../components/CareerOverviewPanel';
import { DailyQuestBadge } from '../components/DailyQuestBadge';
import { LimitedEventBanner } from '../components/LimitedEventBanner';
import { SettingsButton } from '../components/SettingsButton';
import { WelcomeModal } from '../components/WelcomeModal';
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
import { getCurrentTier } from '../game/combat';
import { getCompanionById } from '../game/companions';
import { getItemById } from '../game/equipment';
import { canLevelUp, expToNext, levelsAvailable, MAX_LEVEL } from '../game/leveling';
import { newlyUnlockedTabs } from '../game/onboarding';
import { computeTabAttentionFlags } from '../game/tabAttention';
import { TRANSFER_FRAGMENT_NAMES, TRANSFER_FRAGMENTS_PER_PROOF } from '../game/transfer';
import { useBattleLoop } from '../hooks/useBattleLoop';
import { useGameState } from '../hooks/useGameState';
import { useMusicUnlock } from '../hooks/useMusicUnlock';
import { useToast } from '../hooks/useToast';

export default function HomeScreen() {
  const isLoaded = useGameState((state) => state.isLoaded);
  const level = useGameState((state) => state.level);
  const levelUp = useGameState((state) => state.levelUp);
  const lastOfflineGain = useGameState((state) => state.lastOfflineGain);
  const lastOfflineKills = useGameState((state) => state.lastOfflineKills);
  const lastOfflineCoins = useGameState((state) => state.lastOfflineCoins);
  const stageProgress = useGameState((state) => state.stageProgress);
  const hasSeenWelcome = useGameState((state) => state.hasSeenWelcome);
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
  const job = useGameState((state) => state.job);
  const equipment = useGameState((state) => state.equipment);
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const skillBooks = useGameState((state) => state.skillBooks);
  const gemCounts = useGameState((state) => state.gemCounts);
  const skillTree = useGameState((state) => state.skillTree);
  const studentSkillTree = useGameState((state) => state.studentSkillTree);
  const companionGear = useGameState((state) => state.companionGear);
  const dungeon = useGameState((state) => state.dungeon);
  const transferProofs = useGameState((state) => state.transferProofs);
  const unlockedAchievementIds = useGameState((state) => state.unlockedAchievementIds);
  const claimedAchievementIds = useGameState((state) => state.claimedAchievementIds);

  const [openTabId, setOpenTabId] = useState<string | null>(null);
  const openTab = PANEL_TABS.find((tab) => tab.id === openTabId) ?? null;
  // 離線收益改成彈出視窗,關掉之後這次 session 就不再自動彈出(下次 load()重新設定 lastOfflineKills 時才會再跳)。
  const [offlineModalDismissed, setOfflineModalDismissed] = useState(false);
  const [dailyBonusModalDismissed, setDailyBonusModalDismissed] = useState(false);
  const [showCareerOverview, setShowCareerOverview] = useState(false);

  useBattleLoop();
  useMusicUnlock();

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

  // 掉落通知疊在彩蛋框正下方,顯示1秒後自動消失,不佔用主畫面固定高度、也不跟畫面最下面的
  // 全域 toast(分頁鎖定提示等)搶同一個位置。killCount 每次擊殺成功才會變(戰敗不算,見
  // game/heroHealth.ts),用它當「這次擊殺剛結算」的觸發點,避免同一個 dropBannerText 值
  // 在無關的重渲染時重複跳出來。
  const [stageDropBanner, setStageDropBanner] = useState<string | null>(null);
  const previousKillCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (previousKillCountRef.current === null) {
      previousKillCountRef.current = killCount;
      return;
    }
    if (killCount !== previousKillCountRef.current && dropBannerText) {
      setStageDropBanner(dropBannerText);
      const timer = setTimeout(() => setStageDropBanner(null), 1000);
      previousKillCountRef.current = killCount;
      return () => clearTimeout(timer);
    }
    previousKillCountRef.current = killCount;
  }, [isLoaded, killCount, dropBannerText]);

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
  // 新手歡迎彈窗(見 WelcomeModal.tsx)優先權最高——沒看過之前不能讓離線收益/每日登入獎勵
  // 這兩個彈窗疊上去搶焦點(全新存檔常常兩個條件同時成立,疊出來的畫面會擋住歡迎彈窗的按鈕)。
  const showOfflineModal = hasSeenWelcome && lastOfflineKills > 0 && !offlineModalDismissed;
  const showDailyBonusModal = hasSeenWelcome && lastDailyLoginBonus !== null && !dailyBonusModalDismissed;

  // 跨分頁提醒角標(見 game/tabAttention.ts):判斷每個分頁圖示要不要顯示小紅點,
  // 純函式計算,不需要另外存進 state。
  const tabAttention = computeTabAttentionFlags({
    hasChosenJob,
    level: level.level,
    coins,
    transferProofs,
    equipment,
    enhanceStones,
    gemCounts,
    jobTier: getCurrentTier(level.level),
    activeSkillLevels: hasChosenJob ? skillTree[job.archetype] : studentSkillTree,
    skillBooks,
    companionGear,
    dungeon,
    unlockedAchievementIds,
    claimedAchievementIds,
  });

  return (
    <View style={styles.root}>
    {/* 整頁內容量已經壓到單一手機螢幕塞得下、正常情況不需要滑動,但外層還是要用 ScrollView
        (不能改回純 View)——Expo Web 預設把 body 設成 overflow:hidden,所有捲動都要靠 App
        內部某個 ScrollView 承接,拿掉它會連瀏覽器原生的「下拉刷新」手勢都一起失效
        (瀏覽器判斷能不能下拉刷新是看「手指底下那個可捲動元素」的捲動狀態,body 不能捲、
        又沒有 ScrollView 可以承接時,等於整頁沒有任何東西吃得到那個手勢)。 */}
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* 頂部資源列放最上面,一眼就看得到等級/金幣,不用往下找。 */}
      <TopResourceBar
        level={level.level}
        coins={coins}
        skillBooks={skillBooks}
        onPressLevel={() => setShowCareerOverview(true)}
      />

      {/* 彩蛋反應框縮小+加外框+改橫向排版——原本100px高、直向堆疊圖示+兩行文字,縮到46px高
          時圖示本身(48px)就已經比整個框還高,彩蛋內容直接被裁掉看不見。改成「圖示在左、
          文字在右」橫向排版,把省下來的高度預算換成寬度(這裡不缺寬度),圖示縮小一點但
          完整露出來,文字維持看得到。不再額外顯示「一般反應/稀有畫面/...」這行分類標籤——
          圖示本身(EventIcon 依 rarity 換色)已經傳達稀有度,拿掉這行讓彩蛋文字能多占一行。 */}
      <View style={styles.resultBoxWrap}>
        <View style={styles.resultBox}>
          {lastEvent !== null ? (
            <>
              <View style={styles.resultIconWrap}>
                <EventIcon rarity={lastEvent.rarity} pixelSize={3} />
              </View>
              <View style={styles.resultTextCol}>
                <Text style={styles.resultText} numberOfLines={3} ellipsizeMode="tail">
                  {lastEvent.payload}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.resultRarity}>點擊勇者觸發反應</Text>
          )}
        </View>

        {/* 掉落通知(裝備/轉職碎片/寵物/金幣)疊在彩蛋框正下方,顯示1秒後自動消失——用絕對定位
            掛在 resultBoxWrap 底下,不會把下面的關卡卡片往下推、也不會蓋住戰鬥畫面裡的怪物。 */}
        {stageDropBanner && (
          <View style={styles.dropBannerOverlay} pointerEvents="none">
            <Text style={styles.dropBannerText} numberOfLines={2}>
              {stageDropBanner}
            </Text>
          </View>
        )}
      </View>

      <MainVisual>
        <BattleScene />

        <HeroHealthBar />

        <SkillTracker />

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

        <TabBar
          tabs={PANEL_TABS}
          activeId={openTabId ?? ''}
          level={level.level}
          hasChosenJob={hasChosenJob}
          attention={tabAttention}
          onSelect={setOpenTabId}
        />
      </MainVisual>

      {/* 每日任務改成浮在畫面右側的小徽章,已領取直接消失,不再佔用主畫面高度。 */}
      <DailyQuestBadge />

      {/* 限時活動:浮在畫面左側,跟右側的每日任務徽章對稱——沒有活動進行中(一週7天有4天
          沒有)完全不渲染,不佔用畫面版面。 */}
      <LimitedEventBanner />

      <SettingsButton />
      <WelcomeModal />

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
            離線期間擊敗了 {lastOfflineKills} 隻怪,{'\n'}獲得 {lastOfflineGain} 經驗、{lastOfflineCoins} 金幣{'\n'}
            關卡推進到 第{stageProgress.stage}關‧第{stageProgress.subStage}小關
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

      {/* 生涯總覽:點頂部資源列的Lv.徽章開,不佔用底部8個分頁的名額(見TopResourceBar.tsx的
          設計取捨)。彙整存檔既有的終生數據,不新增追蹤欄位。 */}
      <Modal visible={showCareerOverview} animationType="fade" transparent onRequestClose={() => setShowCareerOverview(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCareerOverview(false)} />
        <View style={styles.offlineModalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>生涯總覽</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setShowCareerOverview(false)}>
              <Text style={styles.modalCloseLabel}>✕</Text>
            </Pressable>
          </View>
          <CareerOverviewPanel />
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
          {/* 標題色+底線套該分頁的識別色(見 panelTabs.tsx 的 accentColor)——8個系統原本
              視覺同質化,除了圖示外分不出「現在在哪個系統裡」,這裡是玩家開分頁第一眼看到
              的東西,加識別色成本最低、辨識度提升最直接。 */}
          <View style={[styles.modalHeader, openTab && { borderBottomColor: openTab.accentColor }]}>
            <Text style={[styles.modalTitle, openTab && { color: openTab.accentColor }]}>{openTab?.label}</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setOpenTabId(null)}>
              <Text style={styles.modalCloseLabel}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            {openTab && <openTab.Component />}
          </ScrollView>
          {/* 分頁列在這裡再放一份:這個 Modal 蓋住主畫面底下那份 TabBar(RN Web 的 Modal 是
              portal 到 document.body 的獨立子樹,主畫面那份雖然還在但被背板擋住摸不到),不放
              這份的話,玩家逛裝備逛到一半想看技能,得先按 X 關掉才能點下一個分頁——這是玩家
              做最頻繁的操作,不該多一次關閉動作。onSelect 一樣接 setOpenTabId,點別的分頁
              直接切換這個 Modal 顯示的內容,不用先關閉。 */}
          <TabBar
            tabs={PANEL_TABS}
            activeId={openTabId ?? ''}
            level={level.level}
            hasChosenJob={hasChosenJob}
            attention={tabAttention}
            onSelect={setOpenTabId}
          />
          {/* RN Web 的 Modal 是直接 portal 到 document.body 的獨立子樹,根層級那個 ToastHost
              (在這個 Modal 開著的時候)疊圖疊不贏這個 portal,所以分頁內觸發的提示(例如轉職道具
              不夠)在這裡再掛一份、當這個 Modal 自己子樹裡最後一個節點,才能真的疊在最上面。
              全域狀態共用同一份 useToast,兩份 ToastHost 不會顯示不同內容,只是各自負責能疊贏
              的那個層級。 */}
          <ToastHost />
        </View>
      </Modal>
    </ScrollView>

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
  scroll: {
    flex: 1,
    backgroundColor: '#0f0f14',
  },
  // 內容量壓在單一手機螢幕塞得下,正常情況不需要滑動,但外層容器維持 ScrollView
  // (見上面 JSX 的註解)——這裡不能加 flex:1,contentContainerStyle 要讓內容照自然高度排列。
  container: {
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
  resultBoxWrap: {
    width: '100%',
    maxWidth: 280,
  },
  resultBox: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a45',
    backgroundColor: 'rgba(28, 28, 36, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  // 掛在彩蛋框正下方的掉落通知,絕對定位不占版面高度,顯示1秒後由 stageDropBanner 變 null
  // 直接消失(卡片本身很短命,沒有另外做淡出動畫的必要)。
  dropBannerOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    zIndex: 10,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 8, 6, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 79, 0.5)',
  },
  dropBannerText: {
    color: '#e8c25a',
    fontSize: 11,
    textAlign: 'center',
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextCol: {
    flexShrink: 1,
    gap: 1,
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
    maxHeight: '90%',
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
