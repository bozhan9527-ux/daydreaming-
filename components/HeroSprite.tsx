import { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BodyType, buildHeroFrames, HERO_PALETTE } from '../game/sprites/heroSilhouette';
import { PixelSprite } from './PixelSprite';

interface HeroSpriteProps {
  bodyType?: BodyType;
  pixelSize?: number;
  onPress?: () => void;
}

export function HeroSprite({ bodyType = 'normal', pixelSize = 6, onPress }: HeroSpriteProps) {
  const frames = useMemo(() => buildHeroFrames(bodyType), [bodyType]);
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
    onPress?.();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }, { scale: pressScale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <PixelSprite frame={blinking ? frames.blink : frames.open} palette={HERO_PALETTE} pixelSize={pixelSize} />
      </Animated.View>
    </Pressable>
  );
}
