import { Fragment } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { isTabUnlocked, tabUnlockLevel } from '../game/onboarding';
import { getTabIcon } from '../game/sprites/tabIcons';
import { TabAttentionFlags } from '../game/tabAttention';
import { useToast } from '../hooks/useToast';
import { PanelTab } from './panelTabs';
import { PixelSprite } from './PixelSprite';
import { TAB_ICON_ART, TAB_LOCK_ICON } from './tabIconArt';

interface TabBarProps {
  tabs: PanelTab[];
  activeId: string;
  level: number;
  hasChosenJob: boolean;
  attention: TabAttentionFlags;
  onSelect: (id: string) => void;
}

export function TabBar({ tabs, activeId, level, hasChosenJob, attention, onSelect }: TabBarProps) {
  const showToast = useToast((state) => state.show);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const { frame, palette } = getTabIcon(tab.icon);
        const active = tab.id === activeId;
        const unlockLevel = tabUnlockLevel(tab.id);
        const unlocked = isTabUnlocked(tab.id, level, hasChosenJob);
        // 鎖住的分頁原本只標等級數字,不知道解鎖了是什麼——圖示本來就有畫(只是靠 tabLocked
        // 的透明度降低變暗示意),名字也一起露出來,玩家才知道在等待什麼、值不值得去衝等級。
        const lockedLabel = `${tab.label}\nLv${unlockLevel}`;
        // 已解鎖才顯示提醒角標——鎖住的分頁本來就有 Lv 門檻字樣提示,不用重複疊加。
        const showDot = unlocked && (attention[tab.id as keyof TabAttentionFlags] ?? false);
        // 轉生是Lv50後期限定內容,跟前面7個常駐分頁性質不同(破完一輪3000關才有意義),
        // 加一條細分隔線區隔開,不用真的拆掉獨立分頁或減少分頁數。
        return (
          <Fragment key={tab.id}>
            {tab.id === 'ascension' && <View style={styles.divider} />}
            <Pressable
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                active && { borderColor: tab.accentColor, shadowColor: tab.accentColor },
                pressed && styles.tabPressed,
                !unlocked && styles.tabLocked,
              ]}
              onPress={() => {
                if (!unlocked) {
                  showToast(`Lv${unlockLevel} 解鎖「${tab.label}」`);
                  return;
                }
                onSelect(tab.id);
              }}
            >
              <View style={styles.iconBox}>
                {TAB_ICON_ART[tab.id] ? (
                  <Image source={TAB_ICON_ART[tab.id]} style={styles.iconArt} resizeMode="contain" />
                ) : (
                  <PixelSprite frame={frame} palette={palette} pixelSize={3} />
                )}
                {showDot && <View style={styles.attentionDot} />}
                {!unlocked && <Image source={TAB_LOCK_ICON} style={styles.lockIcon} resizeMode="contain" />}
              </View>
              <Text style={styles.label} numberOfLines={unlocked ? 1 : 2}>
                {unlocked ? tab.label : lockedLabel}
              </Text>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 強化/鑲嵌收進裝備分頁的子分頁、背包又拆成獨立項目後,目前固定就是6個頂層分頁——
  // 不再用可以左右滑動的 ScrollView(手勢很容易被誤以為頁面卡住,右邊幾顆容易被忽略),
  // 改成每顆等寬平分整排寬度(flex:1),6顆一次全部平鋪在畫面上,不需要滑動就能看到全部。
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 3,
    paddingHorizontal: 4,
    width: '100%',
  },
  divider: {
    width: 1,
    marginVertical: 6,
    backgroundColor: '#59462b',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2a2432',
    // 固定佔位的邊框:啟用時邊框顏色換成該分頁的識別色(見 accentColor),沒有這個
    // 佔位的話啟用/取消瞬間會因為邊框從0變2px而讓按鈕尺寸跳動。平常是低調的青銅色邊框
    // (呼應參考圖的「主框架」色),不是完全透明——沒選取的分頁也要看得出是個「畫好框的按鈕」。
    borderWidth: 2,
    borderColor: '#4a3f30',
  },
  // 按下瞬間的回饋(參考圖「按下 PRESSED」狀態):背景再壓暗一階,純視覺回饋不用額外邏輯,
  // Pressable 的 pressed 參數是 RN 內建能力。
  tabPressed: {
    backgroundColor: '#1c1922',
  },
  // 固定高度讓不同 pixelSize 的圖示(裝備/技能放大、圖鑑縮小)都能置中,
  // 底下的文字標籤才會對齊同一條線,不會因圖示大小不同而高低不一。
  iconBox: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconArt: {
    width: 32,
    height: 32,
  },
  lockIcon: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  // 提醒角標:掛在圖示右上角的小紅點,只表示「這個分頁有事可做」,不帶數字——
  // 數字會逼玩家去對帳(算出來的角標值跟玩家腦中的計算不一致時反而變成困惑來源),
  // 純粹的「有/沒有」訊號對放置遊戲的分頁導覽來說已經夠用。
  attentionDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0503a',
    borderWidth: 1,
    borderColor: '#17171f',
  },
  // 選取狀態(參考圖「選取 SELECTED」):除了邊框換成識別色,外加一圈同色發光陰影——
  // shadowColor 在 iOS/web 生效,elevation 是 Android 的等效寫法,兩個都給才能跨平台一致。
  tabActive: {
    backgroundColor: '#3d3450',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  tabLocked: {
    opacity: 0.4,
  },
  label: {
    color: '#f2f2f2',
    fontSize: 9,
    textAlign: 'center',
  },
});
