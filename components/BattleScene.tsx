import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getCompanionById } from '../game/companions';
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

// 特效從勇者側往怪物側移動的來回循環:去程 EFFECT_TRAVEL_MS、停留在怪物旁邊 EFFECT_HOLD_MS
// 後瞬間收回原位再等 EFFECT_REST_MS,呼應「攻擊要往怪物方向打過去」而不是原地播放。
// 怪物受擊反應(HIT_REACT_DELAY_MS)刻意卡在特效差不多「打到」的時間點才觸發,兩邊對得上。
const EFFECT_TRAVEL_MS = 420;
const EFFECT_HOLD_MS = 120;
const EFFECT_REST_MS = 460;
const EFFECT_TRAVEL_DISTANCE = 88;
const HIT_REACT_DELAY_MS = EFFECT_TRAVEL_MS - 60;
const HIT_REACT_PUNCH_MS = 90;
const HIT_REACT_SETTLE_MS = 160;
const HIT_REACT_CYCLE_MS = EFFECT_TRAVEL_MS + EFFECT_HOLD_MS + EFFECT_REST_MS;

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

interface AttackTravelEffectProps {
  frame: string[];
  palette: Record<string, string>;
  active: boolean;
}

// 統一的技能特效插槽:不管職業(近戰/遠程/輔助)長怎樣,一律從勇者旁邊往怪物方向移動再收回,
// 取代原本近戰/遠程/輔助各自寫死一個靜態位置的做法——那樣看起來只是特效疊在旁邊,沒有「打過去」的感覺。
function AttackTravelEffect({ frame, palette, active }: AttackTravelEffectProps) {
  const travel = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      travel.value = 0;
      return;
    }
    travel.value = withRepeat(
      withSequence(
        withTiming(1, { duration: EFFECT_TRAVEL_MS, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: EFFECT_HOLD_MS }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: EFFECT_REST_MS })
      ),
      -1,
      false
    );
  }, [active, travel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: travel.value * EFFECT_TRAVEL_DISTANCE }],
    opacity: active ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.effectSlot, animatedStyle]}>
      <PixelSprite frame={frame} palette={palette} pixelSize={3} />
    </Animated.View>
  );
}

interface MonsterHitReactionProps {
  active: boolean;
  children: React.ReactNode;
}

// 怪物受擊反應:跟 AttackTravelEffect 用同一個週期長度、延遲到特效差不多飛到的時間點才觸發,
// 短促縮放一下(punch)再彈回原尺寸,模擬「被打到震一下」,不是一直閃爍那種吵的做法。
function MonsterHitReaction({ active, children }: MonsterHitReactionProps) {
  const punch = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      punch.value = 1;
      return;
    }
    punch.value = withRepeat(
      withSequence(
        withDelay(HIT_REACT_DELAY_MS, withTiming(1.12, { duration: HIT_REACT_PUNCH_MS })),
        withTiming(1, { duration: HIT_REACT_SETTLE_MS }),
        withTiming(1, { duration: HIT_REACT_CYCLE_MS - HIT_REACT_DELAY_MS - HIT_REACT_PUNCH_MS - HIT_REACT_SETTLE_MS })
      ),
      -1,
      false
    );
  }, [active, punch]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: punch.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
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

      {/* 勇者從場景正中央移到左側站位,跟右側的怪物拉開距離,中間讓給往返移動的技能特效。 */}
      <View style={styles.heroSlot}>
        <HeroSprite pixelSize={HERO_PIXEL_SIZE} bodyType={bodyType} equipment={equipment} onPress={boostCurrentFight} />
      </View>

      {pet && (
        <View style={styles.petSlot}>
          <PixelSprite {...getCompanionFrame('pet', pet.rarity)} pixelSize={COMPANION_PIXEL_SIZE} />
        </View>
      )}

      <AttackTravelEffect frame={effect.frame} palette={effect.palette} active={!!currentEncounter} />

      {currentEncounter && (
        <View key={fightStartedAt ?? 'none'} style={styles.monsterSlot}>
          <MonsterHitReaction active={!!currentEncounter}>
            <PixelSprite
              frame={getMonsterFrame(currentEncounter.monster.id).frame}
              palette={getMonsterFrame(currentEncounter.monster.id).palette}
              pixelSize={MONSTER_PIXEL_SIZE}
            />
          </MonsterHitReaction>
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
  // 勇者靠左站位,不再橫跨整個場景寬度置中——固定 left 距離,搭配怪物側的 right 距離,
  // 版面才會讀成「兩邊對打、中間有空間」而不是勇者疊在怪物正前方。
  heroSlot: {
    position: 'absolute',
    left: 8,
    bottom: 20,
  },
  mountSlot: {
    position: 'absolute',
    left: 4,
    bottom: 12,
  },
  petSlot: {
    position: 'absolute',
    left: 0,
    bottom: 60,
  },
  monsterSlot: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    alignItems: 'center',
  },
  // 特效插槽的靜止基準點在勇者跟怪物中間偏左,往右移動 EFFECT_TRAVEL_DISTANCE 之後
  // 大致落在怪物腳邊,呼應「打過去」的方向性。
  effectSlot: {
    position: 'absolute',
    left: 110,
    bottom: 44,
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
