import { useEffect, useRef, useState } from 'react';
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
// 每個角色都有 open/click 兩張圖(來源三聯圖的最左格/最右格),平常顯示 open,點擊後短暫換成
// click 那張再彈回來,呼應原本 PixelSprite 版本「點擊有反應」的手感。動作靠既有的上下 bob
// 位移(沿用原 HeroSprite 的手法)呈現生氣,不是逐格播放動畫。
const CLICK_REACTION_MS = 500;

interface HeroArt {
  open: ImageSourcePropType;
  click: ImageSourcePropType;
  openAspectRatio: number;
  clickAspectRatio: number;
}

const STUDENT_ART: HeroArt = {
  open: require('../assets/sprites/hero/student.png'),
  click: require('../assets/sprites/hero/student_click.png'),
  openAspectRatio: 353 / 746,
  clickAspectRatio: 355 / 746,
};

const JOB_ART: Record<Archetype, HeroArt> = {
  physicalMelee: {
    open: require('../assets/sprites/hero/jobs/physicalMelee.png'),
    click: require('../assets/sprites/hero/jobs/physicalMelee_click.png'),
    openAspectRatio: 458 / 746,
    clickAspectRatio: 396 / 746,
  },
  physicalRanged: {
    open: require('../assets/sprites/hero/jobs/physicalRanged.png'),
    click: require('../assets/sprites/hero/jobs/physicalRanged_click.png'),
    openAspectRatio: 440 / 746,
    clickAspectRatio: 426 / 740,
  },
  physicalSupport: {
    open: require('../assets/sprites/hero/jobs/physicalSupport.png'),
    click: require('../assets/sprites/hero/jobs/physicalSupport_click.png'),
    openAspectRatio: 364 / 716,
    clickAspectRatio: 396 / 722,
  },
  magicMelee: {
    open: require('../assets/sprites/hero/jobs/magicMelee.png'),
    click: require('../assets/sprites/hero/jobs/magicMelee_click.png'),
    openAspectRatio: 469 / 768,
    clickAspectRatio: 460 / 768,
  },
  magicRanged: {
    open: require('../assets/sprites/hero/jobs/magicRanged.png'),
    click: require('../assets/sprites/hero/jobs/magicRanged_click.png'),
    openAspectRatio: 446 / 716,
    clickAspectRatio: 404 / 728,
  },
  magicSupport: {
    open: require('../assets/sprites/hero/jobs/magicSupport.png'),
    click: require('../assets/sprites/hero/jobs/magicSupport_click.png'),
    openAspectRatio: 382 / 716,
    clickAspectRatio: 414 / 722,
  },
};

interface HeroWalkSpriteProps {
  height?: number;
  onPress?: () => void;
}

export function HeroWalkSprite({ height = 98, onPress }: HeroWalkSpriteProps) {
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const archetype = useGameState((state) => state.job.archetype);

  const art = hasChosenJob ? JOB_ART[archetype] : STUDENT_ART;
  const [showClickArt, setShowClickArt] = useState(false);
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(clickTimeout.current);
  }, []);

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
    setShowClickArt(true);
    clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => setShowClickArt(false), CLICK_REACTION_MS);
    onPress?.();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }, { scale: pressScale.value }],
  }));

  const source = showClickArt ? art.click : art.open;
  const aspectRatio = showClickArt ? art.clickAspectRatio : art.openAspectRatio;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Image source={source} style={{ height, width: height * aspectRatio }} resizeMode="contain" />
      </Animated.View>
    </Pressable>
  );
}
