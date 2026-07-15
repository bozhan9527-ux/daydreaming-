import { useEffect } from 'react';
import { Image, ImageSourcePropType, Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Archetype } from '../game/combat';
import { useGameState } from '../hooks/useGameState';
import { playClick } from '../lib/sounds';

// AI 美術測試:戰鬥畫面專用的勇者圖,取代 PixelSprite 程式產生的方塊小人。畢業前(!hasChosenJob)
// 顯示「學生」單張圖,畢業選定主職後改顯示對應職業的一階美術圖(素材見 assets/art-drafts,
// 已去背裁切,對應 assets/sprites/hero/jobs/)。沒有裝備疊圖機制,裝備之後要接上再另外設計。
// 單張靜態圖,動作靠既有的上下 bob 位移(沿用原 HeroSprite 的手法)呈現生氣,不是逐格播放動畫。
const STUDENT_ART: ImageSourcePropType = require('../assets/sprites/hero/student.png');
const STUDENT_ASPECT_RATIO = 353 / 746;

const JOB_ART: Record<Archetype, { source: ImageSourcePropType; aspectRatio: number }> = {
  physicalMelee: { source: require('../assets/sprites/hero/jobs/physicalMelee.png'), aspectRatio: 458 / 746 },
  physicalRanged: { source: require('../assets/sprites/hero/jobs/physicalRanged.png'), aspectRatio: 440 / 746 },
  physicalSupport: { source: require('../assets/sprites/hero/jobs/physicalSupport.png'), aspectRatio: 364 / 716 },
  magicMelee: { source: require('../assets/sprites/hero/jobs/magicMelee.png'), aspectRatio: 469 / 768 },
  magicRanged: { source: require('../assets/sprites/hero/jobs/magicRanged.png'), aspectRatio: 446 / 716 },
  magicSupport: { source: require('../assets/sprites/hero/jobs/magicSupport.png'), aspectRatio: 382 / 716 },
};

interface HeroWalkSpriteProps {
  height?: number;
  onPress?: () => void;
}

export function HeroWalkSprite({ height = 98, onPress }: HeroWalkSpriteProps) {
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const archetype = useGameState((state) => state.job.archetype);

  const art = hasChosenJob ? JOB_ART[archetype] : { source: STUDENT_ART, aspectRatio: STUDENT_ASPECT_RATIO };

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
        <Image source={art.source} style={{ height, width: height * art.aspectRatio }} resizeMode="contain" />
      </Animated.View>
    </Pressable>
  );
}
