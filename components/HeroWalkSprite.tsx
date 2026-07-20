import { useEffect, useRef, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Archetype, JobBranch } from '../game/combat';
import { useGameState } from '../hooks/useGameState';
import { playClick } from '../lib/sounds';

// AI 美術測試:戰鬥畫面專用的勇者圖,取代 PixelSprite 程式產生的方塊小人。畢業前(!hasChosenJob)
// 顯示「學生」單張圖,畢業選定主職後改顯示對應職業的一階美術圖(素材見 assets/art-drafts,
// 已去背裁切,對應 assets/sprites/hero/jobs/)。武器圖示不疊在這裡——維持跟舊版程式特效相同的
// 固定位置,改由 BattleScene.tsx 的 WeaponSwingEffect 統一處理(見該檔案註解)。
// 每個角色都有 open/click 兩張圖(來源三聯圖的最左格/最右格),平常顯示 open,點擊後短暫換成
// click 那張再彈回來,呼應原本 PixelSprite 版本「點擊有反應」的手感。動作靠既有的上下 bob
// 位移(沿用原 HeroSprite 的手法)呈現生氣,不是逐格播放動畫。
const CLICK_REACTION_MS = 500;

interface HeroArt {
  open: ImageSourcePropType;
  middle: ImageSourcePropType;
  click: ImageSourcePropType;
  openAspectRatio: number;
  middleAspectRatio: number;
  clickAspectRatio: number;
}

const STUDENT_ART: HeroArt = {
  open: require('../assets/sprites/hero/student.png'),
  middle: require('../assets/sprites/hero/student_middle.png'),
  click: require('../assets/sprites/hero/student_click.png'),
  openAspectRatio: 353 / 746,
  middleAspectRatio: 359 / 746,
  clickAspectRatio: 355 / 746,
};

// 一階美術:magicMelee(中二國中生)是重生過的版本(原圖畫風落差較大,已換成跟其他幾張
// 一致的白底風格)。其餘職業缺圖時 art 選擇邏輯會 fallback 回學生圖(見下面 HeroWalkSprite
// 內的 art 判斷),目前 6 種都齊了,Partial 型別留著方便之後單獨抽換/重生某一款。
const JOB_ART: Partial<Record<Archetype, HeroArt>> = {
  physicalMelee: {
    open: require('../assets/sprites/hero/jobs/physicalMelee.png'),
    middle: require('../assets/sprites/hero/jobs/physicalMelee_middle.png'),
    click: require('../assets/sprites/hero/jobs/physicalMelee_click.png'),
    openAspectRatio: 458 / 746,
    middleAspectRatio: 412 / 746,
    clickAspectRatio: 396 / 746,
  },
  physicalRanged: {
    open: require('../assets/sprites/hero/jobs/physicalRanged.png'),
    middle: require('../assets/sprites/hero/jobs/physicalRanged_middle.png'),
    click: require('../assets/sprites/hero/jobs/physicalRanged_click.png'),
    openAspectRatio: 440 / 746,
    middleAspectRatio: 359 / 746,
    clickAspectRatio: 426 / 740,
  },
  physicalSupport: {
    open: require('../assets/sprites/hero/jobs/physicalSupport.png'),
    middle: require('../assets/sprites/hero/jobs/physicalSupport_middle.png'),
    click: require('../assets/sprites/hero/jobs/physicalSupport_click.png'),
    openAspectRatio: 364 / 716,
    middleAspectRatio: 395 / 728,
    clickAspectRatio: 396 / 722,
  },
  magicMelee: {
    open: require('../assets/sprites/hero/jobs/magicMelee.png'),
    middle: require('../assets/sprites/hero/jobs/magicMelee_middle.png'),
    click: require('../assets/sprites/hero/jobs/magicMelee_click.png'),
    openAspectRatio: 370 / 734,
    middleAspectRatio: 476 / 728,
    clickAspectRatio: 417 / 734,
  },
  magicRanged: {
    open: require('../assets/sprites/hero/jobs/magicRanged.png'),
    middle: require('../assets/sprites/hero/jobs/magicRanged_middle.png'),
    click: require('../assets/sprites/hero/jobs/magicRanged_click.png'),
    openAspectRatio: 446 / 716,
    middleAspectRatio: 400 / 734,
    clickAspectRatio: 404 / 728,
  },
  magicSupport: {
    open: require('../assets/sprites/hero/jobs/magicSupport.png'),
    middle: require('../assets/sprites/hero/jobs/magicSupport_middle.png'),
    click: require('../assets/sprites/hero/jobs/magicSupport_click.png'),
    openAspectRatio: 382 / 716,
    middleAspectRatio: 412 / 734,
    clickAspectRatio: 414 / 722,
  },
};

// 二階美術:分支 A/B 從這階開始外觀分岔,所以用 Archetype+JobBranch 兩層 key,跟一階
// (不分分支,單一 Archetype key)結構不同。
const TIER2_ART: Record<Archetype, Record<JobBranch, HeroArt>> = {
  physicalMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs2/physicalMelee_A.png'),
      middle: require('../assets/sprites/hero/jobs2/physicalMelee_A_middle.png'),
      click: require('../assets/sprites/hero/jobs2/physicalMelee_A_click.png'),
      openAspectRatio: 360 / 746,
      middleAspectRatio: 474 / 734,
      clickAspectRatio: 443 / 746,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/physicalMelee_B.png'),
      middle: require('../assets/sprites/hero/jobs2/physicalMelee_B_middle.png'),
      click: require('../assets/sprites/hero/jobs2/physicalMelee_B_click.png'),
      openAspectRatio: 342 / 746,
      middleAspectRatio: 474 / 728,
      clickAspectRatio: 443 / 746,
    },
  },
  physicalRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs2/physicalRanged_A.png'),
      middle: require('../assets/sprites/hero/jobs2/physicalRanged_A_middle.png'),
      click: require('../assets/sprites/hero/jobs2/physicalRanged_A_click.png'),
      openAspectRatio: 464 / 740,
      middleAspectRatio: 418 / 728,
      clickAspectRatio: 437 / 740,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/physicalRanged_B.png'),
      middle: require('../assets/sprites/hero/jobs2/physicalRanged_B_middle.png'),
      click: require('../assets/sprites/hero/jobs2/physicalRanged_B_click.png'),
      openAspectRatio: 458 / 740,
      middleAspectRatio: 441 / 728,
      clickAspectRatio: 437 / 740,
    },
  },
  physicalSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs2/physicalSupport_A.png'),
      middle: require('../assets/sprites/hero/jobs2/physicalSupport_A_middle.png'),
      click: require('../assets/sprites/hero/jobs2/physicalSupport_A_click.png'),
      openAspectRatio: 400 / 734,
      middleAspectRatio: 461 / 728,
      clickAspectRatio: 437 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/physicalSupport_B.png'),
      middle: require('../assets/sprites/hero/jobs2/physicalSupport_B_middle.png'),
      click: require('../assets/sprites/hero/jobs2/physicalSupport_B_click.png'),
      openAspectRatio: 382 / 734,
      middleAspectRatio: 382 / 728,
      clickAspectRatio: 365 / 734,
    },
  },
  magicMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs2/magicMelee_A.png'),
      middle: require('../assets/sprites/hero/jobs2/magicMelee_A_middle.png'),
      click: require('../assets/sprites/hero/jobs2/magicMelee_A_click.png'),
      openAspectRatio: 365 / 734,
      middleAspectRatio: 382 / 728,
      clickAspectRatio: 300 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/magicMelee_B.png'),
      middle: require('../assets/sprites/hero/jobs2/magicMelee_B_middle.png'),
      click: require('../assets/sprites/hero/jobs2/magicMelee_B_click.png'),
      openAspectRatio: 458 / 752,
      middleAspectRatio: 441 / 734,
      clickAspectRatio: 449 / 734,
    },
  },
  magicRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs2/magicRanged_A.png'),
      middle: require('../assets/sprites/hero/jobs2/magicRanged_A_middle.png'),
      click: require('../assets/sprites/hero/jobs2/magicRanged_A_click.png'),
      openAspectRatio: 294 / 734,
      middleAspectRatio: 341 / 734,
      clickAspectRatio: 418 / 740,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/magicRanged_B.png'),
      middle: require('../assets/sprites/hero/jobs2/magicRanged_B_middle.png'),
      click: require('../assets/sprites/hero/jobs2/magicRanged_B_click.png'),
      openAspectRatio: 434 / 734,
      middleAspectRatio: 341 / 734,
      clickAspectRatio: 414 / 734,
    },
  },
  magicSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs2/magicSupport_A.png'),
      middle: require('../assets/sprites/hero/jobs2/magicSupport_A_middle.png'),
      click: require('../assets/sprites/hero/jobs2/magicSupport_A_click.png'),
      openAspectRatio: 417 / 734,
      middleAspectRatio: 330 / 734,
      clickAspectRatio: 414 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs2/magicSupport_B.png'),
      middle: require('../assets/sprites/hero/jobs2/magicSupport_B_middle.png'),
      click: require('../assets/sprites/hero/jobs2/magicSupport_B_click.png'),
      openAspectRatio: 417 / 734,
      middleAspectRatio: 411 / 734,
      clickAspectRatio: 417 / 734,
    },
  },
};

// 三階美術:分支從二階就已經分岔,這階延續同一組 Archetype+JobBranch 兩層 key。
const TIER3_ART: Record<Archetype, Record<JobBranch, HeroArt>> = {
  physicalMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs3/physicalMelee_A_open.png'),
      middle: require('../assets/sprites/hero/jobs3/physicalMelee_A_middle.png'),
      click: require('../assets/sprites/hero/jobs3/physicalMelee_A_click.png'),
      openAspectRatio: 372 / 734,
      middleAspectRatio: 470 / 734,
      clickAspectRatio: 423 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs3/physicalMelee_B_open.png'),
      middle: require('../assets/sprites/hero/jobs3/physicalMelee_B_middle.png'),
      click: require('../assets/sprites/hero/jobs3/physicalMelee_B_click.png'),
      openAspectRatio: 365 / 710,
      middleAspectRatio: 411 / 693,
      clickAspectRatio: 429 / 728,
    },
  },
  physicalRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs3/physicalRanged_A_open.png'),
      middle: require('../assets/sprites/hero/jobs3/physicalRanged_A_middle.png'),
      click: require('../assets/sprites/hero/jobs3/physicalRanged_A_click.png'),
      openAspectRatio: 347 / 716,
      middleAspectRatio: 376 / 699,
      clickAspectRatio: 429 / 734,
    },
    B: {
      open: require('../assets/sprites/hero/jobs3/physicalRanged_B_open.png'),
      middle: require('../assets/sprites/hero/jobs3/physicalRanged_B_middle.png'),
      click: require('../assets/sprites/hero/jobs3/physicalRanged_B_click.png'),
      openAspectRatio: 335 / 710,
      middleAspectRatio: 376 / 693,
      clickAspectRatio: 429 / 728,
    },
  },
  physicalSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs3/physicalSupport_A_open.png'),
      middle: require('../assets/sprites/hero/jobs3/physicalSupport_A_middle.png'),
      click: require('../assets/sprites/hero/jobs3/physicalSupport_A_click.png'),
      openAspectRatio: 347 / 710,
      middleAspectRatio: 376 / 693,
      clickAspectRatio: 441 / 728,
    },
    B: {
      open: require('../assets/sprites/hero/jobs3/physicalSupport_B_open.png'),
      middle: require('../assets/sprites/hero/jobs3/physicalSupport_B_middle.png'),
      click: require('../assets/sprites/hero/jobs3/physicalSupport_B_click.png'),
      openAspectRatio: 365 / 710,
      middleAspectRatio: 376 / 693,
      clickAspectRatio: 441 / 728,
    },
  },
  magicMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs3/magicMelee_A_open.png'),
      middle: require('../assets/sprites/hero/jobs3/magicMelee_A_middle.png'),
      click: require('../assets/sprites/hero/jobs3/magicMelee_A_click.png'),
      openAspectRatio: 312 / 705,
      middleAspectRatio: 394 / 711,
      clickAspectRatio: 447 / 740,
    },
    B: {
      open: require('../assets/sprites/hero/jobs3/magicMelee_B_open.png'),
      middle: require('../assets/sprites/hero/jobs3/magicMelee_B_middle.png'),
      click: require('../assets/sprites/hero/jobs3/magicMelee_B_click.png'),
      openAspectRatio: 365 / 699,
      middleAspectRatio: 436 / 646,
      clickAspectRatio: 380 / 540,
    },
  },
  magicRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs3/magicRanged_A_open.png'),
      middle: require('../assets/sprites/hero/jobs3/magicRanged_A_middle.png'),
      click: require('../assets/sprites/hero/jobs3/magicRanged_A_click.png'),
      openAspectRatio: 359 / 676,
      middleAspectRatio: 412 / 652,
      clickAspectRatio: 430 / 711,
    },
    B: {
      open: require('../assets/sprites/hero/jobs3/magicRanged_B_open.png'),
      middle: require('../assets/sprites/hero/jobs3/magicRanged_B_middle.png'),
      click: require('../assets/sprites/hero/jobs3/magicRanged_B_click.png'),
      openAspectRatio: 262 / 676,
      middleAspectRatio: 377 / 652,
      clickAspectRatio: 394 / 717,
    },
  },
  magicSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs3/magicSupport_A_open.png'),
      middle: require('../assets/sprites/hero/jobs3/magicSupport_A_middle.png'),
      click: require('../assets/sprites/hero/jobs3/magicSupport_A_click.png'),
      openAspectRatio: 343 / 878,
      middleAspectRatio: 453 / 806,
      clickAspectRatio: 485 / 769,
    },
    B: {
      open: require('../assets/sprites/hero/jobs3/magicSupport_B_open.png'),
      middle: require('../assets/sprites/hero/jobs3/magicSupport_B_middle.png'),
      click: require('../assets/sprites/hero/jobs3/magicSupport_B_click.png'),
      openAspectRatio: 359 / 734,
      middleAspectRatio: 487 / 664,
      clickAspectRatio: 365 / 734,
    },
  },
};

// 四階美術:分支延續同一組 Archetype+JobBranch 兩層 key。
const TIER4_ART: Record<Archetype, Record<JobBranch, HeroArt>> = {
  physicalMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs4/physicalMelee_A_open.png'),
      middle: require('../assets/sprites/hero/jobs4/physicalMelee_A_middle.png'),
      click: require('../assets/sprites/hero/jobs4/physicalMelee_A_click.png'),
      openAspectRatio: 430 / 830,
      middleAspectRatio: 527 / 819,
      clickAspectRatio: 413 / 762,
    },
    B: {
      open: require('../assets/sprites/hero/jobs4/physicalMelee_B_open.png'),
      middle: require('../assets/sprites/hero/jobs4/physicalMelee_B_middle.png'),
      click: require('../assets/sprites/hero/jobs4/physicalMelee_B_click.png'),
      openAspectRatio: 414 / 870,
      middleAspectRatio: 457 / 864,
      clickAspectRatio: 437 / 804,
    },
  },
  physicalRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs4/physicalRanged_A_open.png'),
      middle: require('../assets/sprites/hero/jobs4/physicalRanged_A_middle.png'),
      click: require('../assets/sprites/hero/jobs4/physicalRanged_A_click.png'),
      openAspectRatio: 430 / 935,
      middleAspectRatio: 451 / 938,
      clickAspectRatio: 544 / 889,
    },
    B: {
      open: require('../assets/sprites/hero/jobs4/physicalRanged_B_open.png'),
      middle: require('../assets/sprites/hero/jobs4/physicalRanged_B_middle.png'),
      click: require('../assets/sprites/hero/jobs4/physicalRanged_B_click.png'),
      openAspectRatio: 354 / 823,
      middleAspectRatio: 411 / 823,
      clickAspectRatio: 614 / 727,
    },
  },
  physicalSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs4/physicalSupport_A_open.png'),
      middle: require('../assets/sprites/hero/jobs4/physicalSupport_A_middle.png'),
      click: require('../assets/sprites/hero/jobs4/physicalSupport_A_click.png'),
      openAspectRatio: 439 / 871,
      middleAspectRatio: 463 / 894,
      clickAspectRatio: 435 / 800,
    },
    B: {
      open: require('../assets/sprites/hero/jobs4/physicalSupport_B_open.png'),
      middle: require('../assets/sprites/hero/jobs4/physicalSupport_B_middle.png'),
      click: require('../assets/sprites/hero/jobs4/physicalSupport_B_click.png'),
      openAspectRatio: 355 / 923,
      middleAspectRatio: 523 / 911,
      clickAspectRatio: 387 / 827,
    },
  },
  magicMelee: {
    A: {
      open: require('../assets/sprites/hero/jobs4/magicMelee_A_open.png'),
      middle: require('../assets/sprites/hero/jobs4/magicMelee_A_middle.png'),
      click: require('../assets/sprites/hero/jobs4/magicMelee_A_click.png'),
      openAspectRatio: 326 / 872,
      middleAspectRatio: 523 / 866,
      clickAspectRatio: 420 / 792,
    },
    B: {
      open: require('../assets/sprites/hero/jobs4/magicMelee_B_open.png'),
      middle: require('../assets/sprites/hero/jobs4/magicMelee_B_middle.png'),
      click: require('../assets/sprites/hero/jobs4/magicMelee_B_click.png'),
      openAspectRatio: 331 / 897,
      middleAspectRatio: 499 / 886,
      clickAspectRatio: 501 / 794,
    },
  },
  magicRanged: {
    A: {
      open: require('../assets/sprites/hero/jobs4/magicRanged_A_open.png'),
      middle: require('../assets/sprites/hero/jobs4/magicRanged_A_middle.png'),
      click: require('../assets/sprites/hero/jobs4/magicRanged_A_click.png'),
      openAspectRatio: 361 / 921,
      middleAspectRatio: 505 / 914,
      clickAspectRatio: 455 / 813,
    },
    B: {
      open: require('../assets/sprites/hero/jobs4/magicRanged_B_open.png'),
      middle: require('../assets/sprites/hero/jobs4/magicRanged_B_middle.png'),
      click: require('../assets/sprites/hero/jobs4/magicRanged_B_click.png'),
      openAspectRatio: 442 / 980,
      middleAspectRatio: 402 / 988,
      clickAspectRatio: 497 / 917,
    },
  },
  magicSupport: {
    A: {
      open: require('../assets/sprites/hero/jobs4/magicSupport_A_open.png'),
      middle: require('../assets/sprites/hero/jobs4/magicSupport_A_middle.png'),
      click: require('../assets/sprites/hero/jobs4/magicSupport_A_click.png'),
      openAspectRatio: 364 / 955,
      middleAspectRatio: 517 / 966,
      clickAspectRatio: 405 / 893,
    },
    B: {
      open: require('../assets/sprites/hero/jobs4/magicSupport_B_open.png'),
      middle: require('../assets/sprites/hero/jobs4/magicSupport_B_middle.png'),
      click: require('../assets/sprites/hero/jobs4/magicSupport_B_click.png'),
      openAspectRatio: 355 / 923,
      middleAspectRatio: 444 / 905,
      clickAspectRatio: 537 / 834,
    },
  },
};

// 取得目前這個玩家該顯示的勇者美術(學生/一階/二階/三階/四階),戰鬥畫面(HeroWalkSprite)
// 跟裝備分頁的角色預覽(EquipmentPanel)共用同一份資料跟挑選邏輯,不必各自維護一份 require() 表。
// 五階美術尚未處理,currentTier>=4 暫時統一顯示四階圖,等五階圖處理好再另外拆一層判斷。
export function useHeroArt(): HeroArt {
  const hasChosenJob = useGameState((state) => state.hasChosenJob);
  const archetype = useGameState((state) => state.job.archetype);
  const branch = useGameState((state) => state.job.branch);
  const currentTier = useGameState((state) => state.jobTier);

  return !hasChosenJob
    ? STUDENT_ART
    : currentTier >= 4
      ? TIER4_ART[archetype][branch]
      : currentTier === 3
        ? TIER3_ART[archetype][branch]
        : currentTier === 2
          ? TIER2_ART[archetype][branch]
          : (JOB_ART[archetype] ?? STUDENT_ART);
}

interface HeroWalkSpriteProps {
  height?: number;
  onPress?: () => void;
}

export function HeroWalkSprite({ height = 98, onPress }: HeroWalkSpriteProps) {
  const art = useHeroArt();
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
