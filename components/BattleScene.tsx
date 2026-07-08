import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { getArchetypeComposition } from '../game/combat';
import { getAttackEffect } from '../game/sprites/attackEffects';
import { getMonsterFrame } from '../game/sprites/monsters';
import { useGameState } from '../hooks/useGameState';
import { HeroSprite } from './HeroSprite';
import { PixelSprite } from './PixelSprite';

const SCENE_HEIGHT = 130;
const HERO_PIXEL_SIZE = 4;
const MONSTER_PIXEL_SIZE = 4;
const GROUND_PATTERN_WIDTH = 40;
const GROUND_SCROLL_DURATION = 1400;

// 底下持續往左捲動的地面刻度線,製造「勇者往右前進」的錯覺,跟戰鬥狀態無關,一直跑。
function GroundScroll() {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(-GROUND_PATTERN_WIDTH, { duration: GROUND_SCROLL_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View style={styles.groundTrack}>
      <Animated.View style={[styles.groundStrip, animatedStyle]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.groundDash} />
        ))}
      </Animated.View>
    </View>
  );
}

export function BattleScene() {
  const bodyType = useGameState((state) => state.bodyType);
  const equipment = useGameState((state) => state.equipment);
  const job = useGameState((state) => state.job);
  const currentEncounter = useGameState((state) => state.currentEncounter);
  const fightStartedAt = useGameState((state) => state.fightStartedAt);
  const fightElapsedMs = useGameState((state) => state.fightElapsedMs);
  const boostCurrentFight = useGameState((state) => state.boostCurrentFight);

  const { subtype, damageType } = getArchetypeComposition(job.archetype);
  const effect = getAttackEffect(subtype, damageType);

  const progress = currentEncounter ? Math.min(1, fightElapsedMs / currentEncounter.fightDurationMs) : 0;

  return (
    <View style={styles.scene}>
      <GroundScroll />

      <View style={styles.heroSlot}>
        <HeroSprite pixelSize={HERO_PIXEL_SIZE} bodyType={bodyType} equipment={equipment} onPress={boostCurrentFight} />
      </View>

      {currentEncounter && subtype === 'support' && (
        <View style={styles.supportEffectSlot}>
          <PixelSprite frame={effect.frame} palette={effect.palette} pixelSize={3} />
        </View>
      )}

      {currentEncounter && subtype === 'ranged' && (
        <View style={styles.rangedEffectSlot}>
          <PixelSprite frame={effect.frame} palette={effect.palette} pixelSize={3} />
        </View>
      )}

      {currentEncounter && (
        <View key={fightStartedAt ?? 'none'} style={styles.monsterSlot}>
          {subtype === 'melee' && (
            <View style={styles.meleeEffectOverlay}>
              <PixelSprite frame={effect.frame} palette={effect.palette} pixelSize={3} />
            </View>
          )}
          <PixelSprite
            frame={getMonsterFrame(currentEncounter.monster.id).frame}
            palette={getMonsterFrame(currentEncounter.monster.id).palette}
            pixelSize={MONSTER_PIXEL_SIZE}
          />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: '100%',
    maxWidth: 320,
    height: SCENE_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  groundTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    height: 2,
    overflow: 'hidden',
  },
  groundStrip: {
    flexDirection: 'row',
    width: GROUND_PATTERN_WIDTH * 2,
  },
  groundDash: {
    width: 3,
    height: 2,
    marginRight: 1,
    backgroundColor: '#3a3542',
  },
  heroSlot: {
    position: 'absolute',
    left: 12,
    bottom: 20,
  },
  monsterSlot: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    alignItems: 'center',
  },
  meleeEffectOverlay: {
    position: 'absolute',
    left: -18,
    top: '35%',
  },
  rangedEffectSlot: {
    position: 'absolute',
    left: '48%',
    bottom: 40,
  },
  supportEffectSlot: {
    position: 'absolute',
    left: 4,
    bottom: 50,
  },
  progressTrack: {
    marginTop: 6,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2a2a35',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c9a94f',
  },
});
