import { useEffect, useMemo, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getCurrentTier } from '../game/combat';
import { EquipmentLoadout, EquipmentSlot, getEquippedOverlays, SLOT_ANCHORS } from '../game/equipment';
import { BodyType, buildHeroFrames, HERO_PALETTE } from '../game/sprites/heroSilhouette';
import { getWeaponFrame } from '../game/sprites/weapons';
import { playClick } from '../lib/sounds';
import { PixelSprite } from './PixelSprite';

const ALL_SLOTS: EquipmentSlot[] = ['back', 'bottom', 'top', 'belt', 'headwear', 'face', 'gloves', 'offhand', 'mainhand'];

// 靜態 AI 美術測試用 fallback:目前只有 normal 體型一張測試圖,沒裝備時才套用。
// 覆蓋範圍擴大(其他體型/裝備疊圖)前先不動 game/sprites 的程式產生管線。
const STATIC_HERO_ART: Partial<Record<BodyType, ImageSourcePropType>> = {
  normal: require('../assets/sprites/hero/hero_test_normal.png'),
};
const STATIC_ART_ASPECT_RATIO = 172 / 197;

interface HeroSpriteProps {
  bodyType?: BodyType;
  equipment?: EquipmentLoadout;
  pixelSize?: number;
  onPress?: () => void;
  // 裝備圖鑑用:在空插槽的位置畫虛線框,讓玩家看得出「這個位置可以裝什麼」,跟一般戰鬥場景無關。
  showEmptySlotHints?: boolean;
  // 倒地恢復期間常駐閉眼,借用既有的眨眼畫格(不是新畫一組表情)——見 BattleScene.tsx
  // 的呼叫端。true 時蓋掉底下正常的眨眼週期,不會兩者互相打架。
  isDefeated?: boolean;
}

export function HeroSprite({
  bodyType = 'normal',
  equipment,
  pixelSize = 6,
  onPress,
  showEmptySlotHints = false,
  isDefeated = false,
}: HeroSpriteProps) {
  const frames = useMemo(() => buildHeroFrames(bodyType), [bodyType]);
  const overlays = useMemo(() => getEquippedOverlays(equipment ?? {}), [equipment]);
  const emptySlots = useMemo(
    () => (showEmptySlotHints ? ALL_SLOTS.filter((slot) => !equipment?.[slot]) : []),
    [showEmptySlotHints, equipment]
  );
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setBlinking(true);
      blinkTimeout = setTimeout(() => setBlinking(false), 180);
    }, 2600);
    return () => {
      clearInterval(interval);
      clearTimeout(blinkTimeout);
    };
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
    onPress?.();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }, { scale: pressScale.value }],
  }));

  const staticArt = overlays.length === 0 ? STATIC_HERO_ART[bodyType] : undefined;
  if (staticArt !== undefined) {
    const displayHeight = pixelSize * frames.open.length;
    return (
      <Pressable onPress={handlePress}>
        <Animated.View style={animatedStyle}>
          <Image
            source={staticArt}
            style={{ height: displayHeight, width: displayHeight * STATIC_ART_ASPECT_RATIO }}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <View style={{ position: 'relative' }}>
          <PixelSprite frame={isDefeated || blinking ? frames.blink : frames.open} palette={HERO_PALETTE} pixelSize={pixelSize} />
          {overlays.map((overlay, index) => {
            const wrapperStyle = {
              position: 'absolute' as const,
              left: overlay.rect.x * pixelSize,
              top: overlay.rect.y * pixelSize,
            };
            // 主手武器用專屬外型(game/sprites/weapons.ts)取代純色色塊,其餘槽位維持色塊疊圖。
            if (overlay.slot === 'mainhand') {
              const weapon = getWeaponFrame(overlay.item.archetype, overlay.item.twoHanded, getCurrentTier(overlay.item.requiredLevel ?? 1));
              return (
                <View key={index} style={wrapperStyle}>
                  <PixelSprite frame={weapon.frame} palette={{ [weapon.fillKey]: overlay.color }} pixelSize={pixelSize} />
                </View>
              );
            }
            return (
              <View
                key={index}
                style={{
                  ...wrapperStyle,
                  width: overlay.rect.w * pixelSize,
                  height: overlay.rect.h * pixelSize,
                  backgroundColor: overlay.color,
                }}
              />
            );
          })}
          {emptySlots.flatMap((slot) =>
            SLOT_ANCHORS[slot].map((rect, index) => (
              <View
                key={`${slot}-${index}`}
                style={{
                  position: 'absolute' as const,
                  left: rect.x * pixelSize,
                  top: rect.y * pixelSize,
                  width: rect.w * pixelSize,
                  height: rect.h * pixelSize,
                  borderWidth: 1,
                  borderStyle: 'dashed' as const,
                  borderColor: '#9a94b8',
                }}
              />
            ))
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
