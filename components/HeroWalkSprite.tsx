import { useEffect, useRef, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Archetype, getCurrentTier, JobBranch, JobTier } from '../game/combat';
import { getItemById } from '../game/equipment';
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

// 主手武器圖示:AI 畫的通用武器圖示(非「畫在角色身上的裝備」,是疊在角色手邊的獨立
// 物件),跟角色圖示同一套「原生像素座標 + 顯示時等比縮放」手法——nativeCharHeight 對到
// 該角色圖原生高度,weaponNativeHeight/pasteX/pasteY 都是在那個原生尺寸下量出來的手部
// 位置,顯示時乘上 (height / nativeCharHeight) 縮放,不管 HeroWalkSprite 的 height prop
// 傳多少都能對齊。拳擊館學員(tier2 分支B)雙手是拳擊手套格鬥姿勢,沒地方握,改成
// floating:true 浮在身側搖擺。其餘職業/分支尚未校準座標,也還沒配圖,先不疊。
interface WeaponAnchor {
  nativeCharHeight: number;
  weaponNativeHeight: number;
  pasteX: number;
  pasteY: number;
  // 拳擊館學員雙手是拳擊手套格鬥姿勢,武器沒地方「握」,改成浮在身側持續搖擺,
  // 不嘗試對齊手部——呼應「反差萌」的荒謬感(打拳打到一半旁邊還飄著一把武器)。
  floating?: boolean;
}

const PHYSICAL_MELEE_WEAPON_ANCHORS: Partial<Record<'tier1' | 'tier2A' | 'tier2B', WeaponAnchor>> = {
  tier1: { nativeCharHeight: 746, weaponNativeHeight: 210, pasteX: 300, pasteY: 400 },
  tier2A: { nativeCharHeight: 746, weaponNativeHeight: 200, pasteX: 250, pasteY: 430 },
  tier2B: { nativeCharHeight: 746, weaponNativeHeight: 190, pasteX: 260, pasteY: 260, floating: true },
};
const WEAPON_SWING_DEG = 16;
const WEAPON_SWING_MS = 700;

// 武器圖示:5 階各一組單手/雙手,對應 game/equipment.ts 的 WEAPON_NOUNS_BY_TIER
// physicalMelee 那份命名(工作手套/鐵鎚 → 突擊步槍),裁自同一張 2x5 網格生成圖,
// 部分工具原始生成方向朝左,已鏡像成統一朝右(跟角色慣用的攻擊方向一致)。
interface WeaponIconData {
  source: ImageSourcePropType;
  aspectRatio: number;
}

const PHYSICAL_MELEE_WEAPON_ICONS: Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }> = {
  1: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_1h.png'), aspectRatio: 293 / 262 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t1_2h.png'), aspectRatio: 282 / 281 },
  },
  2: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_1h.png'), aspectRatio: 285 / 232 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t2_2h.png'), aspectRatio: 307 / 297 },
  },
  3: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_1h.png'), aspectRatio: 394 / 254 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t3_2h.png'), aspectRatio: 408 / 292 },
  },
  4: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_1h.png'), aspectRatio: 280 / 307 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t4_2h.png'), aspectRatio: 355 / 307 },
  },
  5: {
    oneHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_1h.png'), aspectRatio: 375 / 228 },
    twoHanded: { source: require('../assets/sprites/items/physicalMelee/physicalMelee_t5_2h.png'), aspectRatio: 387 / 218 },
  },
};

const WEAPON_ICONS: Partial<Record<Archetype, Record<JobTier, { oneHanded: WeaponIconData; twoHanded: WeaponIconData }>>> = {
  physicalMelee: PHYSICAL_MELEE_WEAPON_ICONS,
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
  const mainhandId = useGameState((state) => state.equipment.mainhand);

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

  // 武器疊圖只在「開啟畫格」顯示(showClickArt 期間先隱藏,姿勢不同、座標校準不了),
  // 只有裝備了主手武器、該武器所屬職業有配圖、且目前是校準過座標的姿勢才顯示。
  const mainhandItem = mainhandId !== undefined ? getItemById(mainhandId) : undefined;
  const weaponIcon = mainhandItem
    ? WEAPON_ICONS[mainhandItem.archetype ?? archetype]?.[getCurrentTier(mainhandItem.requiredLevel ?? 1)][
        mainhandItem.twoHanded ? 'twoHanded' : 'oneHanded'
      ]
    : undefined;

  const weaponAnchor =
    !showClickArt && weaponIcon !== undefined && hasChosenJob && archetype === 'physicalMelee'
      ? currentTier === 1
        ? PHYSICAL_MELEE_WEAPON_ANCHORS.tier1
        : currentTier >= 2
          ? branch === 'A'
            ? PHYSICAL_MELEE_WEAPON_ANCHORS.tier2A
            : PHYSICAL_MELEE_WEAPON_ANCHORS.tier2B
          : undefined
      : undefined;

  const weaponSwing = useSharedValue(0);
  useEffect(() => {
    if (!weaponAnchor?.floating) {
      weaponSwing.value = 0;
      return;
    }
    weaponSwing.value = withRepeat(
      withSequence(
        withTiming(WEAPON_SWING_DEG, { duration: WEAPON_SWING_MS, easing: Easing.inOut(Easing.quad) }),
        withTiming(-WEAPON_SWING_DEG, { duration: WEAPON_SWING_MS, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [weaponAnchor?.floating, weaponSwing]);

  const weaponAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${weaponSwing.value}deg` }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <View style={{ height, width: height * aspectRatio }}>
          <Image source={source} style={{ height, width: height * aspectRatio }} resizeMode="contain" />
          {weaponAnchor && weaponIcon && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: weaponAnchor.pasteX * (height / weaponAnchor.nativeCharHeight),
                  top: weaponAnchor.pasteY * (height / weaponAnchor.nativeCharHeight),
                },
                weaponAnchor.floating && weaponAnimatedStyle,
              ]}
            >
              <Image
                source={weaponIcon.source}
                style={{
                  height: weaponAnchor.weaponNativeHeight * (height / weaponAnchor.nativeCharHeight),
                  width: weaponAnchor.weaponNativeHeight * (height / weaponAnchor.nativeCharHeight) * weaponIcon.aspectRatio,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
