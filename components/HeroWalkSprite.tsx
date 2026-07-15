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

import { Archetype, getCurrentTier, JobBranch } from '../game/combat';
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

// 一階美術:magicMelee(中二國中生)是重生過的版本(原圖畫風落差較大,已換成跟其他幾張
// 一致的白底風格)。其餘職業缺圖時 art 選擇邏輯會 fallback 回學生圖(見下面 HeroWalkSprite
// 內的 art 判斷),目前 6 種都齊了,Partial 型別留著方便之後單獨抽換/重生某一款。
const JOB_ART: Partial<Record<Archetype, HeroArt>> = {
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
    openAspectRatio: 370 / 734,
    clickAspectRatio: 417 / 734,
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

// 二階美術:分支 A/B 從這階開始外觀分岔,所以用 Archetype+JobBranch 兩層 key,跟一階
// (不分分支,單一 Archetype key)結構不同。
const TIER2_ART: Record<Archetype, Record<JobBranch, HeroArt>> = {
  physicalMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs2/physicalMelee_A.png'),
      click: require('../assets/sprites/hero/jobs2/physicalMelee_A_click.png'),
      openAspectRatio: 360 / 746,
      clickAspectRatio: 443 / 746,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/physicalMelee_B.png'),
      click: require('../assets/sprites/hero/jobs2/physicalMelee_B_click.png'),
      openAspectRatio: 342 / 746,
      clickAspectRatio: 443 / 746,
    },
  },
  physicalRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs2/physicalRanged_A.png'),
      click: require('../assets/sprites/hero/jobs2/physicalRanged_A_click.png'),
      openAspectRatio: 464 / 740,
      clickAspectRatio: 437 / 740,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/physicalRanged_B.png'),
      click: require('../assets/sprites/hero/jobs2/physicalRanged_B_click.png'),
      openAspectRatio: 458 / 740,
      clickAspectRatio: 437 / 740,
    },
  },
  physicalSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs2/physicalSupport_A.png'),
      click: require('../assets/sprites/hero/jobs2/physicalSupport_A_click.png'),
      openAspectRatio: 400 / 734,
      clickAspectRatio: 437 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/physicalSupport_B.png'),
      click: require('../assets/sprites/hero/jobs2/physicalSupport_B_click.png'),
      openAspectRatio: 382 / 734,
      clickAspectRatio: 365 / 734,
    },
  },
  magicMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs2/magicMelee_A.png'),
      click: require('../assets/sprites/hero/jobs2/magicMelee_A_click.png'),
      openAspectRatio: 365 / 734,
      clickAspectRatio: 300 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/magicMelee_B.png'),
      click: require('../assets/sprites/hero/jobs2/magicMelee_B_click.png'),
      openAspectRatio: 458 / 752,
      clickAspectRatio: 449 / 734,
    },
  },
  magicRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs2/magicRanged_A.png'),
      click: require('../assets/sprites/hero/jobs2/magicRanged_A_click.png'),
      openAspectRatio: 294 / 734,
      clickAspectRatio: 418 / 740,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/magicRanged_B.png'),
      click: require('../assets/sprites/hero/jobs2/magicRanged_B_click.png'),
      openAspectRatio: 434 / 734,
      clickAspectRatio: 414 / 734,
    },
  },
  magicSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs2/magicSupport_A.png'),
      click: require('../assets/sprites/hero/jobs2/magicSupport_A_click.png'),
      openAspectRatio: 417 / 734,
      clickAspectRatio: 414 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/magicSupport_B.png'),
      click: require('../assets/sprites/hero/jobs2/magicSupport_B_click.png'),
      openAspectRatio: 417 / 734,
      clickAspectRatio: 417 / 734,
    },
  },
};

interface HeroWalkSpriteProps {
  height?: number;
  onPress?: () => void;
}

export function HeroWalkSprite({ height = 98, onPress }: HeroWalkSpriteProps) {
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const archetype = useGameState((state) => state.job.archetype);
  const branch = useGameState((state) => state.job.branch);
  const level = useGameState((state) => state.level.level);

  const currentTier = getCurrentTier(level);
  const art = !hasChosenJob
    ? STUDENT_ART
    : currentTier >= 2
      ? TIER2_ART[archetype][branch]
      : (JOB_ART[archetype] ?? STUDENT_ART);
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
