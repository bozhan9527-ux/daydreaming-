import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useGameState } from '../hooks/useGameState';
import { OrnateFrame } from './OrnateFrame';

// 新手引導:原本完全沒有講解核心玩法的畫面,只能靠玩家自己點進各分頁看零散的提示文字——
// 這裡只在真正第一次啟動時彈一次(見 lib/storage.ts 的 hasSeenWelcome,舊存檔遷移時直接
// 補 true,不會打斷老玩家),故意寫得短(4條),不做成多頁 wizard——放置遊戲的核心玩法
// 本來就簡單,長篇教學反而變成另一種要跳過的噪音。
export function WelcomeModal() {
  const isLoaded = useGameState((state) => state.isLoaded);
  const hasSeenWelcome = useGameState((state) => state.hasSeenWelcome);
  const dismissWelcome = useGameState((state) => state.dismissWelcome);

  if (!isLoaded) return null;

  return (
    <Modal visible={!hasSeenWelcome} animationType="fade" transparent onRequestClose={dismissWelcome}>
      <View style={styles.backdrop} />
      <View style={styles.card}>
        <OrnateFrame />
        <Text style={styles.title}>歡迎來到勇者發呆中</Text>
        <View style={styles.stepList}>
          <Text style={styles.step}>① 點擊勇者可以加快戰鬥,不點也會自動迎戰怪物</Text>
          <Text style={styles.step}>② 裝備、技能分頁投資數值,越打越輕鬆</Text>
          <Text style={styles.step}>③ Lv30 畢業,正式選定主職與分支</Text>
          <Text style={styles.step}>④ 下面8個分頁對應不同系統,鎖住的會標示解鎖等級</Text>
        </View>
        <Pressable style={styles.button} onPress={dismissWelcome}>
          <Text style={styles.buttonLabel}>開始遊戲</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  card: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    transform: [{ translateY: -140 }],
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: '#17171f',
    padding: 18,
    gap: 14,
  },
  title: {
    color: '#c9a94f',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepList: {
    gap: 10,
  },
  step: {
    color: '#e8e8ee',
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4a4456',
  },
  buttonLabel: {
    color: '#f2f2f2',
    fontSize: 14,
    fontWeight: '700',
  },
});
