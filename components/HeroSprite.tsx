import { useEffect, useMemo, useState } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { BodyType, buildHeroFrames, HERO_PALETTE } from '../game/sprites/heroSilhouette';
import { PixelSprite } from './PixelSprite';

interface HeroSpriteProps {
  bodyType?: BodyType;
  pixelSize?: number;
}

export function HeroSprite({ bodyType = 'normal', pixelSize = 6 }: HeroSpriteProps) {
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobOffset.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <PixelSprite frame={blinking ? frames.blink : frames.open} palette={HERO_PALETTE} pixelSize={pixelSize} />
    </Animated.View>
  );
}
