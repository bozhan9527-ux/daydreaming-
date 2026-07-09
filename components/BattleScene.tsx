import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { getCompanionById } from '../game/companions';
import { getArchetypeComposition } from '../game/combat';
import { getAttackEffect } from '../game/sprites/attackEffects';
import { getCompanionFrame } from '../game/sprites/companions';
import { getMonsterFrame } from '../game/sprites/monsters';
import { useGameState } from '../hooks/useGameState';
import { HeroSprite } from './HeroSprite';
import { PixelSprite } from './PixelSprite';

// 場景畫布尺寸固定不變:不管角色/特效怎麼換,SCENE_HEIGHT 都是同一個數字,版面不會因為
// 內容增減而跳動。背景圖(含關卡/小關文字)改由外層 MainVisual 統一繪製並往下延伸到按鈕區,
// 這裡維持透明,只負責角色/怪物/特效的定位。
const SCENE_HEIGHT = 130;
const SCENE_MAX_WIDTH = 320;
// 勇者本體畫布從 20x24 拉高密度到 64x56(約3倍),寵物坐騎/怪物的畫布也跟著放大3倍,
// pixelSize 對應縮小,讓角色/怪物在戰鬥場景裡的物理尺寸跟拉密度之前差不多,不會把畫面撐爆。
// 特效(attackEffects.ts)沒有跟著拉密度,維持原本 pixelSize={3}。
const HERO_PIXEL_SIZE = 1.75;
const MONSTER_PIXEL_SIZE = 4 / 3;
const COMPANION_PIXEL_SIZE = 1;
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
  const companions = useGameState((state) => state.companions);
  const currentEncounter = useGameState((state) => state.currentEncounter);
  const fightStartedAt = useGameState((state) => state.fightStartedAt);
  const fightElapsedMs = useGameState((state) => state.fightElapsedMs);
  const boostCurrentFight = useGameState((state) => state.boostCurrentFight);

  const { subtype } = getArchetypeComposition(job.archetype);
  const effect = getAttackEffect(job.archetype);

  const progress = currentEncounter ? Math.min(1, fightElapsedMs / currentEncounter.fightDurationMs) : 0;

  const mount = companions.equippedMountId ? getCompanionById(companions.equippedMountId) : undefined;
  const pet = companions.equippedPetId ? getCompanionById(companions.equippedPetId) : undefined;

  return (
    <View style={styles.scene}>
      {(currentEncounter?.isBoss || currentEncounter?.isFinalBoss) && (
        <Text style={styles.bossLabel}>{currentEncounter.isFinalBoss ? '⚠ 大魔王來襲' : '⚠ 魔王來襲'}</Text>
      )}

      <GroundScroll />

      {mount && (
        <View style={styles.mountSlot}>
          <PixelSprite {...getCompanionFrame('mount', mount.rarity)} pixelSize={COMPANION_PIXEL_SIZE} />
        </View>
      )}

      <View style={styles.heroSlot}>
        <HeroSprite pixelSize={HERO_PIXEL_SIZE} bodyType={bodyType} equipment={equipment} onPress={boostCurrentFight} />
      </View>

      {pet && (
        <View style={styles.petSlot}>
          <PixelSprite {...getCompanionFrame('pet', pet.rarity)} pixelSize={COMPANION_PIXEL_SIZE} />
        </View>
      )}

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
    maxWidth: SCENE_MAX_WIDTH,
    height: SCENE_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bossLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    textAlign: 'center',
    color: '#e05050',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
  // 角色置中:讓插槽橫跨整個場景寬度、用 alignItems 置中子元素,不管場景實際寬度多少都精準置中,
  // 不用猜測角色圖的像素寬度去手動算 left 位移。
  heroSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
  },
  mountSlot: {
    position: 'absolute',
    left: '50%',
    bottom: 12,
    transform: [{ translateX: -64 }],
  },
  petSlot: {
    position: 'absolute',
    left: '50%',
    bottom: 60,
    transform: [{ translateX: -72 }],
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
