import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { EquipmentLoadout, getEquippedOverlays } from '../game/equipment';
import { BodyType, buildHeroFrames, HERO_PALETTE } from '../game/sprites/heroSilhouette';
import { getWeaponFrame } from '../game/sprites/weapons';
import { playClick } from '../lib/sounds';
import { PixelSprite } from './PixelSprite';

interface HeroSpriteProps {
  bodyType?: BodyType;
  equipment?: EquipmentLoadout;
  pixelSize?: number;
  onPress?: () => void;
}

export function HeroSprite({ bodyType = 'normal', equipment, pixelSize = 6, onPress }: HeroSpriteProps) {
  const frames = useMemo(() => buildHeroFrames(bodyType), [bodyType]);
  const overlays = useMemo(() => getEquippedOverlays(equipment ?? {}), [equipment]);
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

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <View style={{ position: 'relative' }}>
          <PixelSprite frame={blinking ? frames.blink : frames.open} palette={HERO_PALETTE} pixelSize={pixelSize} />
          {overlays.map((overlay, index) => {
            const wrapperStyle = {
              position: 'absolute' as const,
              left: overlay.rect.x * pixelSize,
              top: overlay.rect.y * pixelSize,
            };
            // 主手武器用專屬外型(game/sprites/weapons.ts)取代純色色塊,其餘槽位維持色塊疊圖。
            if (overlay.slot === 'mainhand') {
              const weapon = getWeaponFrame(overlay.item.archetype, overlay.item.twoHanded);
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
        </View>
      </Animated.View>
    </Pressable>
  );
}
