import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
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
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#17171fee',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a45',
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 1000,
  },
  text: {
    color: '#f2f2f2',
    fontSize: 12,
    lineHeight: 18,
  },
});
