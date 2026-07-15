import { useEffect } from 'react';
import { Image, Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { playClick } from '../lib/sounds';

// AI 美術測試:戰鬥畫面專用的勇者圖,取代 PixelSprite 程式產生的方塊小人。目前起始/唯一角色是
// 「學生」(素材見 assets/art-drafts,已去背裁切,對應 assets/sprites/hero/student.png)——
// 不分六大職業、沒有裝備疊圖機制,裝備之後要接上再另外設計。單張靜態圖,動作靠既有的上下
// bob 位移(沿用原 HeroSprite 的手法)呈現生氣,不是逐格播放動畫。
const STUDENT_ART = require('../assets/sprites/hero/student.png');
const ART_ASPECT_RATIO = 353 / 746;

interface HeroWalkSpriteProps {
  height?: number;
  onPress?: () => void;
}

export function HeroWalkSprite({ height = 98, onPress }: HeroWalkSpriteProps) {
  const bobOffset = useSharedValue(0);
  useEffect(() => {
    bobOffset.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [bobOffset]);

  const pressScale = useSharedValue(1);

  function handlePress() {
    pressScale.value = withSequence(
      withTiming(0.85, { duration: 80, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) })
    );
    playClick();
    onPress?.();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }, { scale: pressScale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Image source={STUDENT_ART} style={{ height, width: height * ART_ASPECT_RATIO }} resizeMode="contain" />
      </Animated.View>
    </Pressable>
  );
}
