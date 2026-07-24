import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useToast } from '../hooks/useToast';

// 全域單例,掛在 app/index.tsx 根層級一次;任何地方呼叫 useToast().show(text) 就會浮現。
export function ToastHost() {
  const message = useToast((state) => state.message);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(message !== null ? 1 : 0, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [message, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (message === null) return null;

  return (
    // position:fixed 的定位一定要放在最外層的普通 View,不能直接放在 Animated.View 上——
    // reanimated 在 web 上會幫動畫元件的 style 額外掛一個 transform,一旦父層有 transform,
    // CSS 規則會讓子層的 position:fixed 改成相對那個 transform 祖先定位,而不是相對整個視窗,
    // 疊圖高度就會被拉回原本元件樹的層級,蓋不過後面才開的 Modal(職業分頁按鈕觸發的提示就是這樣被擋住)。
    <View style={styles.fixedLayer} pointerEvents="none">
      <Animated.View style={[styles.container, animatedStyle]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // bottom:24 原本會蓋住底下常駐的 TabBar(icon+label 那排大概佔螢幕最下方 ~90px),
  // 每次跳toast(例如成就達成)玩家就看不到、點不到分頁列文字——改成 bottom:104,
  // 讓toast浮在TabBar正上方而不是疊在上面(TabBar本身不是fixed,高度隨內容變動時
  // 這個距離抓的是常見情境下的安全值,不用逐畫面精算)。
  fixedLayer: {
    position: 'fixed' as 'absolute',
    left: 20,
    right: 20,
    bottom: 104,
    zIndex: 99999,
  },
  container: {
    backgroundColor: '#17171fee',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#59462b',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  text: {
    color: '#f2f2f2',
    fontSize: 12,
    lineHeight: 18,
  },
});
